/* 1.23.0: проект — все системы ПДВ здания (ДВ и ДП) в одном месте.
   Сводная таблица: система, назначение, расход L и давление P для подбора вентилятора, температура перемещаемой среды.
   Один документ Word: сводка + отчёт каждой системы с формулами, сетью по участкам и объёмной схемой.
   Хранение — в браузере (localStorage). Открытая из проекта система сохраняется при каждой правке. */
var KVP = [];
try { KVP = JSON.parse(localStorage.getItem('klapany-kv-proj') || '[]') || []; } catch (x) { KVP = []; }
function kvpSave() { try { localStorage.setItem('klapany-kv-proj', JSON.stringify(KVP)); } catch (x) {} }
var KVP_KIND = { smk: 'ДВ — дымоудаление', stair: 'ДП — лестничная клетка', lift: 'ДП — лифтовая шахта', tamb: 'ДП — тамбур-шлюз, зона безопасности' };

/* строки сводки одной системы; у дымоудаления с компенсацией — вторая строка ДП */
function kvpRows(s) {
  var p = JSON.parse(JSON.stringify(s.p)), o = kvRun(s.mode, p), r = [], bad = (o.err || []).length;
  var t = s.mode === 'smk' ? o.tFan : p.air ? p.air.ta : NaN;
  r.push({ id: s.id, sys: p.system || '—', kind: KVP_KIND[s.mode], obj: p.name || '', L: o.Lv, P: o.Psv, t: t, bad: bad, o: o, p: p, mode: s.mode });
  if (s.mode === 'smk' && o.comp) r.push({ id: s.id, sub: true, sys: (p.system || '') + ' (компенсация)', kind: 'ДП — компенсирующая подача', obj: p.name || '', L: o.comp.Lv, P: o.comp.Psv, t: p.tComp, bad: 0 });
  return r;
}
function kvpBlock() {
  var rows = [].concat.apply([], KVP.map(kvpRows)), f = function (v, n) { return isFinite(v) ? dpuFmt(v, n) : '—'; };
  var h = '<details class="issue kvp"' + (KVP.length ? ' open' : '') + '><summary>Проект: все системы здания — ' + KVP.length + ' шт. (расход и давление для подбора вентиляторов)</summary><div>' +
    '<div class="dpbtns"><button type="button" class="eibtn on" id="kvp-save">' + (KV.pid && kvpFind(KV.pid) ? 'Система в проекте — сохраняется сама' : 'Добавить эту систему в проект') + '</button>' +
    '<button type="button" class="eibtn" id="kvp-doc"' + (KVP.length ? '' : ' disabled') + '>Word: все системы проекта</button>' +
    '<button type="button" class="eibtn" id="kvp-clr"' + (KVP.length ? '' : ' disabled') + '>Очистить проект</button></div>';
  if (rows.length) h += '<div class="tscroll"><table class="vei kvpt"><thead><tr><th>Система</th><th>Назначение</th><th>Объект</th><th>L, м³/ч</th><th>P, Па</th><th>t, °C</th><th></th></tr></thead><tbody>' +
    rows.map(function (r) {
      return '<tr' + (r.id === KV.pid && !r.sub ? ' class="on"' : '') + '><td>' + esc(r.sys) + (r.bad ? ' <span class="kmsbad" title="Есть незаполненные данные">⚠</span>' : '') + '</td><td>' + r.kind + '</td><td>' + esc(r.obj) + '</td><td class="n">' + f(r.L, 0) + '</td><td class="n">' + f(r.P, 0) + '</td><td class="n">' + f(r.t, 0) + '</td><td>' +
        (r.sub ? '' : '<button type="button" class="eibtn" data-kvp-open="' + r.id + '">Открыть</button><button type="button" class="eibtn kmsx" data-kvp-del="' + r.id + '" title="Убрать из проекта">×</button>') + '</td></tr>';
    }).join('') + '</tbody></table></div><p class="tnote">L и P — подача и статическое давление вентилятора по расчёту системы; подбор вентилятора — по этим данным, решение принимает ГИП.</p>';
  else h += '<p class="tnote">Проект пуст. Заполни систему на вкладке и нажми «Добавить эту систему в проект» — так соберёшь все ДВ и ДП здания и выгрузишь их одним документом Word.</p>';
  return h + '</div></details>';
}
function kvpFind(id) { for (var i = 0; i < KVP.length; i++) if (KVP[i].id === id) return KVP[i]; return null; }
function kvpRedraw() { var b = $('#kvp'); if (b) b.innerHTML = kvpBlock(); }
var kvpT = 0;
function kvpAuto() { /* открытая из проекта система сохраняется при каждой правке */
  var s = KV.pid && kvpFind(KV.pid); if (!s) return;
  s.p = JSON.parse(JSON.stringify(KV.p)); s.mode = KV.mode;
  clearTimeout(kvpT); kvpT = setTimeout(function () { kvpSave(); kvpRedraw(); }, 400);
}

