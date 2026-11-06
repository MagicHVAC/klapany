/* Раздел «Лестничные клетки» на странице «Здание». Данные — data_stairs.js, пределы — DEG_ROWS (табл. 21 123-ФЗ). */
function stairsBlock() {
  var lim = '<div class="tscroll"><table class="vei"><thead><tr><th>Степень</th><th>Внутренние стены клетки</th><th>Марши и площадки</th></tr></thead><tbody>' +
    DEG_ROWS.map(function (r) { return '<tr><td>' + r[0] + '</td><td><span class="ei">' + r[1][5] + '</span></td><td><span class="ei">' + r[1][6] + '</span></td></tr>'; }).join('') +
    '</tbody></table></div>' + refs([['fz123', 'табл. 21']]);
  var cards = '<div class="stairs">' + STAIR_TYPES.map(function (c) {
    return '<article class="stc"><div class="sthead"><b>' + c.k + '</b><h3>' + esc(c.h) + '</h3></div><p>' + esc(c.d) + '</p>' + refs(c.r) +
      '<ul>' + c.p.map(function (p) { return '<li>' + esc(p[0]) + refs(p[1]) + '</li>'; }).join('') + '</ul></article>';
  }).join('') + '</div>';
  return '<h2 id="stairs">Лестничные клетки</h2><p class="sub">Типы по 123-ФЗ ст. 40 и что требуют к каждому. Размеры маршей и площадок — в разделе <a href="#evac">«Эвакуация»</a>.</p>' +
    cards + '<h3 class="sth">Предел огнестойкости</h3>' + lim + '<h3 class="sth">Общие правила</h3>' + mini(STAIR_RULES);
}
