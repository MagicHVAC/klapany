/* Разделы, маршруты, поиск, режимы анимации */
var ROUTES = [
  ['home', 'Главная'], ['how', 'Как работает'], ['no', 'НО'], ['nz', 'НЗ и ДД'], ['rooms', 'Помещения'], ['prod', 'Производство'],
  ['fire', 'Огнезащита'], ['smoke', 'Противодым'], ['load', 'Пожарная нагрузка'], ['build', 'Здание'], ['cat', 'Категории'], ['evac', 'Эвакуация'], ['alarm', 'Сигнализация'], ['aupt', 'АУПТ'], ['auto', 'Автоматика'], ['norms', 'Нормы']
];
var ICON = {
  aupt: 'M12 3v6M8 9h8M10 9l-1 3M14 9l1 3M6 15l-1 2M10 15l-.5 2.5M14 15l.5 2.5M18 15l1 2M4 21h16',
  rooms: 'M3 4h18v16H3zM3 11h9M12 4v16M16 11v9', load: 'M4 20h16M6 20V10M10 20V6M14 20v-8M18 20V4',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z', how: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18M7 7l10 10', no: 'M3 12h18M12 5v14', nz: 'M3 12h7m4 0h7M10 7v10m4-10v10', prod: 'M3 20V10l6 4V10l6 4V5h6v15z',
  alarm: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4', evac: 'M13 4a2 2 0 1 0 0 .1M9 21l2-7 3 3v5m-3-8 1-4 4 3h3M10 10l-3 3', cat: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13v7M13 16.5h7', build: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M4 12h16', smoke: 'M5 20h14M8 20V9m8 11V9M6 9h12M9 6c0-2 2-2 2-4m3 4c0-2 2-2 2-4', fire: 'M12 3c4 5 6 8 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 1-3 1-5 0-8z', auto: 'M13 3 5 14h6l-1 7 8-11h-6z', norms: 'M6 3h9l4 4v14H6zM9 11h7M9 15h7'
};
var ALL = [], ROOT;
var $ = function (s) { return document.querySelector(s); };
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

function refLink(r) {
  var n = NORMS[r[0]];
  return '<a class="ref" href="' + n.url + '" target="_blank" rel="noopener">' + n.s + (r[1] ? ' <b>' + esc(r[1].replace(/^(\d)/, 'п. $1')) + '</b>' : '') + '</a>';
}
function refs(a) { return '<div class="refs">' + a.map(refLink).join('') + '</div>'; }
function tag(t) { return '<span class="tag t' + t + '">' + { NO: 'НО', NZ: 'НЗ', DD: 'ДД', FP: 'EI' }[t] + '</span>'; }

function card(c) {
  var t = c.t;
  return '<article class="card c' + t + (c.unverified ? ' unv' : '') + '" id="' + c.id + '">' +
    '<div class="chead">' + tag(t) + '<h3>' + esc(c.title) + '</h3></div>' +
    '<p class="when">' + esc(c.when) + '</p>' +
    (c.note ? '<p class="note">' + esc(c.note) + '</p>' : '') +
    (c.unverified ? '<p class="warn">Не проверено по первоисточнику.</p>' : '') +
    '<div class="cfoot"><span class="ei">' + esc(c.ei) + '</span>' + refs(c.refs) + '</div>' +
    '<details data-sc="' + (c.sc || '') + '"><summary>' + (c.sc ? 'Схема и цитата' : 'Цитата') + '</summary><div class="dbody"><div class="slot"></div><blockquote>' + esc(c.q) + '</blockquote></div></details>' +
    '</article>';
}
function groups(list, gs) {
  var chips = '<nav class="chips" aria-label="Группы">' + gs.map(function (g) {
    return '<button type="button" data-jump="g-' + g[0] + '">' + g[1] + ' <i>' + list.filter(function (c) { return c.g === g[0]; }).length + '</i></button>';
  }).join('') + '</nav>';
  return chips + gs.map(function (g) {
    var l = list.filter(function (c) { return c.g === g[0]; });
    return l.length ? '<h2 id="g-' + g[0] + '">' + g[1] + '</h2><div class="cards">' + l.map(card).join('') + '</div>' : '';
  }).join('');
}
function strip(ids) { return '<div class="strip">' + ids.map(figure).join('') + '</div>'; }
function mini(list) {
  return '<div class="minis">' + list.map(function (e) {
    return '<div class="mini"><h4>' + esc(e.t) + '</h4><p>' + esc(e.d) + '</p>' + refs(e.r) + '</div>';
  }).join('') + '</div>';
}

