/* vent.html — «Воздухообмены и температуры»: кратности, нормы на человека, санприборы, местные отсосы,
   тепло от людей, климат. Данные — VENT (js/data_vent.js, собирается из базы кнопки 7). Поиск — VS (vent_search.js). */
(function () {
  var D = VENT, $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(v, d) { if (v == null || v === '') return '—'; var n = Number(v); if (isNaN(n)) return esc(v); var s = d == null ? String(Math.round(n * 1000) / 1000) : n.toFixed(d); return s.replace('.', ',').replace('-', '−'); }
  var METH = { krat: 'по кратности', people: 'по норме на человека', krat_people: 'кратность, но не менее нормы на человека', device: 'по санитарным приборам (вкладка «Приборы»)', transfer: 'перетеканием / вытяжкой', tech: 'по технологическому заданию', manual: 'по расчёту (вредности, тепло, влага)', temp: 'в справочнике — только норма температуры' };
  var DIR = { in: 'приток', out: 'вытяжка', both: 'приток и вытяжка' };
  var store = {}; try { store = JSON.parse(localStorage.getItem('vent-st') || '{}'); } catch (x) {}
  function save() { try { localStorage.setItem('vent-st', JSON.stringify(store)); } catch (x) {} }

  /* ---------- вкладки ---------- */
  var BT = {}; D.rooms.forEach(function (r) { (r.b || []).forEach(function (b) { BT[b] = 1; }); });
  var TABS = [
    { id: 'rooms', t: 'Помещения', list: D.rooms, fields: function (r) { return [[r.n, 3], [(r.k || []).join(' '), 2], [(r.b || []).join(' '), 1.2], [r.no, 1], [r.s, 1], [r.ts, 0.8], [METH[r.m] || '', 0.6]]; }, card: roomCard },
    { id: 'people', t: 'На человека', list: D.people, fields: simpleFields, card: simpleCard },
    { id: 'sanitary', t: 'Приборы', list: D.sanitary, fields: simpleFields, card: simpleCard },
    { id: 'hoods', t: 'Местные отсосы', list: D.hoods, fields: simpleFields, card: simpleCard },
    { id: 'heat', t: 'Тепло от людей', list: D.heat.rows, fields: function (r) { return [[r.n, 3], [r.h, 2], ['тепловыделения людей теплопоступления влаговыделения явное полное', 0.5]]; }, card: heatCard },
    { id: 'climate', t: 'Климат', list: D.climate.rows, fields: function (r) { return [[r.c, 3], [r.r, 2], ['климат наружный воздух', 0.3]]; }, card: null }
  ].filter(function (T) { return T.list.length; }); /* 1.22.2: пустую вкладку (отсосы без нормы) не показывать */
  TABS.forEach(function (T) { T.idx = VS.build(T.list.map(function (r, i) { return { i: i, r: r, f: T.fields(r) }; })); });
  function simpleFields(r) { return [[r.n, 3], [r.kind || '', 2], [r.no, 1], [r.s, 1], [r.u, 0.8], [DIR[r.d] || '', 0.6]]; }

  var cur = (location.hash || '').slice(1); if (!TABS.some(function (T) { return T.id === cur; })) cur = store.tab || 'rooms';
  var shown = 40, last = null;

  /* ---------- карточки ---------- */
  function hl(text, used) {
    var t = esc(text); if (!used || !used.length) return t;
    return t.replace(/[А-Яа-яЁёA-Za-z0-9]+/g, function (w) { var s = VS.stem(VS.norm(w)); for (var i = 0; i < used.length; i++) { var u = used[i]; if (u && u.v && u.v.indexOf(' ') < 0 && (u.v.length > 3 ? s.indexOf(u.v) === 0 : s === u.v)) return '<mark>' + w + '</mark>'; } return w; });
  }
  function num(lbl, v, unit, cls) { return '<div class="vnum ' + (cls || '') + '"><small>' + lbl + '</small><b>' + v + '</b>' + (unit ? '<i>' + unit + '</i>' : '') + '</div>'; }
  function roomCard(r, used) {
    var h = '<article class="vc"><header><h3>' + hl(r.n, used) + '</h3>';
    h += '</header><div class="vbt">' + ((r.b && r.b.length) ? r.b.map(function (b) { return '<span>' + esc(b) + '</span>'; }).join('') : '<span class="all">любые здания</span>') + '</div><div class="vnums">';
    var ki = r.ki || 0, ko = r.ko || 0;
    if (ki || ko || r.m === 'krat' || r.m === 'krat_people') { h += num('Приток', ki ? f(ki) : '—', ki ? '1/ч' : '', 'in') + num('Вытяжка', ko ? f(ko) : '—', ko ? '1/ч' : '', 'out'); }
    if (r.np) h += num('На чел., пост.', f(r.np), 'м³/ч', 'pp');
    if (r.nt) h += num('На чел., врем.', f(r.nt), 'м³/ч', 'pp');
    if (r.sp) h += num('На 1 м²', f(r.sp), 'м³/ч', 'pp');
    if (r.t != null) h += r.tx != null ? num('tв, холодный период', f(r.t) + '…' + f(r.tx), '°С', 't') : num('tв, зима', '≥ ' + f(r.t), '°С', 't');
    if (r.ag) h += num('Возраст детей', esc(r.ag), '', 'pp');
    if (r.te != null) h += num('tв, ранний возраст', '≥ ' + f(r.te), '°С', 't');
    h += '</div><p class="vm">Способ: <b>' + esc(METH[r.m] || r.m || '—') + '</b>' + (r.d ? ' · ' + esc(DIR[r.d] || r.d) : '') + '</p>';
    if (r.no) h += '<p class="vno">' + hl(r.no, used) + '</p>';
    h += calc(r);
    if (r.s) h += '<p class="vsrc"><span>Воздухообмен:</span> ' + esc(r.s) + '</p>';
    if (r.ts) h += '<p class="vsrc"><span>Температура:</span> ' + esc(r.ts) + '</p>';
    return h + '</article>';
  }
  function calc(r) {
    var A = +store.A || 0, H = +store.H || 0, N = +store.N || 0; if (!(A && H) && !N) return '';
    var V = A * H, out = [];
    if (V && (r.ki || r.ko)) {
      if (r.ki) out.push('приток ' + f(r.ki) + ' × ' + f(V, 1) + ' = <b>' + f(r.ki * V, 0) + '</b>');
      if (r.ko) out.push('вытяжка ' + f(r.ko) + ' × ' + f(V, 1) + ' = <b>' + f(r.ko * V, 0) + '</b>');
    }
    if (N && r.np) out.push('на людей ' + f(r.np) + ' × ' + f(N) + ' = <b>' + f(r.np * N, 0) + '</b>');
    if (A && r.sp) out.push('по площади ' + f(r.sp) + ' × ' + f(A) + ' = <b>' + f(r.sp * A, 0) + '</b>');
    if (r.m === 'krat_people' && V && N && r.ki && r.np) out.push('принять большее: <b>' + f(Math.max(r.ki * V, r.np * N), 0) + '</b>');
    return out.length ? '<p class="vcalc">м³/ч: ' + out.join(' · ') + '</p>' : '';
  }
  function simpleCard(r, used) {
    var v = r.flow != null ? r.flow : r.flow_in, h = '<article class="vc"><header><h3>' + hl(r.n, used) + '</h3></header><div class="vnums">';
    if (r.flow != null) h += num(r.d === 'in' ? 'Приток' : 'Вытяжка', f(r.flow), esc(r.u || 'м³/ч'), r.d === 'in' ? 'in' : 'out');
    if (r.flow_in != null) h += num('Приток', f(r.flow_in), esc(r.u || 'м³/ч'), 'in');
    if (v == null) h += num('Расход', '—', '');
    h += '</div>';
    if (r.kind) h += '<p class="vm">' + esc(r.kind) + '</p>';
    if (r.no) h += '<p class="vno">' + hl(r.no, used) + '</p>';
    h += '<p class="vsrc"><span>Источник:</span> ' + esc(r.s) + '</p>';
    return h + '</article>';
  }
  function heatCard(r, used) {
    var T = D.heat.temps, h = '<article class="vc vwide"><header><h3>' + hl(r.n, used) + '</h3></header>' + (r.h ? '<p class="vno">' + hl(r.h, used) + '</p>' : '');
    h += '<div class="vtw"><table class="vt"><thead><tr><th>tв, °С</th>' + T.map(function (t) { return '<th>' + f(t) + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += '<tr><th>Полное тепло, Вт</th>' + (r.qf || []).map(function (x) { return '<td>' + f(x) + '</td>'; }).join('') + '</tr>';
    h += '<tr><th>Явное тепло, Вт</th>' + (r.qs || []).map(function (x) { return '<td>' + f(x) + '</td>'; }).join('') + '</tr>';
    h += '<tr><th>Влага, г/ч</th>' + (r.w || []).map(function (x) { return '<td>' + f(x) + '</td>'; }).join('') + '</tr></tbody></table></div>';
    return h + '</article>';
  }
  function climateTable(rows) {
    var h = '<div class="vtw"><table class="vt vclim"><thead><tr><th>Пункт</th><th title="Температура наиболее холодной пятидневки обеспеченностью 0,92 — табл. 5.1">t₅, °С<br><small>пятидневка 0,92</small></th>' +
      '<th title="Параметры А, тёплый период — табл. 6.1">tА, °С<br><small>лето 0,95</small></th><th title="Параметры Б, тёплый период — табл. 6.1">tБ, °С<br><small>лето 0,98</small></th>' +
      '<th title="Продолжительность и средняя температура периода со среднесуточной t ≤ 8 °С">zот / tот<br><small>≤ 8 °С, сут / °С</small></th><th title="То же, ≤ 10 °С">z / t<br><small>≤ 10 °С</small></th>' +
      '<th title="Максимальная из средних скоростей ветра по румбам за январь">v, м/с<br><small>январь</small></th><th title="Среднегодовая температура">tгод, °С</th></tr></thead><tbody>';
    rows.forEach(function (x) { var c = x.it.r; h += '<tr><th>' + hl(c.c, x.used) + '<small>' + esc(c.r) + '</small></th><td class="tc">' + f(c.t5) + '</td><td class="tw">' + f(c.ta) + '</td><td class="tw">' + f(c.tb) + '</td><td>' + f(c.z8) + ' / ' + f(c.t8) + '</td><td>' + f(c.z10) + ' / ' + f(c.t10) + '</td><td>' + f(c.v) + '</td><td>' + f(c.ty) + '</td></tr>'; });
    return h + '</tbody></table></div>';
  }

  /* ---------- вывод ---------- */
  function tabRes(T, q) {
    var r = VS.run(T.idx, q, { assoc: !!store.as }), rows = r.rows;
    if (T.id === 'rooms') {
      var bt = store.bt || '', mt = store.mt || '', tt = !!store.tt;
      /* 1.23.5: тип здания — строго; нормы «для любых зданий» — только по галке «и общие нормы» */
      rows = rows.filter(function (x) { var r = x.it.r, b = r.b; return (!bt || (b && b.indexOf(bt) >= 0) || ((!b || !b.length) && store.gen)) && (!mt || r.m === mt || (mt === 'krat' && r.m === 'krat_people')) && (!tt || r.t != null); });
    }
    if (T.id === 'climate' && store.reg) rows = rows.filter(function (x) { return x.it.r.r === store.reg; });
    return { rows: rows, how: r.how };
  }
  function render() {
    var q = $('#q').value, T = TABS.filter(function (t) { return t.id === cur; })[0], res = tabRes(T, q);
    $('#vtabs').innerHTML = TABS.map(function (t) { var n = q ? tabRes(t, q).rows.length : t.list.length; return '<button type="button" data-t="' + t.id + '" class="' + (t.id === cur ? 'on' : '') + (q && !n ? ' zero' : '') + '">' + t.t + ' <i>' + n + '</i></button>'; }).join('');
    var h = '';
    if (q) {
      var how = res.how, bits = [];
      if (how.lat) bits.push('раскладка: «' + esc(how.lat) + '»');
      if (how.assoc.length) bits.push('по смыслу: ' + how.assoc.map(esc).join(', '));
      if (how.fuzzy.length) bits.push('с поправкой опечатки: ' + how.fuzzy.map(esc).join(', '));
      if (how.or) bits.push('все слова сразу не нашлись — показано совпадение хотя бы одного');
      h += '<p class="vhow">Найдено ' + res.rows.length + (bits.length ? ' · ' + bits.join(' · ') : '') + '</p>';
    }
    if (T.id === 'rooms') {
      h += '<div class="vtool vcalcin"><span>Прикинуть расход:</span><label>S, м² <input id="vA" inputmode="decimal" value="' + esc(store.A || '') + '"></label><label>h, м <input id="vH" inputmode="decimal" value="' + esc(store.H || '') + '"></label><label>людей <input id="vN" inputmode="numeric" value="' + esc(store.N || '') + '"></label><small>ориентир: кратность × объём, норма × людей; без расчёта вредностей и баланса</small></div>';
    }
    if (T.id === 'heat') h += '<p class="vsrc">' + esc(D.heat.src) + '</p><p class="vno">' + esc(D.heat.note) + '</p>';
    if (T.id === 'climate') h += '<p class="vsrc">' + esc(D.climate.src) + '. Наведи на заголовок графы — пояснение. По СП 60.13330.2020, п. 5.13: параметры А — вентиляция летом; Б — отопление и вентиляция зимой, кондиционирование.</p>';
    if (!res.rows.length) h += '<p class="vempty">Ничего не нашлось. Попробуй другое слово — поиск понимает синонимы («туалет», «кухня», «детсад»), опечатки и английскую раскладку.</p>';
    else if (T.id === 'climate') h += climateTable(res.rows.slice(0, shown * 4));
    else h += '<div class="vcards">' + res.rows.slice(0, shown).map(function (x) { return T.card(x.it.r, x.used); }).join('') + '</div>';
    var lim = T.id === 'climate' ? shown * 4 : shown;
    if (res.rows.length > lim) h += '<button type="button" id="vmore" class="vmore">Показать ещё (' + (res.rows.length - lim) + ')</button>';
    $('#view').innerHTML = h;
    filt(T);
    last = q;
  }

  /* Фильтры уточнений — рядом со строкой поиска, свои у каждой вкладки */
  var REG = {}; D.climate.rows.forEach(function (c) { REG[c.r] = 1; });
  var MT = {}; D.rooms.forEach(function (r) { MT[r.m === 'krat_people' ? 'krat' : r.m] = 1; });
  function opt(v, t, sel) { return '<option value="' + esc(v) + '"' + (sel === v ? ' selected' : '') + '>' + esc(t) + '</option>'; }
  function filt(T) {
    var h = '';
    if (T.id === 'rooms') {
      h += '<label>Тип здания <select id="vbt">' + opt('', 'все', store.bt || '') + Object.keys(BT).sort().map(function (b) { return opt(b, b, store.bt); }).join('') + '</select></label>';
      h += '<label>Способ <select id="vmt">' + opt('', 'любой', store.mt || '') + Object.keys(MT).map(function (m) { return opt(m, METH[m] || m, store.mt); }).join('') + '</select></label>';
      h += '<label class="chk"><input type="checkbox" id="vtt"' + (store.tt ? ' checked' : '') + '> с нормой температуры</label>';
      h += '<label class="chk" title="Нормы, не привязанные к типу здания (СП 60 и др.) — показывать вместе с выбранным типом"><input type="checkbox" id="vgen"' + (store.gen ? ' checked' : '') + '> и общие нормы для любых зданий</label>';
      h += '<label class="chk" title="Искать и по словам того же смысла: «туалет» → уборная, санузел, унитаз"><input type="checkbox" id="vas"' + (store.as ? ' checked' : '') + '> по ассоциациям</label>';
    } else if (T.id === 'climate') {
      h += '<label>Регион <select id="vreg">' + opt('', 'все', store.reg || '') + Object.keys(REG).sort().map(function (r) { return opt(r, r, store.reg); }).join('') + '</select></label>';
    }
    var any = store.bt || store.mt || store.tt || store.reg;
    if (h && any) h += '<button type="button" id="vreset" class="vreset">Сбросить уточнения</button>';
    $('#vfilt').innerHTML = h; $('#vfilt').hidden = !h;
  }

  /* ---------- события ---------- */
  var tm; $('#q').addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { shown = 40; render(); }, 160); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.t) { cur = b.dataset.t; store.tab = cur; save(); shown = 40; history.replaceState(null, '', '#' + cur); render(); window.scrollTo(0, 0); }
    else if (b.id === 'vmore') { shown += 60; render(); }
    else if (b.id === 'vreset') { store.bt = store.mt = store.reg = ''; store.tt = false; save(); shown = 40; render(); }
    else if (b.id === 'newsbtn') $('#newsdlg').showModal();
    else if (b.id === 'newsclose') $('#newsdlg').close();
    else if (b.dataset.ex) { $('#q').value = b.dataset.ex; shown = 40; render(); }
  });
  document.addEventListener('change', function (e) {
    var id = e.target.id;
    if (id === 'vbt') store.bt = e.target.value; else if (id === 'vmt') store.mt = e.target.value; else if (id === 'vtt') store.tt = e.target.checked; else if (id === 'vgen') store.gen = e.target.checked; else if (id === 'vas') store.as = e.target.checked; else if (id === 'vreg') store.reg = e.target.value; else return;
    save(); shown = 40; render();
  });
  document.addEventListener('input', function (e) {
    var id = e.target.id, k = { vA: 'A', vH: 'H', vN: 'N' }[id]; if (!k) return;
    var v = e.target.value.replace(',', '.'); store[k] = isNaN(+v) ? '' : v; save();
    clearTimeout(tm); tm = setTimeout(function () { var p = e.target.selectionStart; render(); var n = document.getElementById(id); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (x) {} } }, 350);
  });

  $('#ver').textContent = 'v' + APP.ver + ' · ' + APP.date + ' · ' + APP.author;
  $('#news').innerHTML = NEWS.slice(0, 12).map(function (n) { return '<p><b>' + n.v + '</b> ' + n.d + '<br>' + esc(n.t) + '</p>'; }).join('');
  $('#vex').innerHTML = 'Например: ' + ['туалет', 'кухня', 'детсад спальня', 'серверная', 'бассейн', 'Краснодар', 'irjkf'].map(function (w) { return '<button type="button" data-ex="' + w + '">' + w + '</button>'; }).join('');
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    var had = !!navigator.serviceWorker.controller, done = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (had && !done) { done = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) { r.update(); }).catch(function () {});
  }
})();
