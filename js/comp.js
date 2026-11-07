/* Раздел «Здание»: площадь пожарного отсека и противопожарные расстояния */
function compBlock() {
  return '<nav class="chips" aria-label="Тип здания">' + COMP.map(function (c, i) {
    return '<button type="button" data-comp="' + i + '"' + (i ? '' : ' class="on"') + '>' + c.t + '</button>';
  }).join('') + '</nav><div id="comp-res">' + compTable(0) + '</div>';
}
function compTable(i) { return tableOf(COMP[i]); }
function tableOf(c) {
  var v0 = c.v0 !== undefined ? c.v0 : c.cols.findIndex(function (h) { return /этаж|Площадь/i.test(h); });
  return '<div class="tscroll pop"><table class="vei comp"><thead><tr>' + c.cols.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
    c.rows.map(function (r, k) {
      var grp = k && r[0] !== c.rows[k - 1][0] ? ' class="grp"' : '';
      return '<tr' + grp + '>' + r.map(function (v, j) { return '<td>' + (j >= v0 ? '<span class="ar' + (v === 'НО' ? ' ar-free' : v === '—' ? ' ar-no' : '') + '">' + v + '</span>' : v) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div><ul class="cnotes"><li>НО — не ограничивается, НН — не нормируется, прочерк — не допускается.</li>' + c.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' + refs([['sp2', c.p]]);
}
/* Пары: ll — жилое/общ. с жилым/общ., lp — жилое/общ. с производственным (табл. 1), pp — производственные между собой (табл. 3) */
var DIST_PAIR = [['ll', 'Жилое или общественное — жилое или общественное'], ['lp', 'Жилое или общественное — производственное или складское'], ['pp', 'Производственное или складское — производственное или складское']];
function distBlock() {
  return '<div class="trpick"><label for="d-p">Пара зданий</label><select id="d-p">' +
    DIST_PAIR.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</select>' +
    '<div class="trpick dform" id="d-form"></div><div class="barres" id="d-res"></div></div><div id="d-refs"></div>';
}
function dOpt(a) { return a.map(function (g, i) { return '<option value="' + i + '">' + g + '</option>'; }).join(''); }
function dChk(id, t) { return '<label><input type="checkbox" id="' + id + '"> ' + t + '</label>'; }
function distForm() {
  var p = $('#d-p').value, f = $('#d-form');
  if (p === 'pp') f.innerHTML = '<label for="d-ag">Первое здание: степень и класс</label><select id="d-ag">' + dOpt(DIST3_GR) + '</select>' +
    '<label for="d-bg">Второе здание: степень и класс</label><select id="d-bg">' + dOpt(DIST3_GR) + '</select>' +
    '<label for="d-cat">Категория худшего из двух</label><select id="d-cat"><option value="abv">А, Б или В</option><option value="gd">Г или Д</option></select>' +
    '<div class="dchk">' + dChk('d-w1', 'Стена 1-го типа, п. 6.1.3 б)') + dChk('d-aupt', 'Оба с АУПТ, п. 6.1.5') + dChk('d-north', 'Север, побережья, п. 6.1.4') + '</div>';
  else f.innerHTML = '<label for="d-ag">' + (p === 'lp' ? 'Производственное или складское' : 'Первое жилое или общественное') + ': степень и класс</label><select id="d-ag">' + dOpt(DIST_GR) + '</select>' +
    '<label for="d-bg">' + (p === 'lp' ? 'Жилое или общественное' : 'Второе жилое или общественное') + ': степень и класс</label><select id="d-bg">' + dOpt(DIST_GR) + '</select>' +
    '<div class="dchk">' + dChk('d-blind', 'Глухая стена жилого или общественного, п. 4.5') + dChk('d-aupt', 'Оба с АУПТ, I–II степень С0, п. 4.6') +
    (p === 'll' ? dChk('d-w1', 'Стена 1-го типа, п. 4.11') : '') + dChk('d-reg', 'Районы IБ, IГ, IIА, IIБ и побережья, п. 4.8') + dChk('d-ks', 'Двухэтажное каркасно-щитовое V степени, п. 4.10') +
    (p === 'll' ? dChk('d-seis', 'Сейсмичность 9 баллов и выше, п. 4.7') + dChk('d-cold', 'Жилые, районы IА, IБ, IГ, IД, IIА, п. 4.9') : '') + '</div>';
  $('#d-refs').innerHTML = refs(p === 'pp' ? [['sp4', 'табл. 3'], ['sp4', '6.1.2']] : [['sp4', 'табл. 1'], ['sp4', '4.3']]) + mini(p === 'pp' ? DIST3_RULES : DIST_RULES);
}
function dNum(v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); }
function distShow(reform) {
  var pe = $('#d-p'), o = $('#d-res');
  if (!pe || !o) return;
  if (reform || !$('#d-ag')) distForm();
  var p = pe.value, a = +$('#d-ag').value, b = +$('#d-bg').value, ck = function (id) { var e = $('#' + id); return !!(e && e.checked); };
  var cell = function (k, v, n, c) { return '<div class="bstep' + (c ? ' ' + c : '') + '"><span>' + k + '</span><b>' + v + '</b>' + (n ? '<small>' + n + '</small>' : '') + '</div>'; };
  var h = '', v;
  if (p === 'pp') {
    v = DIST3[a][b];
    var gd = $('#d-cat').value === 'gd';
    if (ck('d-w1')) h = cell('П. 6.1.3 б)', 'Не нормируется', 'Стена более высокого или широкого здания в сторону другого — противопожарная 1-го типа.', 'final');
    else if (v === 'ab' && gd) h = cell('По табл. 3', 'Не нормируется', 'Оба здания I, II или III, IV степени С0, категории Г, Д.', 'final');
    else {
      if (v === 'ab') {
        v = 9; h += cell('По табл. 3', '9 м', 'Категории А, Б, В.');
        if (ck('d-aupt')) h += cell('С АУПТ', '6 м', 'П. 6.1.5: с 9 до 6 м при автоматическом пожаротушении.', 'final');
      } else {
        h += cell('По табл. 3', v + ' м');
        if (ck('d-aupt')) h += cell('С АУПТ', 'Не снижается', 'П. 6.1.5 относится только к 9 м: I, II и III, IV степени С0.', 'warn');
      }
      if (ck('d-north')) h += (a > 0 || b > 0) ? cell('Север, плюс 25 %', dNum(v * 1.25) + ' м', 'Есть здание III, IV степени С1–С3 или V степени.') : cell('П. 6.1.4', 'Не увеличивается', 'Нет здания III, IV степени С1–С3 или V степени.', 'warn');
    }
  } else {
    var base = DIST[p === 'lp' ? 'prod' : 'live'].v[a][b], g3 = a === 3 || b === 3, lv = p === 'lp' ? b : a;
    if (ck('d-w1')) h = cell('П. 4.11', 'Не нормируется', 'Более высокая и широкая стена или обе обращённые стены — противопожарные 1-го типа.', 'final');
    else {
      h += cell('По табл. 1', base + ' м');
      if (ck('d-blind')) h += lv < 3 ? cell('Глухая стена, минус 20 %', dNum(base * 0.8) + ' м', 'Глухая стена жилого или общественного здания I–IV степени С0, С1, отделка не ниже Г1, кровля Г1 или РП1.') : cell('П. 4.5', 'Не снижается', 'Только жилое или общественное I–IV степени классов С0, С1.', 'warn');
      if (ck('d-aupt')) h += (a === 0 && b === 0) ? cell('С АУПТ, минус 50 %', dNum(base / 2) + ' м', 'Только если оба здания I или II степени С0 и оба с АУПТ: III степень из той же строки таблицы не подходит.') : cell('П. 4.6', 'Не снижается', 'Только оба здания I, II степени класса С0.', 'warn');
      if (ck('d-reg')) h += g3 ? cell('Север, плюс 25 %', dNum(base * 1.25) + ' м', 'До здания IV степени С2, С3 или V степени.') : cell('П. 4.8', 'Не увеличивается', 'Только до зданий IV степени С2, С3 и V степени.', 'warn');
      if (ck('d-ks')) h += g3 ? cell('Каркасно-щитовое, плюс 20 %', dNum(base * 1.2) + ' м', 'Двухэтажное здание V степени каркасно-щитовой конструкции.') : cell('П. 4.10', 'Не применяется', 'Только для зданий V степени.', 'warn');
      if (ck('d-seis')) h += g3 ? cell('Сейсмика, плюс 20 %', dNum(base * 1.2) + ' м', 'Между жилыми, а также жилым и общественным IV степени С2, С3 и V степени.') : cell('П. 4.7', 'Не увеличивается', 'Только IV степень С2, С3 и V степень.', 'warn');
      if (ck('d-cold')) h += (a === 3 && b === 3) ? cell('Холодные районы, плюс 50 %', dNum(base * 1.5) + ' м', 'Между жилыми зданиями IV степени С2, С3 и V степени.') : cell('П. 4.9', 'Не увеличивается', 'Только оба жилых здания IV степени С2, С3 или V степени.', 'warn');
    }
  }
  if (h.split('class="bstep').length > 3) h += '<p class="tnote">Каждая поправка показана от табличного значения. Совмещение поправок нормы прямо не регулируют.</p>';
  o.innerHTML = h;
  o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop');
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-comp]');
  if (!b) return;
  b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
  $('#comp-res').innerHTML = compTable(+b.dataset.comp);
});
document.addEventListener('change', function (e) { if (e.target.id === 'd-p') distShow(true); else if (/^d-/.test(e.target.id)) distShow(); });