/* Word: сводка + все отчёты; схемы рисуются по очереди (картинки — асинхронно) */
function kvpDoc() {
  var list = KVP.slice(), parts = [], i = 0, f = function (v, n) { return isFinite(v) ? dpuFmt(v, n) : '—'; };
  var rows = [].concat.apply([], list.map(kvpRows));
  var head = '<div class="rep"><div class="rep-title">Расчёт систем противодымной вентиляции</div>' +
    '<p class="rep-p">Методика: СП 7.13130.2013 с Изм. № 1–3; «Расчётное определение основных параметров противодымной вентиляции зданий». Методические рекомендации к СП 7.13130.2013 (ФГБУ ВНИИПО МЧС России, 2013). Дата: ' + new Date().toLocaleDateString('ru-RU') + ' · «Справочник инженера ОВиК» v' + APP.ver + '.</p>' +
    '<h3 class="rep-h">Сводная таблица систем</h3>' + repT(['Система', 'Назначение', 'Объект', 'L, м³/ч', 'P, Па', 't, °C'], rows.map(function (r) { return [esc(r.sys), r.kind, esc(r.obj), f(r.L, 0), f(r.P, 0), f(r.t, 0)]; })) +
    (rows.some(function (r) { return r.bad; }) ? '<div class="rep-note"><b>Внимание:</b> в системах с пометкой в отчёте есть незаполненные данные (ξ, шероховатость) — давление занижено.</div>' : '') + '</div>';
  var next = function () {
    if (i >= rows.length) {
      var all = head + parts.join('');
      repDoc(all, 'Расчёт_ПДВ_все_системы'); return;
    }
    var r = rows[i++]; if (r.sub) return next();
    var rep = repSumWord(kvReport(r.p, r.o, r.mode)), brk = '<br clear="all" style="page-break-before:always">';
    var svg = window.pdv3d ? pdv3d(r.mode, r.p, r.o) : '';
    if (svg && window.pdv3dPng) pdv3dPng(svg, function (png) { parts.push(brk + rep.replace('<h3 class="rep-h">1.', (png ? '<p style="text-align:center"><img src="' + png + '" width="620"></p>' : '') + '<h3 class="rep-h">1.')); next(); });
    else { parts.push(brk + rep); next(); }
  };
  next();
}

document.addEventListener('click', function (e) {
  var t = e.target, op = t.closest && t.closest('[data-kvp-open]'), dl = t.closest && t.closest('[data-kvp-del]');
  if (t.id === 'kvp-save' && KV.p) {
    var s = KV.pid && kvpFind(KV.pid);
    if (!s) { KV.pid = 'S' + Date.now().toString(36); KVP.push({ id: KV.pid, mode: KV.mode, p: JSON.parse(JSON.stringify(KV.p)) }); }
    else { s.p = JSON.parse(JSON.stringify(KV.p)); s.mode = KV.mode; }
    kvpSave(); kvpRedraw(); return;
  }
  if (op) { var x = kvpFind(op.dataset.kvpOpen); if (!x) return; KV.mode = x.mode; KV.p = JSON.parse(JSON.stringify(x.p)); KV.pid = x.id; KV.file = ''; try { localStorage.setItem('klapany-kv-mode', KV.mode); } catch (y) {} show('pdv'); return; }
  if (dl) { KVP = KVP.filter(function (z) { return z.id !== dl.dataset.kvpDel; }); if (KV.pid === dl.dataset.kvpDel) KV.pid = null; kvpSave(); kvpRedraw(); return; }
  if (t.id === 'kvp-clr' && KVP.length && confirm('Убрать из проекта все ' + KVP.length + ' систем?')) { KVP = []; KV.pid = null; kvpSave(); kvpRedraw(); return; }
  if (t.id === 'kvp-doc' && KVP.length) kvpDoc();
});