var PAGES = {
  home: function () {
    return '<section class="hero"><div class="htext"><p class="eyebrow">Вентиляция и пожарная безопасность</p><h1>Какой клапан поставить и на каком основании</h1>' +
      '<p class="lead">' + CASES_NO.length + ' случаев НО, ' + CASES_NZ.length + ' случаев НЗ, категории производства и огнезащита. Каждая запись ведёт на пункт нормы.</p>' +
      '<div class="legend"><span>' + tag('NO') + ' открыт, при пожаре закрывается</span><span>' + tag('NZ') + ' закрыт, при пожаре открывается</span><span>' + tag('DD') + ' закрывается при пожаре, открывается после</span></div>' +
      '<a class="cta" href="#how">Как устроен и работает каждый клапан →</a></div>' +
      figure('hero') + '</section>' +
      '<h2>Что проектируешь</h2><div class="picks">' + PICK.map(function (p) { return '<a class="pick" href="#' + p.to + '">' + esc(p.t) + '</a>'; }).join('') + '</div>' +
      '<h2>Предел клапана по п. 6.22</h2>' + eiBlock() +
      '<h2>Где нужна осторожность</h2><p class="sub">Расхождения норм и пробелы проверки.</p>' + issues();
  },
  how: function () {
    return '<h1>Как работает клапан</h1><p class="lead">Разрез каждого типа: привод, команда от пожарной сигнализации и заслонка. Нажми фазу под схемой или включи «Авто» вверху — клапан пройдёт работу, пожар и время после пожара.</p>' +
      '<h2>Положение в каждой фазе</h2>' + howTimeline() +
      '<div class="hows">' + HOW.map(howCard).join('') + '</div>' +
      '<h2>Как читать</h2>' + mini(HOW_READ);
  },
  no: function () {
    return '<h1>Нормально открытые</h1><p class="lead">Стоят в общеобменных системах и закрываются при пожаре, чтобы дым не ушёл по воздуховодам.</p>' +
      strip(['floor', 'wall', 'transit', 'shaft', 'intake', 'attic', 'five', 'group']) + groups(CASES_NO, NO_GROUPS) +
      '<h2>Где НО не ставят</h2>' + mini(NO_EXCEPT) + '<h2>Предел клапана</h2>' + eiBlock();
  },
  nz: function () {
    return '<h1>Нормально закрытые и двойного действия</h1><p class="lead">НЗ работают в противодымных системах и открываются при пожаре. Клапан двойного действия закрывается при пожаре и открывается после него.</p>' +
      strip(['smoke', 'supply', 'gas', 'comp-nz', 'sput']) + groups(CASES_NZ, NZ_GROUPS) +
      '<h2 id="g-dd">Двойного действия</h2><div class="cards">' + CASES_DD.map(card).join('') + '</div>' +
      '<h2>Запреты и особые условия</h2>' + mini(NZ_BAN);
  },
  prod: function () {
    var marks = { yes: ['Нужен', 'm-yes'], cond: ['С условием', 'm-cond'], no: ['Нет прямого требования', 'm-no'], ban: ['Не допускается', 'm-ban'] };
    return '<h1>Производственные помещения</h1><p class="lead">Сводка по категориям для всех решений с НО. Строка раскрывает основание.</p>' +
      '<div class="mlegend">' + Object.keys(marks).map(function (k) { return '<span class="mk ' + marks[k][1] + '">' + marks[k][0] + '</span>'; }).join('') + '</div>' +
      '<div class="tscroll"><table class="matrix"><thead><tr><th>Решение</th>' + PROD_COLS.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      PROD_ROWS.map(function (r) {
        return '<tr><th scope="row">' + esc(r.t) + '<small>' + esc(r.n) + '</small>' + refs(r.r) + '</th>' + r.v.map(function (v) {
          return '<td><span class="mk ' + marks[v][1] + '" title="' + marks[v][0] + '">' + { yes: 'Да', cond: 'Усл.', no: '—', ban: 'Нет' }[v] + '</span></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      strip(['wall', 'merge', 'lock', 'group']) + '<h2>Особые условия</h2>' + mini(PROD_NOTES) +
      '<h2>Все случаи для производства</h2><div class="cards">' +
      ['no-wall', 'no-suck', 'no-5m', 'no-group', 'no-floor', 'no-mer-v', 'no-mer-v4', 'no-mer-add', 'no-mer-a', 'no-lock', 'no-heat', 'no-flow'].map(function (id) {
        return card(CASES_NO.filter(function (c) { return c.id === id; })[0]).replace('id="' + id + '"', '');
      }).join('') + '</div>';
  },
  fire: function () {
    return '<h1>Огнезащита воздуховодов</h1><p class="lead">Нормы задают предел огнестойкости EI. Огнезащитное покрытие один из способов его получить, наряду с шахтой и заводской конструкцией.</p>' +
      strip(['option', 'gap', 'comp', 'room']) + '<h2>Когда предел нормируется</h2><div class="cards">' + CASES_FIRE.map(function (c) { c.t = 'FP'; return card(c); }).join('') + '</div>' +
      '<h2 id="tr">Транзит: что обслуживаем и через что идём</h2>' + trBlock() +
      '<h2>Когда можно без предела</h2>' + mini(FIRE_FREE) + '<h2>Требования к исполнению</h2>' + mini(FIRE_RULES) +
      '<h2 id="apply">Как применять огнезащиту</h2><p class="sub">Предел даёт испытанная система, а не отдельный материал.</p>' + mini(FIRE_APPLY) +
      '<h2 id="classes">Классы материалов и герметичности</h2>' + mini(FIRE_CLASS) +
      '<h2>Прокладка и венткамеры</h2>' + mini(LAY_RULES);
  },
  smoke: function () {
    return '<h1>Противодымная вентиляция</h1><p class="lead">Пределы клапанов и воздуховодов, классы вентиляторов, где их ставить и куда выбрасывать дым.</p>' +
      strip(['smoke', 'supply', 'roof', 'facade', 'comp-nz']) +
      '<h2 id="dpu">Число дымоприёмных устройств</h2>' + dpuBlock() +
      '<h2>Пределы НЗ клапанов</h2><div class="tscroll"><table class="vei"><thead><tr><th>Система</th><th>Где</th><th>Не менее</th><th>СП 7.13130</th></tr></thead><tbody>' +
      VALVE_EI.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td><td><span class="ei">' + r[2] + '</span></td><td>п. ' + esc(r[3]) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' + mini(VALVE_EI_NOTE) +
      '<h2>Оборудование</h2>' + mini(SMOKE_EQUIP) + '<h2>Выброс дыма и забор воздуха</h2>' + mini(SMOKE_OUT);
  },
  build: function () {
    return '<h1>Огнестойкость здания</h1><p class="lead">Степени огнестойкости, противопожарные преграды и их заполнения, огнезащита конструкций. Сначала выбери преграду — справочник покажет предел, двери и тамбур-шлюз.</p>' +
      '<h2>Подбор по преграде</h2>' + barBlock() +
      '<h2>Как читать предел</h2>' + mini(LIMIT_READ) +
      '<h2 id="comp">Площадь этажа в пожарном отсеке</h2><p class="sub">Выбери тип здания. Значения — наибольшая площадь этажа, м².</p>' + compBlock() +
      '<h2 id="types">Требования по типам зданий</h2>' + mini(TYPE_RULES) +
      '<h2 id="dist">Противопожарные расстояния</h2>' + distBlock() +
      '<h2 id="deg">Степени огнестойкости</h2>' + degBlock() + stairsBlock() +
      '<h2>Заполнение проёмов по типам</h2><div class="tscroll"><table class="vei"><thead><tr><th>Элемент</th><th>1-й тип</th><th>2-й тип</th><th>3-й тип</th></tr></thead><tbody>' +
      FILL.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td>' + r[1].map(function (v) { return '<td><span class="ei">' + v + '</span></td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div><p class="tnote">Двери шахт лифтов — 2-й тип, EI 30, в зданиях до 28 м — E 30. Занавесы — 1-й тип, EI 60.</p>' + refs([['fz123', 'табл. 24']]) +
      '<h2>Правила для преград</h2>' + mini(BAR_RULES) +
      '<h2 id="sfp">Огнезащита строительных конструкций</h2><p class="sub">Для несущих конструкций и преград. Воздуховоды — в разделе «Огнезащита».</p>' + mini(STRUCT_FP) +
      '<h2>Конструкции, пустоты, потолки</h2>' + mini(STRUCT_RULES) +
      '<h2>Выделение помещений</h2>' + mini(ROOM_RULES);
  },
  cat: function () {
    return '<h1>Категории помещений и зданий</h1><p class="lead">От категории зависят преграды, площадь отсека, клапаны, тамбур-шлюзы и вентиляция. Помещение проверяют от А к Д, здание — по доле площадей.</p>' +
      '<div class="cats">' + CAT_ROOM.map(function (c) { return '<article class="catc"><b>' + c.k + '</b><h3>' + c.h + '</h3><p>' + esc(c.d) + '</p></article>'; }).join('') + '</div>' + refs([['sp12', 'табл. 1']]) +
      '<h2 id="vcalc">Категория В1–В4 по пожарной нагрузке</h2><div class="tscroll"><table class="vei"><thead><tr><th>Категория</th><th>g, МДж/м²</th><th>Способ размещения</th></tr></thead><tbody>' +
      CAT_G.map(function (r) { return '<tr><td>' + r[0] + '</td><td><span class="ei">' + r[1] + '</span></td><td>' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      roomCalcBlock() + '<p class="tnote">Калькулятор не определяет А и Б: для них нужен расчёт давления взрыва по приложению А. Предельное расстояние берётся по ближайшему меньшему qкр таблицы Б.2 — в запас.</p>' +
      '<h2 id="bcalc">Категория здания</h2>' + bldCalcBlock() +
      '<h2>Правила</h2>' + mini(CAT_RULES);
  },
  evac: function () {
    return '<h1>Эвакуация</h1><p class="lead">Выходы, размеры путей, лестницы. Для ОВиК важно: что можно прокладывать в коридорах и лестничных клетках и какие лестницы требуют подпора.</p>' +
      '<h2>Типы лестничных клеток</h2><p class="sub">Подробно по каждому типу — в разделе <a href="#build">«Здание»</a>, блок «Лестничные клетки».</p><div class="cats">' + STAIRS.map(function (c) { return '<article class="catc"><b>' + c.k + '</b><h3>' + c.h + '</h3><p>' + esc(c.d) + '</p>' + refs(c.r) + '</article>'; }).join('') + '</div>' +
      '<h2>Размеры: не меньше</h2><div class="tscroll"><table class="vei"><thead><tr><th>Что</th><th>Норма</th><th>Отступления</th><th>СП 1.13130</th></tr></thead><tbody>' +
      EVAC_DIM.map(function (r) { return '<tr><td>' + r[0] + '</td><td><span class="ei">' + r[1] + '</span></td><td>' + esc(r[2]) + '</td><td>п. ' + r[3] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="tnote">Отклонение геометрии допускается не больше 5 % (п. 4.1.5).</p>' +
      '<h2>Число выходов</h2>' + mini(EVAC_EXITS) +
      '<h2>Лестницы и инженерные сети</h2>' + mini(EVAC_STAIR_RULES) +
      '<h2 id="evprod">Длина пути в производственных помещениях</h2>' + tableOf(EVAC_PROD);
  },
  alarm: function () {
    return '<h1>Сигнализация и оповещение</h1><p class="lead">Что пожарная автоматика делает с вентиляцией и клапанами, и какой способ оповещения нужен зданию. СП 3.13130 действует в новой редакции 2026 года.</p>' +
      '<h2>Автоматика и вентиляция</h2>' + mini(ALARM_VENT) +
      '<h2 id="soue">Способ оповещения</h2><div class="trpick"><label for="so">Здание</label><select id="so">' + SOUE.map(function (r, i) { return '<option value="' + i + '">' + r[0] + '</option>'; }).join('') + '</select><div class="barres" id="so-res"></div></div>' +
      '<p class="tnote">¹ Звуковой можно заменить речевым по заданию на проектирование. Площадь — суммарная по зданию, порог для звукового можно превысить до 5 %.</p>' + refs([['sp3', 'прил. Б, табл. Б.1']]) +
      '<h2>Требования к оповещению</h2>' + mini(SOUE_RULES);
  },
  auto: function () {
    return '<h1>Управление клапанами</h1><p class="lead">Кто даёт команду, что отключается и что контролируется.</p>' + strip(['hero', 'intake', 'gas']) + mini(AUTO);
  },
  norms: function () {
    return '<h1>Нормы</h1><p class="lead">Все источники справочника. Текст сверен ' + APP.date + ' по консолидированным редакциям в открытых базах. Для выпуска проекта сверяй с официальной публикацией.</p>' +
      '<div class="normlist">' + Object.keys(NORMS).map(function (k) {
        var n = NORMS[k];
        return '<article class="norm"><span class="st st-' + n.status + '">' + (n.status === 'ok' ? 'Сверено' : 'Проверить') + '</span><h3>' + esc(n.name) + '</h3><p>' + esc(n.ed) + '</p><p class="muted">' + esc(n.role) + '</p>' +
          '<div class="refs"><a class="ref" href="' + n.url + '" target="_blank" rel="noopener">Открыть текст</a>' + n.alt.map(function (a) { return '<a class="ref" href="' + a[1] + '" target="_blank" rel="noopener">' + a[0] + '</a>'; }).join('') + '</div></article>';
      }).join('') + '</div><h2>Спорные места и пробелы</h2>' + issues();
  },
  search: function (q) {
    var w = q.toLowerCase(), r = ALL.filter(function (c) {
      return (c.title + ' ' + c.when + ' ' + c.q + ' ' + (c.note || '') + ' ' + c.ei + ' ' + c.refs.map(function (x) { return NORMS[x[0]].s + ' ' + x[1]; }).join(' ')).toLowerCase().indexOf(w) >= 0;
    });
    return '<h1>Поиск: ' + esc(q) + '</h1><p class="lead">Найдено ' + r.length + '.</p><div class="cards">' + r.map(card).join('') + '</div>' +
      (r.length ? '' : '<p>Попробуй номер пункта или слово: шахта, стоянка, 6.10.</p>');
  }
};

function issues() { return '<div class="issues">' + ISSUES.map(function (i) { return '<details class="issue"><summary>' + esc(i.t) + '</summary><p>' + esc(i.d) + '</p></details>'; }).join('') + '</div>'; }

function eiBlock() {
  return '<div class="eibox"><div class="eibtns" role="group" aria-label="Предел преграды">' + EI_TABLE.map(function (e, i) {
    return '<button type="button" class="eibtn' + (i ? '' : ' on') + '" data-ei="' + i + '">' + e.b + '</button>';
  }).join('') + '</div><div class="eires"><b>' + EI_TABLE[0].v + '</b><span>' + EI_TABLE[0].n + '. ' + '</span></div>' + refs([['sp7', '6.22']]) + '</div>';
}

function trText(v) {
  var note = [];
  if (v.indexOf('**') >= 0) note.push('Для воздуховодов из А и Б прокладка не допускается.');
  else if (v.indexOf('*') >= 0) note.push('В зданиях III, IV степени вместо EI 30 принимают EI 15.');
  if (v.indexOf('!') >= 0) note.push('СП 60 табл. Н даёт здесь НН/30. Принято значение СП 7.');
  var c = v.replace(/[*!]/g, '');
  if (c === 'НД') return ['Прокладка не допускается', note];
  if (c === 'НН') return ['Предел не нормируется', note];
  var p = c.split('/');
  if (p.length === 1) return ['EI ' + p[0], note];
  return [(p[0] === 'НН' ? 'На этаже не нормируется' : 'На этаже EI ' + p[0]) + ', вне этажа EI ' + p[1], note];
}
function trBlock() {
  return '<div class="trpick"><label for="tr-r">Что обслуживает система</label><select id="tr-r">' + TR_ROWS.map(function (r, i) { return '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + r[0] + '</option>'; }).join('') + '</select>' +
    '<label for="tr-c">Через какое помещение идёт</label><select id="tr-c">' + TR_COLS.map(function (c, i) { return '<option value="' + i + '"' + (i === 4 ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>' +
    '<div class="trres" id="tr-res"></div></div>' +
    '<div class="tscroll"><table class="tr"><thead><tr><th>Обслуживает ↓ / Через →</th>' + TR_COLS.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
    TR_ROWS.map(function (r, i) {
      return '<tr><th scope="row">' + r[0] + '</th>' + r[1].map(function (v, j) {
        var c = v.replace(/[*!]/g, ''), k = c === 'НД' ? 'x-ban' : c === 'НН' ? 'x-free' : c.indexOf('НН') === 0 ? 'x-part' : c.indexOf('15') === 0 ? 'x-15' : 'x-30';
        return '<td class="' + k + '" data-r="' + i + '" data-c="' + j + '"><button type="button">' + v.replace('**', '²').replace('*', '¹').replace('!', '⚠') + '</button></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>' +
    '<p class="tnote">Числитель: на обслуживаемом этаже. Знаменатель: вне его. ¹ EI 15 в зданиях III, IV степени. ² Запрет для воздуховодов из А и Б. ⚠ Расхождение с СП 60.</p>' + refs([['sp7', 'прил. В, табл. В.1'], ['sp60', 'прил. Н']]);
}
function barBlock() {
  return '<div class="trpick"><label for="bar">Преграда</label><select id="bar">' + BAR.map(function (b, i) { return '<option value="' + i + '"' + (i === 2 ? ' selected' : '') + '>' + b.n + '</option>'; }).join('') + '</select>' +
    '<div class="barres" id="bar-res"></div></div>' + refs([['fz123', 'табл. 23'], ['fz123', 'табл. 24'], ['fz123', 'табл. 25']]);
}
function barShow() {
  var s = $('#bar'), o = $('#bar-res');
  if (!s || !o) return;
  var b = BAR[s.value], t = TAMB[b.t], f = b.f - 1;
  var step = function (k, v, n) { return '<div class="bstep"><span>' + k + '</span><b>' + v + '</b>' + (n ? '<small>' + n + '</small>' : '') + '</div>'; };
  o.innerHTML = step('Предел преграды', b.ei) +
    step('Заполнение проёмов', b.f + '-й тип', 'двери ' + FILL[0][1][f] + ', остеклённые ' + FILL[1][1][f] + ', дымогазонепроницаемые ' + FILL[2][1][f] + ', окна ' + FILL[4][1][f]) +
    step('Тамбур-шлюз', b.t + '-й тип', 'перегородки ' + t[0] + '-го типа ' + BAR[t[0] === 1 ? 2 : 3].ei + ', перекрытия ' + t[1] + '-го типа ' + BAR[5 + t[1]].ei + ', двери ' + t[2] + '-го типа ' + FILL[0][1][t[2] - 1]);
  o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop');
}
function degBlock() {
  return '<div class="eibtns" role="group" aria-label="Степень огнестойкости">' + DEG_ROWS.map(function (r, i) { return '<button type="button" class="eibtn' + (i ? '' : ' on') + '" data-deg="' + i + '">' + r[0] + ' степень</button>'; }).join('') + '</div>' +
    '<div class="degs" id="deg-res">' + degCards(0) + '</div>' + refs([['fz123', 'табл. 21'], ['sp2', '5.4.2']]);
}
function degCards(i) {
  return DEG_COLS.map(function (c, j) { return '<div class="deg"><b>' + DEG_ROWS[i][1][j] + '</b><span>' + c + '</span></div>'; }).join('');
}
function soShow() {
  var s = $('#so'), o = $('#so-res');
  if (!s || !o) return;
  var r = SOUE[s.value], st = function (k, v) { return '<div class="bstep' + (v === '—' ? '' : ' final') + '"><span>' + k + '</span><b>' + (v === '—' ? 'не применяют' : v) + '</b></div>'; };
  o.innerHTML = st('Звуковой способ', r[1]) + st('Речевой способ', r[2]);
  o.classList.remove('pop'); void o.offsetWidth; o.classList.add('pop');
}
function trShow() {
  var a = $('#tr-r'), b = $('#tr-c'), o = $('#tr-res');
  if (!a || !o) return;
  var t = trText(TR_ROWS[a.value][1][b.value]);
  o.innerHTML = '<b>' + t[0] + '</b>' + t[1].map(function (n) { return '<span>' + n + '</span>'; }).join('');
  document.querySelectorAll('.tr td').forEach(function (td) { td.classList.toggle('sel', td.dataset.r === a.value && td.dataset.c === b.value); });
}

function openCard(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var d = el.querySelector('details');
  if (d) { d.open = true; fillSlot(d); }
  el.classList.add('flash');
  el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
function fillSlot(d) {
  var s = d.querySelector('.slot');
  if (s && !s.innerHTML && d.dataset.sc) {
    s.innerHTML = figure(d.dataset.sc);
    /* дорисованная схема не проходит через reveal() — показываем сразу */
    s.querySelectorAll('.fig').forEach(function (f) { f.classList.add('in'); });
  }
}

function sectionOf(id) {
  if (id.indexOf('no-') === 0) return 'no';
  if (id.indexOf('nz-') === 0 || id.indexOf('dd-') === 0) return 'nz';
  if (id.indexOf('fi-') === 0) return 'fire';
  return null;
}
function show(name, arg) {
  ROOT.innerHTML = PAGES[name](arg);
  reveal();
  document.querySelectorAll('.nav a').forEach(function (a) { a.classList.toggle('on', a.dataset.r === name); });
  trShow();
  barShow();
  distShow();
  roomCalc();
  bldCalc();
  soShow();
  stairPick();
  dpuCalc();
  fareaCalc();
  auCalc();
}
function route() {
  var h = location.hash.slice(1) || 'home', s = sectionOf(h);
  if (PAGES[h] && h !== 'search') { show(h); window.scrollTo(0, 0); }
  else if (s) { show(s); openCard(h); }
  else { show('home'); }
  statPage();
}

/* Плавное появление блоков при прокрутке */
var IO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); IO.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px' }) : null;
function reveal() {
  if (!IO) return;
  document.documentElement.classList.add('rv');
  ROOT.querySelectorAll('.card,.fig,.mini,.pick,.how,.norm,.issue').forEach(function (el, i) { el.style.setProperty('--d', (i % 6) * 60 + 'ms'); IO.observe(el); });
}

/* Режимы: автопоказ или ручной выбор */
var AUTOPLAY = true, TIMER = null, CYCLE = ['n', 'f', 'a'], STEP = 0;
function setMode(m) {
  document.documentElement.dataset.mode = m;
  document.querySelectorAll('.mode button[data-m]').forEach(function (b) { b.classList.toggle('on', b.dataset.m === m); b.setAttribute('aria-pressed', b.dataset.m === m); });
}
function setAuto(on) {
  AUTOPLAY = on;
  document.documentElement.toggleAttribute('data-auto', on);
  $('#m-auto').classList.toggle('on', on);
  clearInterval(TIMER);
  if (on) TIMER = setInterval(function () { STEP = (STEP + 1) % 3; setMode(CYCLE[STEP]); }, 6000);
}

function init() {
  ROOT = $('#view');
  ALL = CASES_NO.map(function (c) { c.t = 'NO'; return c; }).concat(CASES_NZ.map(function (c) { c.t = 'NZ'; return c; }), CASES_DD.map(function (c) { c.t = 'DD'; return c; }), CASES_FIRE.map(function (c) { c.t = 'FP'; return c; }));
  $('.nav').innerHTML = ROUTES.map(function (r) {
    return '<a href="#' + r[0] + '" data-r="' + r[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON[r[0]] + '"/></svg><span>' + r[1] + '</span></a>';
  }).join('');
  $('#ver').textContent = 'v' + APP.ver + ' · ' + APP.date + ' · ' + APP.author;
  $('#news').innerHTML = NEWS.map(function (n) { return '<p><b>' + n.v + '</b> ' + n.d + '<br>' + esc(n.t) + '</p>'; }).join('');
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button,a');
    if (!b) return;
    if (b.dataset.m) { setAuto(false); STEP = CYCLE.indexOf(b.dataset.m); setMode(b.dataset.m); }
    if (b.id === 'm-auto') setAuto(!AUTOPLAY);
    if (b.dataset.jump) { var t = document.getElementById(b.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
    if (b.dataset.ei !== undefined) {
      var e0 = EI_TABLE[b.dataset.ei], box = b.closest('.eibox');
      box.querySelectorAll('.eibtn').forEach(function (x) { x.classList.toggle('on', x === b); });
      box.querySelector('.eires').innerHTML = '<b>' + e0.v + '</b><span>' + e0.n + '.</span>';
    }
    if (b.dataset.deg !== undefined) {
      b.parentNode.querySelectorAll('.eibtn').forEach(function (x) { x.classList.toggle('on', x === b); });
      var dr = $('#deg-res'); dr.innerHTML = degCards(+b.dataset.deg); dr.classList.remove('pop'); void dr.offsetWidth; dr.classList.add('pop');
    }
    if (b.id === 'newsbtn') $('#newsdlg').showModal();
    if (b.id === 'newsclose') $('#newsdlg').close();
    var td = b.closest('.tr td');
    if (td) { $('#tr-r').value = td.dataset.r; $('#tr-c').value = td.dataset.c; trShow(); }
  });
  document.addEventListener('change', function (e) { if (e.target.id === 'tr-r' || e.target.id === 'tr-c') trShow(); if (e.target.id === 'bar') barShow(); if (e.target.id === 'so') soShow(); });
  document.addEventListener('toggle', function (e) { if (e.target.tagName === 'DETAILS' && e.target.open) fillSlot(e.target); }, true);
  $('#q').addEventListener('input', function () {
    var v = this.value.trim();
    if (v.length >= 2) show('search', v); else route();
  });
  window.addEventListener('hashchange', function () { $('#q').value = ''; route(); });
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  setMode('n');
  setAuto(!calm);
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
}
document.addEventListener('DOMContentLoaded', init);
