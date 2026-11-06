/* МР ВНИИПО к СП 7.13130, разд. 4 и п. 5.2 — приточная противодымная вентиляция.
   4.1 лестничные клетки (19)–(37), вентилятор (93), (94); 4.2 лифтовые шахты (43)–(54), вентилятор (95), (96);
   4.3 тамбур-шлюзы (59)–(64); 4.4 компенсация (65), (66); 4.5 зоны безопасности (59), (67)–(69).
   Формулы сверены по изображениям текста МР (meganorm), 06.11.2026. Пределы 20–150 Па — СП 7.13130 п. 7.16 б).
   Пока не реализованы: п. 4.1.2 (одинарная дверь в вестибюль), 4.1.4 (подземные лестницы), 4.2.5–4.2.6 (подземные лифты). */

function vnClim(p) {
  var F = dpuF;
  return F(p + '-ta', 'Ta — наружный воздух, °C', '-19', 'any', 'холодный период, СП 131') + F(p + '-tr', 'Tr — воздух в здании, °C', '20', 'any') +
    F(p + '-va', 'va — скорость ветра, м/с', '4.9', 'any', 'по СП 131 для площадки') + F(p + '-kww', 'kww — наветренный фасад', '0.8', 'any', 'табл. п. 2.3 МР') + F(p + '-kw0', 'kw0 — заветренный фасад', '-0.6', 'any', 'табл. п. 2.3 МР');
}
function vnClimR(p, r) {
  var n = dpuNum; r.ta = n(p + '-ta'); r.tr = n(p + '-tr'); r.va = n(p + '-va'); r.kww = n(p + '-kww'); r.kw0 = n(p + '-kw0');
  r.roa = vnRho(r.ta); r.ror = vnRho(r.tr); r.Ti = 0.5 * (r.ta + r.tr); r.roi = vnRho(r.Ti); /* (21) Ts = Tl = 0,5(Ta + Tr) */
  r.W = 0.25 * (r.kww - r.kw0) * r.roa * r.va * r.va;
  return [[p + '-ta', '', -60, 45], [p + '-tr', '', -10, 45], [p + '-va', '', 0, 40], [p + '-kww', '', -2, 2], [p + '-kw0', '', -2, 2]];
}

