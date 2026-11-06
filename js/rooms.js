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
PAGES.load = function () {
  return '<h1>Пожарная нагрузка для расчёта дыма</h1><p class="lead">Исходные данные для интегральной (КВМ) модели: плотность нагрузки на м² и свойства горючей смеси. Нажми строку — значения скопируются для вставки в программу или пояснительную записку.</p>' +
    '<div class="spn-bar"><input id="spn-q" type="search" placeholder="Фильтр: офис, склад, автомобиль, кабели" aria-label="Фильтр таблиц пожарной нагрузки"><span class="muted" id="spn-n"></span></div>' +
    '<h2 id="spn-t2">Таблица 2. Смеси горючих материалов</h2><p class="sub">Qн низшая теплота сгорания, v линейная скорость пламени, ψуд удельная скорость выгорания, B = Qн·ψуд·v² коэффициент скорости развития пожара, Dm дымообразующая способность, L — потребление O₂ (со знаком минус) и выделение газов на 1 кг, K коэффициент токсичности. Типы: М по скорости развития, Д по дымовыделению, К по токсичности.</p>' +
    '<div class="tscroll tall">' + spnT2() + '</div>' +
    '<h2 id="spn-t1">Таблица 1. Плотность пожарной нагрузки</h2><p class="sub">Расчётная = средняя × коэффициент колебания. Для массы горючего: M = q расч · S / Qн.</p>' +
    '<div class="tscroll tall">' + spnT1() + '</div>' +
    '<p class="tnote">Источник: ' + SPN_SRC + ' (табл. 1 и 2, значения перенесены без изменений, включая опечатки ИД первоисточника). В скобках у строки — ссылка справочника [номер источника, страница]: [2] Кошмаров Ю.А. «Прогнозирование опасных факторов пожара в помещении», [7] пособие к методике определения расчётных величин пожарного риска. Справочные данные: применимость к объекту обосновывает разработчик расчёта.</p>';
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
