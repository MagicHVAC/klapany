/* Переключатель «ДБН»: кнопка в шапке, пометки на карточках и правилах, страница #dbn со сводкой.
   Данные — data_dbn.js. Пометка ставится только там, где запись сверена по тексту ДБН. */
var DBN_ON = false;
var DBN_ST = { strict: ['↑', 'по ДБН строже'], soft: ['↓', 'по ДБН мягче'], diff: ['≠', 'по ДБН иначе'], same: ['=', 'как в ДБН'], none: ['∅', 'в ДБН нет'] };
try { DBN_ON = localStorage.getItem('klapany-dbn') === '1'; } catch (x) {}

function dbnRef(p) {
  var d = DBN_DOCS[p[0]]; if (!d) return '';
  var t = d.s + (p[1] ? ' <b>' + (/^(дод|разд|табл)/.test(p[1]) ? '' : 'п. ') + esc(p[1]) + '</b>' : '');
  return d.url ? '<a class="ref" href="' + d.url + '" target="_blank" rel="noopener">' + t + '</a>' : '<span class="ref">' + t + '</span>';
}
function dbnBadge(e, open) {
  var st = DBN_ST[e.s] || DBN_ST.diff;
  return '<details class="dbnb dbn-' + e.s + '"' + (open ? ' open' : '') + '><summary><b>' + st[0] + '</b> ДБН: ' + st[1] + '</summary><p>' + esc(e.n) + '</p><div class="refs">' +
    (e.p || []).map(dbnRef).join('') + '</div></details>';
}
function dbnMark() {
  if (!ROOT) return;
  [].forEach.call(ROOT.querySelectorAll('.dbnb:not(.dbnx)'), function (b) { b.remove(); });
  document.body.classList.toggle('dbn-on', DBN_ON);
  if (!DBN_ON) return;
  [].forEach.call(ROOT.querySelectorAll('.card[id]'), function (c) { var e = DBN_MAP[c.id]; if (e) c.insertAdjacentHTML('beforeend', dbnBadge(e)); });
  [].forEach.call(ROOT.querySelectorAll('.mini:not(.dbnx), .catc, .stc'), function (m) {
    var h = m.querySelector('h4, h3'); if (!h) return; var e = DBN_MAP[h.textContent.trim()]; if (e) m.insertAdjacentHTML('beforeend', dbnBadge(e));
  });
  if (DBN_MAP['#ei']) [].forEach.call(ROOT.querySelectorAll('.eibox'), function (b) { b.insertAdjacentHTML('beforeend', dbnBadge(DBN_MAP['#ei'])); });
}
/* Понятное название записи: карточка — её заголовок, правило — заголовок как на сайте */
function dbnTitle(k) {
  if (k === '#ei') return { t: 'Предел НО клапана (п. 6.22 СП 7)', h: 'no' };
  var all = [].concat(window.CASES_NO || [], window.CASES_NZ || [], window.CASES_DD || [], window.CASES_FIRE || []);
  for (var i = 0; i < all.length; i++) if (all[i].id === k) return { t: all[i].title, h: k };
  return { t: k, h: '' };
}
PAGES.dbn = function () {
  var keys = Object.keys(DBN_MAP), by = {};
  keys.forEach(function (k) { (by[DBN_MAP[k].s] = by[DBN_MAP[k].s] || []).push(k); });
  var item = function (k) {
    var x = dbnTitle(k);
    return '<div class="mini dbnx"><h4>' + (x.h ? '<a href="#' + x.h + '">' + esc(x.t) + '</a>' : esc(x.t)) + '</h4>' + dbnBadge(DBN_MAP[k], true).replace('class="dbnb', 'class="dbnb dbnx') + '</div>';
  };
  return '<h1>Нормы Украины (ДБН)</h1>' +
    '<p class="lead">Чем нормы Украины отличаются от российских — по клапанам, огнезащите воздуховодов и противодыму. Каждая пометка сверена по тексту ДБН и ссылается на пункт.</p>' +
    '<p class="sub">Как пользоваться: нажми кнопку <b>ДБН</b> в шапке — на карточках разделов появятся пометки. Нажми ещё раз — пометки скроются.</p>' +

    '<h2>Коротко: главные отличия</h2><div class="minis">' + DBN_KEY.map(function (e) {
      return '<div class="mini dbnx"><h4>' + esc(e.t) + '</h4><p>' + esc(e.d) + '</p><div class="refs">' + e.p.map(dbnRef).join('') + '</div></div>';
    }).join('') + '</div>' +

    '<h2>Предел НО клапана в преграде</h2><p class="sub">Какой клапан ставить в противопожарную преграду с данным пределом.</p>' +
    '<div class="tscroll"><table><thead><tr><th>Преграда</th><th>Украина, ДБН В.2.5-67 п. 7.11.16</th><th>Россия, СП 7.13130 п. 6.22</th></tr></thead><tbody>' +
    DBN_EI.map(function (r) { return '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b></td><td>' + r[2] + '</td></tr>'; }).join('') + '</tbody></table></div>' +

    '<h2>Все сверенные места</h2><p class="sub">Всего ' + keys.length + '. Открой группу, чтобы увидеть пункты. Название карточки — ссылка на неё.</p><div class="issues">' +
    Object.keys(DBN_ST).filter(function (s) { return by[s]; }).map(function (s) {
      return '<details class="issue dbn-' + s + '"><summary>' + DBN_ST[s][0] + ' ' + DBN_ST[s][1] + ' — ' + by[s].length + '</summary><div class="minis">' + by[s].map(item).join('') + '</div></details>';
    }).join('') + '</div>' +

    '<h2>Документы</h2><div class="minis">' + Object.keys(DBN_DOCS).map(function (k) {
      var d = DBN_DOCS[k];
      return '<div class="mini dbnx"><h4>' + d.s + '</h4><p>' + esc(d.what) + '</p><p class="sub">Ближайшие по теме в России: ' + esc(d.ru) + '.<br>Редакция: ' + esc(d.ed) + '.</p>' +
        (d.url ? '<div class="refs"><a class="ref" href="' + d.url + '" target="_blank" rel="noopener">Текст на портале e-construction</a></div>' : '') + '</div>';
    }).join('') + '</div>' +
    '<p class="sub">Справочник помогает сориентироваться. Для проекта в Украине решение принимают по действующему тексту ДБН.</p>';
};
(function () {
  var btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'dbnbtn'; btn.className = 'sndbtn' + (DBN_ON ? ' on' : ''); btn.setAttribute('aria-pressed', DBN_ON);
  btn.title = 'Показать отличия от норм Украины (ДБН) на карточках'; btn.innerHTML = '<span>ДБН</span>';
  var tin = document.querySelector('.top .tin'); if (tin) tin.appendChild(btn);
  btn.addEventListener('click', function () {
    DBN_ON = !DBN_ON; btn.classList.toggle('on', DBN_ON); btn.setAttribute('aria-pressed', DBN_ON);
    try { localStorage.setItem('klapany-dbn', DBN_ON ? '1' : '0'); } catch (x) {}
    dbnMark();
  });
})();
