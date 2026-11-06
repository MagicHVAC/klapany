/* Переключатель «Сравнить с ДБН»: кнопка в шапке, пометки на карточках и правилах, страница #dbn со сводкой.
   Данные — data_dbn.js. Пока запись не сверена по тексту ДБН, пометка не ставится: на сводной странице видно, что сверено. */
var DBN_ON = false;
var DBN_ST = { same: ['=', 'как в ДБН'], strict: ['↑', 'по ДБН строже'], soft: ['↓', 'по ДБН мягче'], diff: ['≠', 'по ДБН иначе'], none: ['∅', 'в ДБН нет'] };
try { DBN_ON = localStorage.getItem('klapany-dbn') === '1'; } catch (x) {}

function dbnBadge(e) {
  var st = DBN_ST[e.s] || DBN_ST.diff;
  return '<details class="dbnb dbn-' + e.s + '"><summary><b>' + st[0] + '</b> ДБН: ' + st[1] + '</summary><p>' + esc(e.n) + '</p><div class="refs">' +
    (e.p || []).map(function (p) { var d = DBN_DOCS[p[0]]; return d ? '<a class="ref" href="' + d.url + '" target="_blank" rel="noopener">' + d.s + ' <b>п. ' + esc(p[1]) + '</b></a>' : ''; }).join('') + '</div></details>';
}
function dbnMark() {
  if (!ROOT) return;
  [].forEach.call(ROOT.querySelectorAll('.dbnb'), function (b) { b.remove(); });
  document.body.classList.toggle('dbn-on', DBN_ON);
  if (!DBN_ON) return;
  [].forEach.call(ROOT.querySelectorAll('.card[id]'), function (c) { var e = DBN_MAP[c.id]; if (e) c.insertAdjacentHTML('beforeend', dbnBadge(e)); });
  [].forEach.call(ROOT.querySelectorAll('.mini, .catc, .stc'), function (m) {
    var h = m.querySelector('h4, h3'); if (!h) return; var e = DBN_MAP[h.textContent.trim()]; if (e) m.insertAdjacentHTML('beforeend', dbnBadge(e));
  });
}
PAGES.dbn = function () {
  var keys = Object.keys(DBN_MAP), cnt = {};
  keys.forEach(function (k) { cnt[DBN_MAP[k].s] = (cnt[DBN_MAP[k].s] || 0) + 1; });
  return '<h1>Сравнение с ДБН Украины</h1><p class="lead">Где нормы Украины совпадают с российскими, где строже, мягче или требование другое. Включи кнопку «ДБН» в шапке — пометки появятся прямо на карточках.</p>' +
    '<h2>Действующие редакции ДБН</h2><div class="minis">' + Object.keys(DBN_DOCS).map(function (k) { var d = DBN_DOCS[k]; return '<div class="mini"><h4>' + d.s + '</h4><p>' + esc(d.name) + '. ' + esc(d.ed) + '.</p><div class="refs"><a class="ref" href="' + d.url + '" target="_blank" rel="noopener">Карточка на e-construction</a></div></div>'; }).join('') + '</div>' +
    '<h2>Сверено</h2>' + (keys.length ? '<p class="sub">' + Object.keys(DBN_ST).map(function (s) { return DBN_ST[s][0] + ' ' + DBN_ST[s][1] + ': ' + (cnt[s] || 0); }).join(' · ') + '</p>' +
      '<div class="minis">' + keys.map(function (k) { var e = DBN_MAP[k]; return '<div class="mini"><h4>' + esc(k) + '</h4>' + dbnBadge(e).replace('<details ', '<details open ') + '</div>'; }).join('') + '</div>'
      : '<p class="sub">Пока ничего: сравнение заполняется только по прочитанным текстам ДБН, без пересказа по памяти. Тексты ДБН ещё не загружены — портал e-construction не отдаёт файлы автоматически.</p>') +
    '<h2>Обозначения</h2><div class="minis">' + Object.keys(DBN_ST).map(function (s) { return '<div class="mini dbn-' + s + '"><h4>' + DBN_ST[s][0] + ' ' + DBN_ST[s][1] + '</h4></div>'; }).join('') + '</div>';
};
(function () {
  var btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'dbnbtn'; btn.className = 'sndbtn' + (DBN_ON ? ' on' : ''); btn.setAttribute('aria-pressed', DBN_ON);
  btn.title = 'Пометки сравнения с ДБН Украины'; btn.innerHTML = '<span>ДБН</span>';
  var tin = document.querySelector('.top .tin'); if (tin) tin.appendChild(btn);
  btn.addEventListener('click', function () {
    DBN_ON = !DBN_ON; btn.classList.toggle('on', DBN_ON); btn.setAttribute('aria-pressed', DBN_ON);
    try { localStorage.setItem('klapany-dbn', DBN_ON ? '1' : '0'); } catch (x) {}
    dbnMark();
  });
})();