/* ---------- 4.1 лестничная клетка ---------- */
function stBlock() {
  var F = dpuF, S = dpuS;
  return '<p class="sub">Подпор незадымляемой лестничной клетки Н2: этаж пожара — 2-й, дверь на нём открыта, дальше вверх этаж за этажом — давление и утечки через закрытые двери, до верхнего этажа. На дверях — от 20 до 150 Па.</p>' +
    vnGrp('Лестничная клетка', S('st-type', 'Размещение', [['a', 'у наружной стены, обособленный выход наружу — (23), (24)'], ['c', 'в центральном ядре, изолированный выход наружу — (35), (24)'], ['d', 'в центральном ядре без выхода наружу, через тамбур-шлюз — (35)']], 'a') +
      F('st-n', 'N — верхний этаж клетки', '17', '1') + F('st-hf', 'Высота этажа, м', '3', 'any') + F('st-hd', 'hd — высота двери на этажах, м', '2.1', 'any') + F('st-fd', 'Fd — площадь двери на этаже, м²', '1.89', 'any') +
      S('st-dr', 'Двери на этажах', [['n', 'обычные: Sda = 5300/ρs'], ['g', 'дымогазонепроницаемые: Sdsm = 60000/ρs']], 'n') + F('st-fs', 'Fs — проекция маршей и площадок, м²', '15', 'any') + F('st-xs', 'ξs — сопротивление клетки', '60', 'any', 'МР п. 4.1.1, если нет данных')) +
    '<div id="st-out">' + vnGrp('Наружный выход — (24)', F('st-fda', 'Fda — площадь двери выхода, м²', '1.89', 'any') + F('st-hda', 'hda — высота двери выхода, м', '2.1', 'any') + F('st-nd', 'n — дверей подряд в выходе', '2', '1') +
      S('st-xr', 'Тамбур выхода ξr', [['0', 'прямой — 0'], ['0.99', 'прямоугольный — 0,99'], ['2.9', 'z-образный — 2,9 (нижняя граница 2,9–4,0)']], '0') + F('st-z', 'z — сопротивление маршей до 2-го этажа', '1', 'any', '1 — два марша')) + '</div>' +
    vnGrp('Наружный воздух — (19)–(22)', vnClim('st')) +
    vnGrp('Этаж пожара — (25)', F('st-gsm', 'Gsm — удаляется дыма с этажа пожара, кг/с', '2', 'any') + F('st-q', 'q — расчётное число клеток с выходом в этот коридор', '1', '1', '1 клетка — 1; p клеток — p − 1')) +
    vnGrp('Окна клетки — (31)', F('st-ks', 'ks — коэффициент формулы (31)', '0', 'any', '0 — окна не учитываю; в тексте МР ks не расшифрован') + F('st-rn', 'Rn — сопротивление воздухопроницанию окон, м²·ч·Па/кг', '1', 'any')) +
    vnGrp('Вентилятор — (93), (94)', F('st-h0', 'h0s — от оголовка клетки до воздухозабора, м', '0', 'any') + F('st-pd', 'Pds — сопротивление воздуховодов от клетки до воздухозабора, Па', '150', 'any', 'из аэродинамического расчёта')) +
    '<div class="barres stres" id="st-res"></div><div class="stanim" id="st-anim"></div><div id="st-tab"></div>' + vnBtns('st', '<button type="button" class="eibtn" id="st-take">Взять Gsm из расчёта дыма</button>') +
    '<details class="issue dpf"><summary>Формулы</summary><div><p>(21) T<sub>s</sub> = 0,5(T<sub>a</sub> + T<sub>r</sub>). Ветер W = 0,25(k<sub>ww</sub> − k<sub>w0</sub>)ρ<sub>a</sub>v<sub>a</sub><sup>2</sup>.</p>' +
    '<p>(23) P<sub>s2</sub> = 20 − g(h<sub>2</sub> + 0,5h<sub>d2</sub>)(ρ<sub>s</sub> − ρ<sub>r</sub>) + W; в центральном ядре (35) — без W.</p>' +
    '<p>(24) G<sub>sa</sub> = {2ρ<sub>s</sub>/[(nξ<sub>d</sub> + ξ<sub>r</sub> + 1)/F<sub>da</sub><sup>2</sup> + 60z/F<sub>s</sub><sup>2</sup>]·[W + 20 − g(h<sub>2</sub> + 0,5h<sub>d2</sub>)(ρ<sub>s</sub> − ρ<sub>r</sub>) + 0,5gh<sub>da</sub>(ρ<sub>a</sub> − ρ<sub>s</sub>)]}<sup>1/2</sup>, ξ<sub>d</sub> = 2,44.</p>' +
    '<p>(25) G<sub>s2</sub> = G<sub>sm</sub>/q; дальше берётся большее из G<sub>s2</sub> и G<sub>sa</sub>. (26) P<sub>s(i+1)</sub> = P<sub>si</sub> + 0,5ξ<sub>s</sub>ρ<sub>s</sub>v<sub>si</sub><sup>2</sup>; (27) G<sub>s(i+1)</sub> = G<sub>si</sub> + ΔG<sub>s(i+1)</sub>; (28) v<sub>si</sub> = G<sub>si</sub>/(ρ<sub>s</sub>F<sub>s</sub>).</p>' +
    '<p>(29), (30) ΔG<sub>sd</sub> = F<sub>d</sub>/S<sup>1/2</sup>·[P<sub>s(i+1)</sub> + g(h<sub>i+1</sub> + 0,5h<sub>d</sub>)(ρ<sub>s</sub> − ρ<sub>r</sub>) − W]<sup>1/2</sup>; в ядре (36), (37) — без W. (31) ΔG<sub>sw</sub> = k<sub>s</sub>[…]<sup>0,67</sup>/R<sub>n</sub>.</p>' +
    '<p>(93) L<sub>v</sub> = 3600G<sub>sN</sub>/ρ<sub>a</sub>; (94) P<sub>sv</sub> = 1,2(P<sub>sN</sub> + gh<sub>sN</sub>(ρ<sub>a</sub> − ρ<sub>s</sub>) + gh<sub>0s</sub>(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>ds</sub>)/ρ<sub>a</sub>. Высота h<sub>i</sub> — от пола 1-го этажа.</p></div></details>' +
    refs([['mr7', '4.1'], ['mr7', '5.2'], ['sp7', '7.16 б)']]);
}
function stCompute() {
  var n = dpuNum, r = { type: $('#st-type').value, N: Math.round(n('st-n')), hf: n('st-hf'), hd: n('st-hd'), Fd: n('st-fd'), dr: $('#st-dr').value, Fs: n('st-fs'), xs: n('st-xs'),
    Fda: n('st-fda'), hda: n('st-hda'), nd: Math.round(n('st-nd')), xr: +$('#st-xr').value, z: n('st-z'), Gsm: n('st-gsm'), q: Math.round(n('st-q')), ks: n('st-ks'), Rn: n('st-rn'),
    h0: n('st-h0'), Pd: n('st-pd'), err: [], warn: [], marks: [], fl: [] };
  var L = vnClimR('st', r).concat([['st-n', '', 3, 120], ['st-hf', '', 0, null, true], ['st-hd', '', 0, null, true], ['st-fd', '', 0, null, true], ['st-fs', '', 0, null, true], ['st-xs', '', 0],
    ['st-gsm', '', 0], ['st-q', '', 1, 20], ['st-ks', '', 0], ['st-rn', '', 0, null, true], ['st-h0', '', -300, 300], ['st-pd', '', 0]]);
  if (r.type !== 'd') L.push(['st-fda', '', 0, null, true], ['st-hda', '', 0, null, true], ['st-nd', '', 1, 4], ['st-z', '', 0]);
  fcNums(L, r.marks); if (vnBad(r)) return r;
  var g = VN_G, ros = r.roi, dro = ros - r.ror, W = r.type === 'a' ? r.W : 0, h = function (i) { return (i - 1) * r.hf; };
  r.ros = ros; r.S = (r.dr === 'g' ? 60000 : 5300) / ros;
  r.P2 = 20 - g * (h(2) + 0.5 * r.hd) * dro + W;
  if (r.type !== 'd') {
    var br = r.W + 20 - g * (h(2) + 0.5 * r.hd) * dro + 0.5 * g * r.hda * (r.roa - ros);
    if (br <= 0) { r.err.push('В формуле (24) под корнем ≤ 0 — проверь температуры и ветер.'); return r; }
    r.Gsa = Math.sqrt(2 * ros / ((r.nd * 2.44 + r.xr + 1) / (r.Fda * r.Fda) + 60 * r.z / (r.Fs * r.Fs)) * br);
  } else r.Gsa = 0;
  r.Gs2 = r.Gsm / r.q; r.G2 = Math.max(r.Gs2, r.Gsa);
  var P = r.P2, G = r.G2, dpmax = 20, rs = 0;
  r.fl.push({ i: 2, P: P, dp: 20, dG: 0, G: G, open: true });
  for (var i = 2; i < r.N; i++) {
    var v = G / (ros * r.Fs); P = P + 0.5 * r.xs * ros * v * v;
    var b = P + g * (h(i + 1) + 0.5 * r.hd) * dro - W, bb = Math.max(b, 0);
    var dGd = r.Fd * Math.sqrt(bb / r.S), dGw = r.type === 'a' && r.ks > 0 ? r.ks * Math.pow(bb, 0.67) / r.Rn : 0;
    G += dGd + dGw;
    r.fl.push({ i: i + 1, P: P, dp: b, dG: dGd + dGw, G: G, v: v });
    if (b > dpmax) dpmax = b;
    if (b >= 150 && !rs) rs = i + 1;
    if (b < 20 && !r.low) r.low = i + 1;
  }
  r.PN = P; r.GN = G; r.dpmax = dpmax; r.rs = rs;
  r.hsN = (r.N - 1) * r.hf;
  r.Lv = 3600 * r.GN / r.roa;
  r.Psv = 1.2 * (r.PN + g * r.hsN * (r.roa - ros) + g * r.h0 * (r.roa - r.ror) + r.Pd) / r.roa;
  if (dro > 0) r.warn.push('Знак тяги — как в МР (29), (36): + g·h·(ρs − ρr). Воздух в клетке (' + dpuFmt(r.Ti, 1) + ' °C) плотнее, чем в здании, поэтому перепад на дверях по МР растёт с высотой. По гидростатике холодный столб даёт обратное, так что сверь результат с другой программой на этом же примере.');
  if (rs) r.warn.push('На ' + rs + '-м этаже перепад на закрытой двери достигает 150 Па (п. 7.16 СП 7, МР п. 4.1.1): клетку не выше этого этажа делить рассечкой на зоны и считать верхнюю зону отдельно — или распределённая подача по высоте.');
  if (r.low) r.warn.push('На ' + r.low + '-м этаже перепад на двери меньше 20 Па — проверь исходные данные (ветер, температуры).');
  return r;
}
function stCalc() {
  if (!$('#st-type')) return;
  $('#st-out').hidden = $('#st-type').value === 'd';
  var r = stCompute(), f = dpuFmt; VN.st = r;
  vnRes('st-res', r, r.err.length ? '' :
    vnC('Вентилятор: подача', f(r.Lv, 0) + ' м³/ч', '(93): ' + f(r.GN, 3) + ' кг/с при ρa = ' + f(r.roa, 3) + ' кг/м³.', 'final') +
    vnC('Вентилятор: давление', f(r.Psv, 0) + ' Па', '(94): в оголовке ' + f(r.PN, 1) + ' Па, высота клетки ' + f(r.hsN, 1) + ' м, сеть ' + f(r.Pd, 0) + ' Па.', 'final') +
    vnC('2-й этаж — пожар', f(r.G2, 3) + ' кг/с', 'Большее из Gs2 = Gsm/q = ' + f(r.Gs2, 3) + ' (25) и Gsa = ' + f(r.Gsa, 3) + ' кг/с — через наружный выход (24).') +
    vnC('Перепад на дверях', 'до ' + f(r.dpmax, 0) + ' Па', r.rs ? 'Больше 150 Па — нужна рассечка.' : 'Не больше 150 Па — п. 7.16 б) СП 7.13130.', r.rs ? 'warn' : '') +
    vnC('Утечки', '+' + f(r.GN - r.G2, 3) + ' кг/с', 'Через закрытые двери ' + (r.ks > 0 && r.type === 'a' ? 'и окна ' : '') + 'этажей 3…' + r.N + '; Sd = ' + f(r.S, 0) + ' м³/кг.'));
  fcApply('st-', r.marks);
  $('#st-tab').innerHTML = r.err.length ? '' : vnTable(['Этаж', 'P в клетке, Па', 'Перепад на двери, Па', 'Утечки, кг/с', 'G, кг/с'], r.fl.map(function (x) { return [x.i + (x.open ? ' — пожар, дверь открыта' : ''), f(x.P, 1), x.open ? '20 (откр.)' : f(x.dp, 1), f(x.dG, 4), f(x.G, 3)]; }));
  $('#st-anim').innerHTML = r.err.length ? '' : vnShaftSvg(r.fl, 'Лестничная клетка', r.Lv, r.Psv, 150);
}
/* схема шахты: этажи снизу вверх, перепад на дверях — цвет (красный ≥ предела), подача сверху */
function vnShaftSvg(fl, name, Lv, Psv, lim) {
  var f = dpuFmt, show = fl.slice(-14), n = show.length, fh = Math.max(18, Math.min(30, 380 / n)), top = 46, H = top + fh * n + 14, x = 250;
  var g = '<svg class="stsvg netsvg" viewBox="0 0 560 ' + H + '" role="img" aria-label="' + name + ': давление по этажам">';
  g += '<rect x="' + x + '" y="' + top + '" width="40" height="' + fh * n + '" class="vnshaft"/>';
  g += '<rect x="' + (x + 8) + '" y="' + (top - 22) + '" width="24" height="14" rx="3" class="dpfan"/><text class="stt" x="' + (x + 50) + '" y="' + (top - 12) + '">' + name + ': ' + f(Lv, 0) + ' м³/ч, ' + f(Psv, 0) + ' Па</text>';
  for (var j = 0; j < n; j++) {
    var s = show[n - 1 - j], y = top + fh * j, bad = lim && s.dp >= lim;
    g += '<line x1="60" y1="' + (y + fh) + '" x2="520" y2="' + (y + fh) + '" class="dpfloor"/>';
    g += '<rect x="' + (x - 10) + '" y="' + (y + fh * 0.25) + '" width="8" height="' + fh * 0.6 + '" class="' + (s.open ? 'vndooropen' : bad ? 'vndoorbad' : 'dpvalve') + '"/>';
    g += '<text class="stt dim" x="' + (x - 64) + '" y="' + (y + fh * 0.65) + '" text-anchor="end">' + s.i + ' эт. · ' + (s.open ? 'дверь открыта' : f(s.dp, 0) + ' Па') + '</text>';
    if (!s.open && s.dG > 0) g += '<line x1="' + (x - 14) + '" y1="' + (y + fh * 0.55) + '" x2="' + (x - 56) + '" y2="' + (y + fh * 0.55) + '" class="dpleak" stroke-width="1.5"/>';
    g += '<text class="stt" x="' + (x + 50) + '" y="' + (y + fh * 0.65) + '">' + f(s.G, 2) + ' кг/с</text>';
  }
  return g + '</svg><p class="tnote">Показаны ' + n + ' из ' + fl.length + ' этажей' + (lim ? '; красная дверь — перепад ≥ ' + lim + ' Па' : '') + '. Это не чертёж.</p>';
}
function stDoc() {
  var r = VN.st; if (!r || r.err.length) return; var f = dpuFmt;
  var body = '<h2>Исходные данные</h2>' + vnTable(['Параметр', 'Значение'], [['Размещение', $('#st-type').selectedOptions[0].text], ['N; высота этажа, м', r.N + '; ' + f(r.hf, 2)], ['Двери: hd, м; Fd, м²; S, м³/кг', f(r.hd, 2) + '; ' + f(r.Fd, 2) + '; ' + f(r.S, 0)],
    ['Fs, м²; ξs', f(r.Fs, 1) + '; ' + f(r.xs, 0)], ['Ta / Tr, °C; va, м/с; kww / kw0', f(r.ta, 1) + ' / ' + f(r.tr, 1) + '; ' + f(r.va, 1) + '; ' + f(r.kww, 2) + ' / ' + f(r.kw0, 2)], ['Gsm, кг/с; q', f(r.Gsm, 3) + '; ' + r.q]]) +
    '<h2>Расчёт</h2><p>ρ<sub>a</sub> = ' + f(r.roa, 3) + ', ρ<sub>r</sub> = ' + f(r.ror, 3) + ', ρ<sub>s</sub> = ' + f(r.ros, 3) + ' кг/м³; W = ' + f(r.W, 2) + ' Па. P<sub>s2</sub> = ' + f(r.P2, 2) + ' Па; G<sub>sa</sub> = ' + f(r.Gsa, 3) + ' кг/с; G<sub>s2</sub> = ' + f(r.Gs2, 3) + ' кг/с.</p>' +
    vnTable(['Этаж', 'P, Па', 'Перепад, Па', 'Утечки, кг/с', 'G, кг/с'], r.fl.map(function (x) { return [x.i, f(x.P, 1), x.open ? '20' : f(x.dp, 1), f(x.dG, 4), f(x.G, 3)]; })) +
    '<p><b>Вентилятор: L<sub>v</sub> = ' + f(r.Lv, 0) + ' м³/ч, P<sub>sv</sub> = ' + f(r.Psv, 0) + ' Па</b> (93), (94).</p>' + (r.warn.length ? '<ul>' + r.warn.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' : '');
  vnDoc('Расчёт подпора воздуха в лестничную клетку', body, 'Расчёт_подпор_лестница');
}

/* ---------- 4.2 лифтовая шахта ---------- */
function lfBlock() {
  var F = dpuF, S = dpuS;
  return '<p class="sub">Подпор лифтовой шахты надземной части: на основном посадочном (1-м) этаже двери шахты открыты, на остальных воздух фильтруется через закрытые двери шахты и лифтового холла.</p>' +
    vnGrp('Шахта', S('lf-type', 'Вариант', [['1', 'центральное ядро, холлы на всех этажах, кроме 1-го — п. 4.2.1'], ['2', 'центральное ядро, холл и на 1-м этаже — п. 4.2.2'], ['3', 'у наружной стены, холл на 1-м этаже — п. 4.2.3'], ['4', 'у наружной стены, без холла на 1-м — п. 4.2.4']], '1') +
      F('lf-n', 'N — этаж верхней остановки', '17', '1') + F('lf-hf', 'Высота этажа, м', '3', 'any') + F('lf-nc', 'n — кабин в шахте', '1', '1') + F('lf-fdl', 'Fdl — площадь дверей шахты, м²', '1.89', 'any') + F('lf-hdl', 'hdl — высота дверей шахты, м', '2.1', 'any') +
      F('lf-fk', 'Fk — сечение кабины, м²', '2.6', 'any') + F('lf-fls', 'Fls — сечение шахты, м²', '4.5', 'any')) +
    vnGrp('Лифтовые холлы', F('lf-m', 'm — дверей холла на этаже', '1', '1') + F('lf-fdr', 'Fdr — площадь двери холла, м²', '1.89', 'any')) +
    vnGrp('Наружный воздух', vnClim('lf')) +
    vnGrp('Вентилятор — (95), (96)', F('lf-h0', 'h0l — от оголовка шахты до воздухозабора, м', '0', 'any') + F('lf-pd', 'Pdl — сопротивление воздуховодов, Па', '150', 'any')) +
    '<div class="barres stres" id="lf-res"></div><div class="stanim" id="lf-anim"></div><div id="lf-tab"></div>' + vnBtns('lf') +
    '<details class="issue dpf"><summary>Формулы</summary><div><p>(43) P<sub>l2</sub> = 20 − g(h<sub>2</sub> + 0,5h<sub>dl2</sub>)(ρ<sub>l</sub> − ρ<sub>r</sub>); у наружной стены (52) + W; (47) P<sub>li</sub> = P<sub>l2</sub>.</p>' +
    '<p>(44) G<sub>l1</sub> = {2ρ<sub>l</sub>/(ξ<sub>l</sub>/(nF<sub>dl</sub>)<sup>2</sup>)·[20 − g(h<sub>2</sub> + 0,5h<sub>dl2</sub>)(ρ<sub>l</sub> − ρ<sub>r</sub>) + 0,5gh<sub>dl1</sub>(ρ<sub>a</sub> − ρ<sub>l</sub>)]}<sup>1/2</sup>; (50) с холлом на 1-м — в знаменателе + (ξ<sub>d</sub> + 1)/(mF<sub>dr</sub>)<sup>2</sup>; (51), (54) — + W в скобке. (45) ξ<sub>l</sub> = 4,3 + F<sub>k</sub>/F<sub>ls</sub>.</p>' +
    '<p>(46) S<sub>lri</sub> = S<sub>dl</sub>/(n<sub>i</sub>F<sub>dli</sub>)<sup>2</sup> + S<sub>dr</sub>/(m<sub>i</sub>F<sub>dri</sub>)<sup>2</sup>, S<sub>dl</sub> = 2600/ρ<sub>l</sub>, S<sub>dr</sub> = 5300/ρ<sub>l</sub>; (48) ΔG<sub>li</sub> = ((P<sub>li</sub> + g(h<sub>i</sub> + 0,5h<sub>dli</sub>)(ρ<sub>l</sub> − ρ<sub>r</sub>))/S<sub>lri</sub>)<sup>1/2</sup>, (53) — с − W; (49) G<sub>l</sub> = G<sub>l1</sub> + ΣΔG<sub>li</sub>.</p>' +
    '<p>(95) L<sub>v</sub> = 3600G<sub>l</sub>/ρ<sub>a</sub>; (96) P<sub>sv</sub> = 1,2(P<sub>lN</sub> + gh<sub>lN</sub>(ρ<sub>a</sub> − ρ<sub>l</sub>) + gh<sub>0l</sub>(ρ<sub>a</sub> − ρ<sub>r</sub>) + P<sub>dl</sub>)/ρ<sub>a</sub>.</p></div></details>' +
    refs([['mr7', '4.2'], ['mr7', '5.2'], ['sp7', '7.16']]);
}
function lfCompute() {
  var n = dpuNum, r = { type: $('#lf-type').value, N: Math.round(n('lf-n')), hf: n('lf-hf'), nc: Math.round(n('lf-nc')), Fdl: n('lf-fdl'), hdl: n('lf-hdl'), Fk: n('lf-fk'), Fls: n('lf-fls'),
    m: Math.round(n('lf-m')), Fdr: n('lf-fdr'), h0: n('lf-h0'), Pd: n('lf-pd'), err: [], warn: [], marks: [], fl: [] };
  fcNums(vnClimR('lf', r).concat([['lf-n', '', 2, 120], ['lf-hf', '', 0, null, true], ['lf-nc', '', 1, 8], ['lf-fdl', '', 0, null, true], ['lf-hdl', '', 0, null, true], ['lf-fk', '', 0, null, true], ['lf-fls', '', 0, null, true],
    ['lf-m', '', 1, 6], ['lf-fdr', '', 0, null, true], ['lf-h0', '', -300, 300], ['lf-pd', '', 0]]), r.marks);
  if (r.Fk >= r.Fls) r.marks.push(['lf-fk', 'bad', 'Кабина больше шахты']);
  if (vnBad(r)) return r;
  var g = VN_G, rol = r.roi, dro = rol - r.ror, out = r.type === '3' || r.type === '4', W = out ? r.W : 0, h2 = r.hf;
  r.rol = rol; r.xl = 4.3 + r.Fk / r.Fls; r.Sdl = 2600 / rol; r.Sdr = 5300 / rol;
  r.Pl = 20 - g * (h2 + 0.5 * r.hdl) * dro + W;
  var br = 20 - g * (h2 + 0.5 * r.hdl) * dro + W + 0.5 * g * r.hdl * (r.roa - rol);
  var den = r.xl / Math.pow(r.nc * r.Fdl, 2) + (r.type === '2' || r.type === '3' ? (2.44 + 1) / Math.pow(r.m * r.Fdr, 2) : 0);
  if (br <= 0) { r.err.push('Под корнем в (44) ≤ 0 — проверь исходные данные.'); return r; }
  r.Gl1 = Math.sqrt(2 * rol / den * br);
  r.Slr = r.Sdl / Math.pow(r.nc * r.Fdl, 2) + r.Sdr / Math.pow(r.m * r.Fdr, 2);
  var G = r.Gl1, dpmax = 0;
  r.fl.push({ i: 1, P: r.Pl, dp: 0, dG: 0, G: G, open: true });
  for (var i = 2; i <= r.N; i++) {
    var b = r.Pl + g * ((i - 1) * r.hf + 0.5 * r.hdl) * dro - W, dG = Math.sqrt(Math.max(b, 0) / r.Slr);
    G += dG; r.fl.push({ i: i, P: r.Pl, dp: b, dG: dG, G: G }); if (b > dpmax) dpmax = b;
  }
  r.Gl = G; r.dpmax = dpmax; r.hlN = (r.N - 1) * r.hf;
  r.Lv = 3600 * G / r.roa; r.Psv = 1.2 * (r.Pl + g * r.hlN * (r.roa - rol) + g * r.h0 * (r.roa - r.ror) + r.Pd) / r.roa;
  r.warn.push('Перепады на дверях — в таблице; допустимые пределы для лифтовых шахт сверь по п. 7.16 СП 7.13130 в действующей редакции.');
  return r;
}
function lfCalc() {
  if (!$('#lf-type')) return;
  var r = lfCompute(), f = dpuFmt; VN.lf = r;
  vnRes('lf-res', r, r.err.length ? '' :
    vnC('Вентилятор: подача', f(r.Lv, 0) + ' м³/ч', '(95): Gl = ' + f(r.Gl, 3) + ' кг/с, ρa = ' + f(r.roa, 3) + ' кг/м³.', 'final') +
    vnC('Вентилятор: давление', f(r.Psv, 0) + ' Па', '(96): Pl = ' + f(r.Pl, 1) + ' Па, высота шахты ' + f(r.hlN, 1) + ' м, сеть ' + f(r.Pd, 0) + ' Па.', 'final') +
    vnC('1-й этаж — двери открыты', f(r.Gl1, 3) + ' кг/с', 'Формула (' + { 1: '44', 2: '50', 3: '51', 4: '54' }[r.type] + '), ξl = ' + f(r.xl, 2) + ' (45).') +
    vnC('Утечки этажей 2…' + r.N, '+' + f(r.Gl - r.Gl1, 3) + ' кг/с', 'Slr = ' + f(r.Slr, 0) + ' кг⁻¹·м⁻¹; перепад на дверях до ' + f(r.dpmax, 0) + ' Па.'));
  fcApply('lf-', r.marks);
  $('#lf-tab').innerHTML = r.err.length ? '' : vnTable(['Этаж', 'Перепад на дверях, Па', 'Утечки, кг/с', 'G, кг/с'], r.fl.map(function (x) { return [x.i + (x.open ? ' — двери шахты открыты' : ''), x.open ? '—' : f(x.dp, 1), f(x.dG, 4), f(x.G, 3)]; }));
  $('#lf-anim').innerHTML = r.err.length ? '' : vnShaftSvg(r.fl, 'Лифтовая шахта', r.Lv, r.Psv, 0);
}
function lfDoc() {
  var r = VN.lf; if (!r || r.err.length) return; var f = dpuFmt;
  vnDoc('Расчёт подпора воздуха в лифтовую шахту', '<h2>Исходные данные</h2>' + vnTable(['Параметр', 'Значение'], [['Вариант', $('#lf-type').selectedOptions[0].text], ['N; высота этажа, м', r.N + '; ' + f(r.hf, 2)], ['n; Fdl, м²; hdl, м; Fk / Fls, м²', r.nc + '; ' + f(r.Fdl, 2) + '; ' + f(r.hdl, 2) + '; ' + f(r.Fk, 2) + ' / ' + f(r.Fls, 2)], ['Холл: m; Fdr, м²', r.m + '; ' + f(r.Fdr, 2)], ['Ta / Tr, °C; va, м/с', f(r.ta, 1) + ' / ' + f(r.tr, 1) + '; ' + f(r.va, 1)]]) +
    '<h2>Расчёт</h2><p>ρ<sub>l</sub> = ' + f(r.rol, 3) + ' кг/м³; ξ<sub>l</sub> = ' + f(r.xl, 3) + '; P<sub>l</sub> = ' + f(r.Pl, 2) + ' Па; G<sub>l1</sub> = ' + f(r.Gl1, 3) + ' кг/с; S<sub>lr</sub> = ' + f(r.Slr, 1) + '.</p>' +
    vnTable(['Этаж', 'Перепад, Па', 'Утечки, кг/с', 'G, кг/с'], r.fl.map(function (x) { return [x.i, x.open ? '—' : f(x.dp, 1), f(x.dG, 4), f(x.G, 3)]; })) +
    '<p><b>Вентилятор: L<sub>v</sub> = ' + f(r.Lv, 0) + ' м³/ч, P<sub>sv</sub> = ' + f(r.Psv, 0) + ' Па</b> (95), (96).</p>', 'Расчёт_подпор_лифт');
}

/* ---------- 4.3 тамбур-шлюз ---------- */
function tmBlock() {
  var F = dpuF, S = dpuS;
  return '<p class="sub">Подача воздуха в тамбур-шлюз — по назначению шлюза (п. 4.3 МР).</p>' +
    vnGrp('Тамбур-шлюз', S('tm-kind', 'Назначение', [['open', 'при Н2/Н3, атриумах, перед лифтовыми холлами автостоянок — открытая дверь, (59)'], ['park', 'отделяет хранение автомобилей — закрытые двери, (60)'], ['lift', 'лифтовый холл «пожарная опасность» в подвале — (62)'], ['cur', 'воздушная завеса вместо шлюза у рампы — (61)']], 'open') +
      F('tm-fd', 'Fdr — площадь двери шлюза, м²', '1.89', 'any') + F('tm-v', 'vr — скорость в открытой двери, м/с', '1.3', 'any', 'не меньше 1,3 (МР п. 4.3.1)') + F('tm-n', 'n — дверей шлюза', '2', '1') +
      F('tm-m', 'm — дверей лифтовой шахты', '1', '1') + F('tm-fdl', 'Fdl — площадь двери лифта, м²', '1.89', 'any') + F('tm-bd', 'Bd — ширина ворот рампы, м', '6', 'any') + F('tm-b', 'b — длина сопла, м', '6', 'any', 'не меньше Bd') + F('tm-va', 'va — скорость из сопла, м/с', '10', 'any', 'не меньше 10') +
      F('tm-ta', 'Ta — наружный воздух, °C', '-19', 'any') + F('tm-tr', 'Tr — воздух в здании, °C', '20', 'any') + F('tm-hi', 'hi — отметка пола этажа, м', '0', 'any', 'от пола 1-го этажа; для подземных — минус') + F('tm-hdr', 'hdr — высота двери шлюза, м', '2.1', 'any')) +
    '<div class="barres stres" id="tm-res"></div>' + vnBtns('tm') +
    '<details class="issue dpf"><summary>Формулы</summary><div><p>(59) G<sub>r</sub> = v<sub>r</sub>ρ<sub>a</sub>F<sub>dr</sub>, v<sub>r</sub> ≥ 1,3 м/с; (60) G<sub>r</sub> = nF<sub>dr</sub>(20/S<sub>dr</sub>)<sup>1/2</sup>, S<sub>dr</sub> = 5300/ρ<sub>a</sub>; (62) G<sub>r</sub> = nF<sub>dr</sub>(20/S<sub>dr</sub>)<sup>1/2</sup> + mF<sub>dl</sub>(20/S<sub>dl</sub>)<sup>1/2</sup>; (61) G<sub>a</sub> = v<sub>a</sub>ρ<sub>a</sub>bδ, v<sub>a</sub> ≥ 10 м/с, b ≥ B<sub>d</sub>, δ = 0,03 м.</p>' +
    '<p>(63) P<sub>ri</sub> = 20 − g(h<sub>i</sub> + 0,5h<sub>dri</sub>)(ρ<sub>a</sub> − ρ<sub>r</sub>) — надземная часть. Для (62) S<sub>dl</sub> = 2600/ρ<sub>a</sub> — допущение справочника по аналогии с п. 4.2.1.</p></div></details>' +
    refs([['mr7', '4.3'], ['sp7', '7.16 б)']]);
}
function tmCompute() {
  var n = dpuNum, r = { kind: $('#tm-kind').value, Fd: n('tm-fd'), v: n('tm-v'), nd: Math.round(n('tm-n')), m: Math.round(n('tm-m')), Fdl: n('tm-fdl'), Bd: n('tm-bd'), b: n('tm-b'), va: n('tm-va'),
    ta: n('tm-ta'), tr: n('tm-tr'), hi: n('tm-hi'), hdr: n('tm-hdr'), err: [], warn: [], marks: [] };
  var L = [['tm-ta', '', -60, 45], ['tm-tr', '', -10, 45], ['tm-hi', '', -100, 400], ['tm-hdr', '', 0, null, true]];
  if (r.kind === 'cur') L.push(['tm-bd', '', 0, null, true], ['tm-b', '', 0, null, true], ['tm-va', '', 0, null, true]); else L.push(['tm-fd', '', 0, null, true]);
  if (r.kind === 'open') L.push(['tm-v', '', 0, null, true]);
  if (r.kind === 'park' || r.kind === 'lift') L.push(['tm-n', '', 1, 6]);
  if (r.kind === 'lift') L.push(['tm-m', '', 1, 8], ['tm-fdl', '', 0, null, true]);
  fcNums(L, r.marks);
  if (r.kind === 'open' && r.v < 1.3) r.marks.push(['tm-v', 'bad', 'Не меньше 1,3 м/с (МР п. 4.3.1)']);
  if (r.kind === 'cur' && r.va < 10) r.marks.push(['tm-va', 'bad', 'Не меньше 10 м/с']);
  if (r.kind === 'cur' && r.b < r.Bd) r.marks.push(['tm-b', 'bad', 'Не меньше ширины ворот Bd']);
  if (vnBad(r)) return r;
  r.roa = vnRho(r.ta); r.ror = vnRho(r.tr);
  if (r.kind === 'open') { r.G = r.v * r.roa * r.Fd; r.f = '59'; }
  else if (r.kind === 'park') { r.S = 5300 / r.roa; r.G = r.nd * r.Fd * Math.sqrt(20 / r.S); r.f = '60'; }
  else if (r.kind === 'lift') { r.S = 5300 / r.roa; r.Sl = 2600 / r.roa; r.G = r.nd * r.Fd * Math.sqrt(20 / r.S) + r.m * r.Fdl * Math.sqrt(20 / r.Sl); r.f = '62'; }
  else { r.G = r.va * r.roa * r.b * 0.03; r.f = '61'; }
  r.L = 3600 * r.G / r.roa;
  r.P = 20 - VN_G * (r.hi + 0.5 * r.hdr) * (r.roa - r.ror);
  return r;
}
function tmCalc() {
  if (!$('#tm-kind')) return;
  var k = $('#tm-kind').value, sh = function (id, on) { $('#' + id).parentNode.hidden = !on; };
  sh('tm-fd', k !== 'cur'); sh('tm-v', k === 'open'); sh('tm-n', k === 'park' || k === 'lift'); sh('tm-m', k === 'lift'); sh('tm-fdl', k === 'lift'); sh('tm-bd', k === 'cur'); sh('tm-b', k === 'cur'); sh('tm-va', k === 'cur');
  var r = tmCompute(), f = dpuFmt; VN.tm = r;
  vnRes('tm-res', r, r.err.length ? '' : vnC('Подача воздуха', f(r.G, 3) + ' кг/с', 'Формула (' + r.f + '), ρa = ' + f(r.roa, 3) + ' кг/м³' + (r.S ? ', Sdr = ' + f(r.S, 0) + ' м³/кг' : '') + '.', 'final') +
    vnC('Объёмный расход', f(r.L, 0) + ' м³/ч', 'Наружный воздух при Ta = ' + f(r.ta, 1) + ' °C.', 'final') + (r.kind !== 'cur' ? vnC('Давление в шлюзе', f(r.P, 1) + ' Па', '(63): опорное давление в шлюзе на этом этаже; на дверях — от 20 до 150 Па (п. 7.16 б) СП 7).') : ''));
  fcApply('tm-', r.marks);
}
function tmDoc() {
  var r = VN.tm; if (!r || r.err.length) return; var f = dpuFmt;
  vnDoc('Расчёт подачи воздуха в тамбур-шлюз', '<p>Назначение: ' + $('#tm-kind').selectedOptions[0].text + '.</p><p>ρ<sub>a</sub> = 353/T<sub>a</sub> = ' + f(r.roa, 3) + ' кг/м³.</p><p><b>Формула (' + r.f + '): G = ' + f(r.G, 3) + ' кг/с; L = ' + f(r.L, 0) + ' м³/ч.</b></p>' + (r.kind !== 'cur' ? '<p>(63): P<sub>r</sub> = ' + f(r.P, 1) + ' Па.</p>' : ''), 'Расчёт_тамбур_шлюз');
}

/* ---------- 4.4 компенсация ---------- */
function cpBlock() {
  var F = dpuF;
  return '<p class="sub">Компенсирующая подача наружного воздуха в нижнюю часть помещения, из которого удаляют дым.</p>' +
    vnGrp('Компенсация — (65), (66)', F('cp-gsm', 'Gsm — удаляется дыма, кг/с', '2', 'any') + F('cp-n', 'n — коэффициент дисбаланса', '0', 'any', 'от −0,3 до 0,3') + F('cp-ta', 'Ta — наружный воздух, °C', '-19', 'any')) +
    '<div class="barres stres" id="cp-res"></div>' + vnBtns('cp', '<button type="button" class="eibtn" id="cp-take">Взять Gsm из расчёта дыма</button>') +
    '<p class="tnote">(65) G<sub>a</sub> = G<sub>sm</sub>/(1 − n), −0,3 ≤ n ≤ 0,3; (66) L<sub>a</sub> = G<sub>a</sub>/ρ<sub>a</sub>. При естественной компенсации сечения дверей и каналов — по их сопротивлению и статическому давлению вытяжной системы (п. 4.4 МР); добавочное давление P0 = Ra·Ga² — во вкладку «Сеть».</p>' + refs([['mr7', '4.4'], ['sp7', '7.14']]);
}
function cpCompute() {
  var n = dpuNum, r = { Gsm: n('cp-gsm'), n: n('cp-n'), ta: n('cp-ta'), err: [], warn: [], marks: [] };
  fcNums([['cp-gsm', '', 0, null, true], ['cp-n', '', -0.3, 0.3], ['cp-ta', '', -60, 45]], r.marks); if (vnBad(r)) return r;
  r.roa = vnRho(r.ta); r.Ga = r.Gsm / (1 - r.n); r.La = r.Ga / r.roa; r.lo = r.Gsm / 1.3; r.hi = r.Gsm / 0.7; return r;
}
function cpCalc() {
  if (!$('#cp-gsm')) return;
  var r = cpCompute(), f = dpuFmt; VN.cp = r;
  vnRes('cp-res', r, r.err.length ? '' : vnC('Подать воздуха', f(r.Ga, 3) + ' кг/с', '(65) при n = ' + f(r.n, 2) + '.', 'final') + vnC('Объёмный расход', f(r.La * 3600, 0) + ' м³/ч', '(66): ' + f(r.La, 3) + ' м³/с при ρa = ' + f(r.roa, 3) + ' кг/м³.', 'final') +
    vnC('Допустимый диапазон', f(r.lo, 2) + '…' + f(r.hi, 2) + ' кг/с', 'n от −0,3 до 0,3.'));
  fcApply('cp-', r.marks);
}
function cpDoc() { var r = VN.cp; if (!r || r.err.length) return; var f = dpuFmt; vnDoc('Расчёт компенсирующей подачи воздуха', '<p>(65): G<sub>a</sub> = ' + f(r.Gsm, 3) + ' / (1 − ' + f(r.n, 2) + ') = <b>' + f(r.Ga, 3) + ' кг/с</b>; (66): L<sub>a</sub> = ' + f(r.Ga, 3) + ' / ' + f(r.roa, 3) + ' = <b>' + f(r.La * 3600, 0) + ' м³/ч</b>.</p>', 'Расчёт_компенсация'); }

/* ---------- 4.5 зона безопасности ---------- */
function szBlock() {
  var F = dpuF;
  return '<p class="sub">Пожаробезопасная зона: 2 системы (п. 4.5 МР) — на время эвакуации через открытую дверь не меньше 1,5 м/с и с подогревом при закрытых дверях, воздух в зоне не ниже 18 °C.</p>' +
    vnGrp('Зона', F('sz-fd', 'Fdsf — площадь двери, м²', '1.89', 'any') + F('sz-n', 'n — дверей', '1', '1') + F('sz-v', 'v — скорость в открытой двери, м/с', '1.5', 'any', 'не меньше 1,5') + F('sz-hi', 'hi — отметка пола этажа, м', '30', 'any') + F('sz-hd', 'hdsf — высота двери, м', '2.1', 'any') +
      F('sz-tsf', 'Tsf — воздух в зоне, °C', '18', 'any', 'не ниже 18 °C') + F('sz-ta', 'Ta — наружный воздух, °C', '-19', 'any') + F('sz-tr', 'Tr — воздух в здании, °C', '20', 'any')) +
    '<div class="barres stres" id="sz-res"></div>' + vnBtns('sz') +
    '<p class="tnote">(59) G = vρ<sub>a</sub>F<sub>d</sub>, v ≥ 1,5 м/с; (67) P<sub>sfi</sub> = 20 − g(h<sub>i</sub> + 0,5h<sub>dsf</sub>)(ρ<sub>sl</sub> − ρ<sub>sf</sub>); (69) G<sub>sf</sub> = nF<sub>dsf</sub>(20/S<sub>dsf</sub>)<sup>1/2</sup>. ρ<sub>sl</sub> — при T<sub>s</sub> = 0,5(T<sub>a</sub> + T<sub>r</sub>); S<sub>dsf</sub> = 5300/ρ<sub>sf</sub> — допущение справочника, как для дверей по (60); лучше — по паспорту двери.</p>' + refs([['mr7', '4.5']]);
}
function szCompute() {
  var n = dpuNum, r = { Fd: n('sz-fd'), nd: Math.round(n('sz-n')), v: n('sz-v'), hi: n('sz-hi'), hd: n('sz-hd'), tsf: n('sz-tsf'), ta: n('sz-ta'), tr: n('sz-tr'), err: [], warn: [], marks: [] };
  fcNums([['sz-fd', '', 0, null, true], ['sz-n', '', 1, 6], ['sz-v', '', 0, null, true], ['sz-hi', '', -100, 400], ['sz-hd', '', 0, null, true], ['sz-tsf', '', -10, 40], ['sz-ta', '', -60, 45], ['sz-tr', '', -10, 45]], r.marks);
  if (r.v < 1.5) r.marks.push(['sz-v', 'bad', 'Не меньше 1,5 м/с']);
  if (r.tsf < 18) r.marks.push(['sz-tsf', 'bad', 'Не ниже 18 °C (МР п. 4.5)']);
  if (vnBad(r)) return r;
  r.roa = vnRho(r.ta); r.rosf = vnRho(r.tsf); r.rosl = vnRho(0.5 * (r.ta + r.tr));
  r.G1 = r.v * r.roa * r.Fd; r.P = 20 - VN_G * (r.hi + 0.5 * r.hd) * (r.rosl - r.rosf); r.S = 5300 / r.rosf; r.G2 = r.nd * r.Fd * Math.sqrt(20 / r.S);
  return r;
}
function szCalc() {
  if (!$('#sz-fd')) return;
  var r = szCompute(), f = dpuFmt; VN.sz = r;
  vnRes('sz-res', r, r.err.length ? '' : vnC('Система 1: дверь открыта', f(r.G1, 3) + ' кг/с', '(59): ' + f(r.G1 / r.roa * 3600, 0) + ' м³/ч наружного воздуха.', 'final') +
    vnC('Система 2: двери закрыты, подогрев', f(r.G2, 3) + ' кг/с', '(69): ' + f(r.G2 / r.rosf * 3600, 0) + ' м³/ч при ' + f(r.tsf, 0) + ' °C; Sdsf = ' + f(r.S, 0) + ' м³/кг (допущение).', 'final') +
    vnC('Опорное давление в зоне', f(r.P, 1) + ' Па', '(67) на этаже с отметкой ' + f(r.hi, 1) + ' м.'));
  fcApply('sz-', r.marks);
}
function szDoc() { var r = VN.sz; if (!r || r.err.length) return; var f = dpuFmt; vnDoc('Расчёт подачи воздуха в зону безопасности', '<p>Система 1, (59): G = ' + f(r.v, 2) + ' · ' + f(r.roa, 3) + ' · ' + f(r.Fd, 2) + ' = <b>' + f(r.G1, 3) + ' кг/с</b>.</p><p>Система 2, (69): G<sub>sf</sub> = ' + r.nd + ' · ' + f(r.Fd, 2) + ' · (20/' + f(r.S, 0) + ')<sup>1/2</sup> = <b>' + f(r.G2, 3) + ' кг/с</b>; (67) P<sub>sf</sub> = ' + f(r.P, 1) + ' Па; T<sub>sf</sub> = ' + f(r.tsf, 0) + ' °C.</p>', 'Расчёт_зона_безопасности'); }

document.addEventListener('click', function (e) {
  if (e.target.id === 'st-take' && vnTake({ g: 'st-gsm' })) stCalc();
  if (e.target.id === 'cp-take' && vnTake({ g: 'cp-gsm' })) cpCalc();
});
