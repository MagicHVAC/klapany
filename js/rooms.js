/* Разделы «Помещения» (какой клапан где) и «Пожарная нагрузка» (СИТИС СПН-1 для КВМ-расчёта дыма) */
function caseById(id) { return ALL.filter(function (c) { return c.id === id; })[0]; }
function rvList(ids) {
  return '<div class="rv-l">' + ids.map(function (id) {
    var c = caseById(id);
    if (!c) return '';
    return '<a href="#' + id + '" title="' + esc(c.when) + '">' + tag(c.t) + '<span>' + esc(c.title) + '</span><i>' + esc(c.ei) + '</i></a>';
  }).join('') + '</div>';
}
PAGES.rooms = function () {
  return '<h1>Какой клапан в каком помещении</h1><p class="lead">Строка — помещение или система, в ячейках карточки с пунктом СП и пределом. Нажми на строку карточки: откроется схема и цитата нормы.</p>' +
    '<div class="tscroll"><table class="rv-t"><thead><tr><th>Помещение</th><th>' + tag('NO') + ' Нормально открытые</th><th>' + tag('NZ') + ' Нормально закрытые и ' + tag('DD') + '</th></tr></thead><tbody>' +
    ROOM_VALVES.map(function (r) {
      return '<tr><th scope="row">' + esc(r[0]) + (r[1] ? '<small>' + esc(r[1]) + '</small>' : '') + '</th><td>' + (r[2].length ? rvList(r[2]) : '<span class="muted">—</span>') + '</td><td>' + (r[3].length ? rvList(r[3]) : '<span class="muted">—</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<p class="tnote">Прочерк — прямого требования к клапану этого вида нет. Транзит подробно — в разделе <a href="#fire">Огнезащита</a>, по категориям — <a href="#prod">Производство</a>.</p>';
};

/* ---- Пожарная нагрузка */
function fnum(v) { return v === undefined || v === null ? '' : String(v).replace('.', ','); }
var SPN_SRC = 'СИТИС-СПН-1 «Пожарная нагрузка. Справочник», ред. 3 от 20.06.2014';
function spnT1() {
  return '<table class="spn" id="spn1"><thead><tr><th>ИД</th><th>Помещение или зона</th><th>Источник, аналог</th><th>q ср, МДж/м²</th><th>Kколеб</th><th>q расч, МДж/м²</th></tr></thead><tbody>' +
    SPN_T1.map(function (r) {
      if (r.g) return '<tr class="g"><td colspan="6">' + esc(r.n) + '</td></tr>';
      return '<tr data-c="' + esc(r.n + ' (СИТИС СПН-1 табл. 1, ИД ' + r.id + '): q расч = ' + fnum(r.qr) + ' МДж/м²').replace(/"/g, '&quot;') + '"><td>' + r.id + '</td><td>' + esc(r.n) + '</td><td>' + esc((r.src || '') + ' ' + (r.an || '')) + '</td><td class="n">' + fnum(r.q) + '</td><td class="n">' + fnum(r.k) + '</td><td class="n"><b>' + fnum(r.qr) + '</b></td></tr>';
    }).join('') + '</tbody></table>';
}
function spnT2() {
  var H = ['ИД', 'Наименование', 'Типы М Д К', 'Qн, МДж/кг', 'v, м/с', 'ψуд, кг/(м²·с)', 'B, Вт/с²', 'Dm, Нп·м²/кг', 'LO₂, кг/кг', 'LCO₂, кг/кг', 'LCO, кг/кг', 'LHCl, кг/кг', 'K'];
  return '<table class="spn" id="spn2"><thead><tr>' + H.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
    SPN_T2.map(function (r) {
      if (r.g) return '<tr class="g"><td colspan="13">' + esc(r.n) + '</td></tr>';
      var c = r.n + ' (СИТИС СПН-1 табл. 2, ИД ' + r.id + '): Qн = ' + fnum(r.Q) + ' МДж/кг; v = ' + fnum(r.v) + ' м/с; ψуд = ' + fnum(r.psi) + ' кг/(м²·с); Dm = ' + fnum(r.Dm) + ' Нп·м²/кг; LO2 = ' + fnum(r.O2) + '; LCO2 = ' + fnum(r.CO2) + '; LCO = ' + fnum(r.CO) + '; LHCl = ' + fnum(r.HCl) + ' кг/кг';
      return '<tr data-c="' + esc(c).replace(/"/g, '&quot;') + '"><td>' + r.id + '</td><td>' + esc(r.n) + (r.an && r.an !== r.n ? '<small>' + esc(r.src + ' ' + r.an) + '</small>' : (r.src ? '<small>' + r.src + '</small>' : '')) + '</td><td>' + r.tm + ' ' + r.td + ' ' + r.tk + '</td>' +
        ['Q', 'v', 'psi', 'B', 'Dm', 'O2', 'CO2', 'CO', 'HCl', 'K'].map(function (k) { return '<td class="n">' + fnum(r[k]) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
}
/* Выбор: здание (раздел) → помещение. Раздел строки = ближайший заголовок над ней в порядке справочника. */
function spnGroups(list) {
  var gs = [], cur = null;
  list.forEach(function (r) {
    if (r.g) { cur = { n: r.n, rows: [] }; gs.push(cur); return; }
    if (!cur) { cur = { n: 'Без раздела', rows: [] }; gs.push(cur); }
    cur.rows.push(r);
  });
  return gs.filter(function (g) { return g.rows.length; });
}
function spnCode(s) { var m = /Ф\d(?:\.\d)?/.exec(s); return m ? m[0] : ''; }
function opts(list, sel) { return list.map(function (x, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }
function tile(k, v, n) { var p = String(v).split(' '); return '<div class="stile"><span>' + k + '</span><b>' + p[0] + (p.length > 1 ? ' <u>' + p.slice(1).join(' ') + '</u>' : '') + '</b>' + (n ? '<small>' + n + '</small>' : '') + '</div>'; }
function spnDef(G) { for (var i = 0; i < G.length; i++) if (spnCode(G[i].n) === 'Ф4.3') return i; return 0; }
function spnCopy1(r) { return r.n + ' (СИТИС СПН-1 табл. 1, ИД ' + r.id + '): q расч = ' + fnum(r.qr) + ' МДж/м²'; }
function spnCopy2(r) { return r.n + ' (СИТИС СПН-1 табл. 2, ИД ' + r.id + '): Qн = ' + fnum(r.Q) + ' МДж/кг; v = ' + fnum(r.v) + ' м/с; ψуд = ' + fnum(r.psi) + ' кг/(м²·с); Dm = ' + fnum(r.Dm) + ' Нп·м²/кг; LO2 = ' + fnum(r.O2) + '; LCO2 = ' + fnum(r.CO2) + '; LCO = ' + fnum(r.CO) + '; LHCl = ' + fnum(r.HCl) + ' кг/кг'; }
function spnRes1(r) {
  return '<div class="stiles">' + tile('q расчётная', fnum(r.qr) + ' МДж/м²', r.q !== undefined ? 'средняя ' + fnum(r.q) + ' × Kколеб ' + fnum(r.k) : 'унифицированная') + '</div>' +
    '<p class="tnote">ИД ' + r.id + (r.src ? ' · ' + esc(r.src + ' ' + (r.an || '')) : '') + '</p><button type="button" class="eibtn" data-spncp="' + esc(spnCopy1(r)).replace(/"/g, '&quot;') + '">Скопировать</button>';
}
function spnRes2(r) {
  return '<div class="stiles">' + tile('Qн', fnum(r.Q) + ' МДж/кг', 'низшая теплота сгорания') + tile('v', fnum(r.v) + ' м/с', 'линейная скорость пламени') + tile('ψуд', fnum(r.psi) + ' кг/(м²·с)', 'удельная скорость выгорания') +
    tile('Dm', fnum(r.Dm) + ' Нп·м²/кг', 'дымообразующая способность') + tile('LO₂', fnum(r.O2) + ' кг/кг', 'потребление кислорода') + tile('LCO₂', fnum(r.CO2) + ' кг/кг', 'выделение') +
    tile('LCO', fnum(r.CO) + ' кг/кг', 'выделение') + tile('LHCl', fnum(r.HCl) + ' кг/кг', 'выделение') + tile('B', fnum(r.B) + ' Вт/с²', 'Qн·ψуд·v², скорость развития') + tile('Типы', r.tm + ' ' + r.td + ' ' + r.tk, 'K токсичности ' + fnum(r.K)) + '</div>' +
    '<p class="tnote">ИД ' + r.id + (r.src || r.an ? ' · ' + esc((r.src || '') + ' ' + (r.an || '')) : '') + '</p><button type="button" class="eibtn" data-spncp="' + esc(spnCopy2(r)).replace(/"/g, '&quot;') + '">Скопировать для КВМ</button>';
}
/* Табл. 3–5: у значения бывает свой источник {v, s} */
function fv(x) { return x === null || x === undefined ? null : typeof x === 'object' ? fnum(x.v) : fnum(x); }
function fs(x, n) { return (x && typeof x === 'object' && x.s ? x.s + ' · ' : '') + n; }
function tv(k, x, u, n) { var v = fv(x); return v === null ? '' : tile(k, v + ' ' + u, fs(x, n)); }
function spnNote(r) { return '<p class="tnote">ИД ' + r.id + (r.src || r.an ? ' · ' + esc((r.src || '') + ' ' + (r.an || '')) : '') + '</p>'; }
function cpBtn(txt, label) { return '<button type="button" class="eibtn" data-spncp="' + esc(txt).replace(/"/g, '&quot;') + '">' + label + '</button>'; }
function spnRes3(r) {
  var v = r.v;
  return '<div class="stiles">' + tv('Qн', v[0], 'МДж/кг', 'низшая теплота сгорания') + tv('qкр', v[1], 'кВт/м²', 'критическая плотность лучистого потока') + '</div>' + spnNote(r) +
    cpBtn(r.n + ' (СИТИС СПН-1 табл. 3, ИД ' + r.id + '): ' + (fv(v[0]) !== null ? 'Qн = ' + fv(v[0]) + ' МДж/кг' : '') + (fv(v[1]) !== null ? '; qкр = ' + fv(v[1]) + ' кВт/м²' : ''), 'Скопировать');
}
function spnRes4(r) {
  var v = r.v;
  return '<div class="stiles">' + tv('Qн', v[0], 'МДж/кг', 'низшая теплота сгорания') + tv('ρ', v[1], 'кг/м³', 'плотность жидкости') + tv('ψуд', v[2], 'кг/(м²·с)', 'удельная скорость выгорания') +
    tv('Dm', v[3], 'Нп·м²/кг', 'дымообразующая способность') + tv('LO₂', v[4], 'кг/кг', 'потребление кислорода') + tv('LCO₂', v[5], 'кг/кг', 'выделение') + tv('LCO', v[6], 'кг/кг', 'выделение') + tv('LHCl', v[7], 'кг/кг', 'выделение') + '</div>' + spnNote(r) +
    cpBtn(r.n + ' (СИТИС СПН-1 табл. 4, ИД ' + r.id + '): Qн = ' + fv(v[0]) + ' МДж/кг; ρ = ' + fv(v[1]) + ' кг/м³; ψуд = ' + fv(v[2]) + ' кг/(м²·с); Dm = ' + fv(v[3]) + ' Нп·м²/кг; LO2 = ' + fv(v[4]) + '; LCO2 = ' + fv(v[5]) + '; LCO = ' + fv(v[6]) + '; LHCl = ' + fv(v[7]) + ' кг/кг', 'Скопировать для КВМ');
}
function spnRes5(r) {
  var v = r.v;
  return '<div class="stiles">' + tv('λ', v[0], 'Вт/(м·К)', 'теплопроводность при 20 °C') + tv('c', v[1], 'Дж/(кг·К)', 'удельная теплоёмкость при 20 °C') + tv('ρ', v[2], 'кг/м³', 'плотность') + tv('ε', v[3], '', 'степень черноты') + '</div>' + spnNote(r) +
    cpBtn(r.n + ' (СИТИС СПН-1 табл. 5, ИД ' + r.id + '): λ = ' + fv(v[0]) + ' Вт/(м·К); c = ' + fv(v[1]) + ' Дж/(кг·К); ρ = ' + fv(v[2]) + ' кг/м³; ε = ' + fv(v[3]), 'Скопировать');
}
var SPN_CFG = {
  1: { t: function () { return SPN_T1; }, res: spnRes1, g: 'Здание или раздел', r: 'Помещение' },
  2: { t: function () { return SPN_T2; }, res: spnRes2, g: 'Здание или источник данных', r: 'Помещение' },
  3: { t: function () { return SPN_T3; }, res: spnRes3, g: 'Группа материалов', r: 'Материал' },
  4: { t: function () { return SPN_T4; }, res: spnRes4, g: 'Источник', r: 'Жидкость' },
  5: { t: function () { return SPN_T5; }, res: spnRes5, g: 'Группа материалов', r: 'Материал' }
}, SPN_G = {};
function spnPicker(t) {
  var C = SPN_CFG[t], G = SPN_G[t] = SPN_G[t] || spnGroups(C.t()), d = spnDef(G), one = G.length === 1;
  return '<div class="trpick calc"><label for="spn' + t + 'g"' + (one ? ' hidden' : '') + '>' + C.g + '</label><select id="spn' + t + 'g"' + (one ? ' hidden' : '') + '>' + opts(G.map(function (g) { return g.n; }), d) + '</select>' +
    '<label for="spn' + t + 'r">' + C.r + '</label><select id="spn' + t + 'r">' + opts(G[d].rows.map(function (r) { return r.n; }), 0) + '</select>' +
    '<div id="spn' + t + 'o">' + C.res(G[d].rows[0]) + '</div></div>';
}
function spnPick(t, fromGroup) {
  var G = SPN_G[t], gs = document.getElementById('spn' + t + 'g'), rs = document.getElementById('spn' + t + 'r');
  if (!gs) return;
  var g = G[+gs.value];
  if (fromGroup) rs.innerHTML = opts(g.rows.map(function (r) { return r.n; }), 0);
  document.getElementById('spn' + t + 'o').innerHTML = SPN_CFG[t].res(g.rows[+rs.value || 0]);
}
document.addEventListener('change', function (e) {
  var m = /^spn([1-5])([gr])$/.exec(e.target.id);
  if (!m) return;
  var t = +m[1];
  spnPick(t, m[2] === 'g');
  if (t === 1 && m[2] === 'g') {                       /* то же здание во второй таблице, если есть */
    var code = spnCode(SPN_G[1][+e.target.value].n), g2 = document.getElementById('spn2g');
    if (code && g2) for (var i = 0; i < SPN_G[2].length; i++) if (spnCode(SPN_G[2][i].n) === code) { g2.value = i; spnPick(2, true); break; }
  }
});
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-spncp]');
  if (!b || !navigator.clipboard) return;
  navigator.clipboard.writeText(b.dataset.spncp).then(function () { var t = b.textContent; b.textContent = 'Скопировано'; setTimeout(function () { b.textContent = t; }, 1000); }, function () {});
});
PAGES.load = function () {
  return '<h1>Пожарная нагрузка для расчёта дыма</h1><p class="lead">Исходные данные для интегральной (КВМ) модели. Выбери здание, затем помещение. При выборе здания в первом блоке во втором подставится тот же класс Ф, если он есть.</p>' +
    '<h2 id="spn-t1">Плотность пожарной нагрузки (табл. 1)</h2><p class="sub">Расчётная = средняя × коэффициент колебания. Масса горючего: M = q расч · S / Qн.</p>' + spnPicker(1) +
    '<h2 id="spn-t2">Свойства горючей смеси (табл. 2)</h2>' + spnPicker(2) +
    '<h2 id="farea">Площадь пожара</h2>' + fareaBlock() +
    '<h2 id="spn-t4">Горючие жидкости (табл. 4)</h2><p class="sub">Для пожара пролива: свойства жидкости на 1 кг и скорость выгорания с 1 м² зеркала.</p>' + spnPicker(4) +
    '<h2 id="spn-t3">Горючие материалы (табл. 3)</h2><p class="sub">Теплота сгорания отдельных материалов и критический лучистый поток воспламенения. Источник указан при каждом значении.</p>' + spnPicker(3) +
    '<h2 id="spn-t5">Строительные материалы (табл. 5)</h2><p class="sub">Теплофизика ограждений при 20 °C — для теплообмена со стенами в модели.</p>' + spnPicker(5) +
    '<details class="issue"><summary>Все таблицы целиком, с фильтром</summary>' +
    '<div class="spn-bar" style="margin-top:10px"><input id="spn-q" type="search" placeholder="Фильтр: офис, склад, автомобиль, кабели" aria-label="Фильтр таблиц пожарной нагрузки"><span class="muted" id="spn-n"></span></div>' +
    '<h3>Таблица 2. Смеси горючих материалов</h3><p class="sub">Нажми строку — скопируется. Типы: М по скорости развития, Д по дымовыделению, К по токсичности.</p>' +
    '<div class="tscroll tall">' + spnT2() + '</div>' +
    '<h3 style="margin-top:16px">Таблица 1. Плотность пожарной нагрузки</h3>' +
    '<div class="tscroll tall">' + spnT1() + '</div></details>' +
    '<p class="tnote">Источник: ' + SPN_SRC + ' (табл. 1–5, значения перенесены без изменений, включая опечатки ИД первоисточника). В скобках у строки — ссылка справочника [номер источника, страница]: [2] Кошмаров Ю.А. «Прогнозирование опасных факторов пожара в помещении», [7] пособие к методике определения расчётных величин пожарного риска. Справочные данные: применимость к объекту обосновывает разработчик расчёта.</p>';
};
function spnFilter() {
  var q = document.getElementById('spn-q');
  if (!q) return;
  var w = q.value.trim().toLowerCase(), n = 0;
  ['spn1', 'spn2'].forEach(function (id) {
    var rows = document.querySelectorAll('#' + id + ' tbody tr'), lastG = null, gShow = false;
    rows.forEach(function (tr) {
      if (tr.classList.contains('g')) { if (lastG) lastG.hidden = !gShow && !!w; lastG = tr; gShow = false; return; }
      var ok = !w || tr.textContent.toLowerCase().indexOf(w) >= 0;
      tr.hidden = !ok; if (ok) { gShow = true; n++; }
    });
    if (lastG) lastG.hidden = !gShow && !!w;
  });
  document.getElementById('spn-n').textContent = w ? 'найдено ' + n : '';
}
document.addEventListener('input', function (e) { if (e.target.id === 'spn-q') spnFilter(); });
document.addEventListener('click', function (e) {
  var tr = e.target.closest && e.target.closest('.spn tbody tr[data-c]');
  if (!tr) return;
  var txt = tr.dataset.c;
  var done = function () { tr.classList.add('cp'); setTimeout(function () { tr.classList.remove('cp'); }, 900); };
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () {});
  else { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (x) {} ta.remove(); }
});
