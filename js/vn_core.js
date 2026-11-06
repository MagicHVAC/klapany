/* Раздел «Расчёт ПДВ» — расчёт противодымной вентиляции по МР ВНИИПО к СП 7.13130.2013 (2013), вкладками.
   Ядро: страница, вкладки, общие помощники, передача результатов между вкладками, выгрузка в Word.
   Расчёты: vn_exh.js (разд. 3 — расход дыма), net.js (п. 5.1 — сеть и вентилятор), vn_sup.js (разд. 4, п. 5.2 — подпор).
   Плотность воздуха ρ = 353/T — уравнение состояния (МР, формула (5) для дыма; для воздуха — допущение справочника). */
var VN_TABS = [
  ['exh', 'Дым из помещения', 'разд. 3.1'], ['cor', 'Коридор, холл', 'п. 3.2.1'], ['atr', 'Атриум, вестибюль', 'п. 3.2.2'],
  ['net', 'Сеть и вентилятор', 'п. 5.1'], ['st', 'Лестничная клетка', 'п. 4.1'], ['lf', 'Лифтовая шахта', 'п. 4.2'],
  ['tm', 'Тамбур-шлюз', 'п. 4.3'], ['cp', 'Компенсация', 'п. 4.4'], ['sz', 'Зона безопасности', 'п. 4.5']
];
var VN_TAB = 'exh', VN = { exh: null, cor: null, atr: null };
try { VN_TAB = localStorage.getItem('klapany-vn-tab') || 'exh'; } catch (x) {}
var VN_G = 9.81;
function vnRho(t) { return 353 / (t + 273.15); }
function vnC(k, v, s, cl) { return '<div class="bstep' + (cl ? ' ' + cl : '') + '"><span>' + k + '</span><b>' + v + '</b>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; }
function vnRes(id, r, cards) {
  var h = r.err.length ? r.err.map(function (e) { return vnC('Ошибка исходных данных', 'Пересмотри', e, 'warn'); }).join('') : cards;
  h += r.warn.map(function (w) { return vnC('Внимание', 'Проверь', w, 'warn'); }).join('');
  $('#' + id).innerHTML = h;
}
function vnBad(r) { if (r.marks.some(function (m) { return m[1] === 'bad'; })) { r.err.push('Исправь поля, подсвеченные красным.'); return true; } return false; }
function vnGrp(title, inner) { return '<h3 class="nh">' + title + '</h3><div class="trpick stpick">' + inner + '</div>'; }
function vnBtns(pfx, extra) { return '<div class="dpbtns">' + (extra || '') + '<button type="button" class="eibtn on" data-vndoc="' + pfx + '">Скачать в Word</button></div>'; }
/* таблица для Word и экрана: rows — массив массивов */
function vnTable(head, rows) {
  return '<div class="tscroll"><table class="vei"><thead><tr>' + head.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
    rows.map(function (r) { return '<tr>' + r.map(function (x) { return '<td>' + x + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
}
function vnDoc(title, body, file) {
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + title + '</title>' +
    '<style>body{font-family:\'GOST type B\',\'GOST Type BU\',ISOCPEUR,Arial,sans-serif;font-size:12pt}h1{font-size:14pt}h2{font-size:12pt}table{border-collapse:collapse}td,th{border:1px solid #000;padding:3pt 6pt;font-size:10pt}</style></head><body>' +
    '<h1>' + title + '</h1><p>Основание: СП 7.13130.2013 с Изм. № 1–3; «Расчётное определение основных параметров противодымной вентиляции зданий. Методические рекомендации к СП 7.13130.2013» (ФГБУ ВНИИПО МЧС России, 2013, согласованы МЧС России 30.01.2013).</p>' +
    body.replace(/<div class="tscroll">|<\/div>/g, '').replace(/ class="[^"]*"/g, '') +
    '<p style="font-size:10pt;color:#555">Сформировано: «Справочник инженера ОВиК» v' + APP.ver + ', ' + new Date().toLocaleDateString('ru-RU') + '. Решение принимает ГИП.</p></body></html>';
  var blob = new Blob(['﻿', html], { type: 'application/msword' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = file + '.doc'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
/* передача: последний расход дыма из вкладок 3.1 / 3.2 */
function vnLastSmoke() {
  var c = [VN.exh, VN.cor, VN.atr].filter(function (x) { return x && !x.err.length; });
  c.sort(function (a, b) { return b.at - a.at; });
  return c[0] || null;
}
function vnTake(ids) {
  var s = vnLastSmoke(); if (!s) { alert('Сначала посчитай расход дыма на вкладке «Дым из помещения», «Коридор» или «Атриум».'); return null; }
  if (ids.g && $('#' + ids.g)) $('#' + ids.g).value = Math.round(s.Gsm * 1000) / 1000;
  if (ids.t && $('#' + ids.t)) $('#' + ids.t).value = Math.round(s.tsm * 10) / 10;
  if (ids.tr && $('#' + ids.tr)) $('#' + ids.tr).value = s.tr;
  return s;
}

PAGES.pdv = function () {
  return '<h1>Расчёт противодымной вентиляции</h1><p class="lead">Полный расчёт по методическим рекомендациям ВНИИПО к СП 7.13130: расход дыма, сеть дымоудаления и вентилятор, подпор лестниц, лифтовых шахт, тамбур-шлюзов, компенсация, зоны безопасности. Результат одной вкладки передаётся в другие кнопкой «Взять…».</p>' +
    '<div class="vntabs" role="tablist">' + VN_TABS.map(function (t) { return '<button type="button" role="tab" data-vntab="' + t[0] + '"' + (t[0] === VN_TAB ? ' class="on" aria-selected="true"' : '') + '>' + t[1] + '<small>' + t[2] + '</small></button>'; }).join('') + '</div>' +
    '<section class="vnp" data-vnp="exh">' + exhBlock() + '</section>' +
    '<section class="vnp" data-vnp="cor">' + corBlock() + '</section>' +
    '<section class="vnp" data-vnp="atr">' + atrBlock() + '</section>' +
    '<section class="vnp" data-vnp="net">' + netBlock() + '</section>' +
    '<section class="vnp" data-vnp="st">' + stBlock() + '</section>' +
    '<section class="vnp" data-vnp="lf">' + lfBlock() + '</section>' +
    '<section class="vnp" data-vnp="tm">' + tmBlock() + '</section>' +
    '<section class="vnp" data-vnp="cp">' + cpBlock() + '</section>' +
    '<section class="vnp" data-vnp="sz">' + szBlock() + '</section>' +
    '<p class="tnote">Коэффициенты, которых в МР нет (полнота сгорания, местные сопротивления сети, характеристики дверей и клапанов), — по паспортам изделий и справочникам; в полях стоят примеры, они помечены. Плотность воздуха ρ = 353/T — уравнение состояния.</p>' +
    refs([['mr7', 'разд. 3'], ['mr7', 'разд. 4'], ['mr7', 'разд. 5'], ['sp7', '7.2'], ['sp7', '7.14']]);
};
function vnShowTab() {
  [].forEach.call(document.querySelectorAll('.vnp'), function (p) { p.hidden = p.dataset.vnp !== VN_TAB; });
  [].forEach.call(document.querySelectorAll('[data-vntab]'), function (b) { var on = b.dataset.vntab === VN_TAB; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
}
function vnCalcAll() {
  if (!$('.vntabs')) return;
  vnShowTab();
  exhCalc(); corCalc(); atrCalc(); netCalc(); stCalc(); lfCalc(); tmCalc(); cpCalc(); szCalc();
}
var VN_CALC = { ex: 'exhCalc', co: 'corCalc', at: 'atrCalc', st: 'stCalc', lf: 'lfCalc', tm: 'tmCalc', cp: 'cpCalc', sz: 'szCalc' };
function vnOnInput(e) { var m = /^(ex|co|at|st|lf|tm|cp|sz)-/.exec(e.target.id || ''); if (m && window[VN_CALC[m[1]]]) window[VN_CALC[m[1]]](); }
document.addEventListener('input', vnOnInput);
document.addEventListener('change', vnOnInput);
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-vntab]');
  if (t) { VN_TAB = t.dataset.vntab; try { localStorage.setItem('klapany-vn-tab', VN_TAB); } catch (x) {} vnShowTab(); return; }
  var d = e.target.closest('[data-vndoc]'); if (d && window[d.dataset.vndoc + 'Doc']) window[d.dataset.vndoc + 'Doc']();
});
