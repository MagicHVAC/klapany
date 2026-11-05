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
function distBlock() {
  var opt = function (a, sel) { return a.map(function (g, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + g + '</option>'; }).join(''); };
  return '<div class="trpick"><label for="d-a">Здание</label><select id="d-a">' +
    Object.keys(DIST).map(function (k) { return '<option value="' + k + '">' + DIST[k].t + '</option>'; }).join('') + '</select>' +
    '<label for="d-ag">Его степень и класс</label><select id="d-ag">' + opt(DIST_GR, 0) + '</select>' +
    '<label for="d-bg">Соседнее жилое или общественное: степень и класс</label><select id="d-bg">' + opt(DIST_GR, 0) + '</select>' +
    '<div class="dchk"><label><input type="checkbox" id="d-blind"> Глухие стены, п. 4.5</label><label><input type="checkbox" id="d-aupt"> Оба с АУПТ, I–II степень С0, п. 4.6</label></div>' +
    '<div class="barres" id="d-res"></div></div>' + refs([['sp4', 'табл. 1']]);
}
function distShow() {
  var a = $('#d-a'), o = $('#d-res');
  if (!a || !o) return;
  var base = DIST[a.value].v[$('#d-ag').value][$('#d-bg').value], bl = $('#d-blind').checked, au = $('#d-aupt').checked;
  var cell = function (k, v, n) { return '<div class="bstep"><span>' + k + '</span><b>' + v + '</b>' + (n ? '<small>' + n + '</small>' : '') + '</div>'; };
  var h = cell('По табл. 1', base + ' м');
  if (bl) h += cell('Глухие стены', (Math.round(base * 0.8 * 10) / 10).toString().replace('.', ',') + ' м', 'минус 20 %, если выполнены все условия п. 4.5');
  if (au) h += cell('С АУПТ', (base / 2).toString().replace('.', ',') + ' м', 'минус 50 %, только оба здания I или II степени, С0');
  if (bl && au) h += '<p class="tnote">Совмещать 2 снижения нормы прямо не разрешают и не запрещают — я их не перемножаю. Решение за ГИП.</p>';
  o.innerHTML = h;
  o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop');
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-comp]');
  if (!b) return;
  b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
  $('#comp-res').innerHTML = compTable(+b.dataset.comp);
});
document.addEventListener('change', function (e) { if (/^d-/.test(e.target.id)) distShow(); });
