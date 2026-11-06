/* 1.23.3–1.23.4: сборка Σζ сети дымоудаления из элементов — окно КМС.
   Цели: поле формы («Сеть: типовой этаж», крайние участки) или выбранные строки таблицы участков — один, группа или все (как в КВМ).
   ξ — из таблицы КМС инженера (kvm_kms.js: kmsAuto) или своё число. У группы ξ считается по сечению КАЖДОГО участка отдельно
   (отвод прямоугольный зависит от H/W, расширение — от F0/F1). Внезапное расширение/сужение отнесены к скорости в меньшем сечении
   и пересчитываются к скорости участка: ξуч = ξ·(Fуч/Fмен)². Состав хранится рядом со значением (поле + 'Els') и выводится в отчёт.
   Массовая правка: значение одной графы — сразу всем выбранным участкам. */
var KMSZ_F = {
  'typ.hZ': ['Горизонтальный участок этажа', 'typ.hA', 'typ.hB'], 'typ.vZ': ['Вертикальный участок на этаж (шахта)', 'typ.vA', 'typ.vB'],
  'typ.z1': ['Вертикаль на этаже пожара', 'typ.vA', 'typ.vB'], 'typ.topZ': ['Верхний участок до вентилятора', 'typ.vA', 'typ.vB'],
  'typ.nodeZ': ['Узел присоединения клапана к шахте', 'typ.vA', 'typ.vB']
};
/* графы таблицы участков, которые собираются из элементов: [название, сторона a, сторона b] (м) */
var KMSZ_SEG = { hZ: ['горизонталь', 'hA', 'hB'], vZ: ['вертикаль', 'vA', 'vB'], nodeZ: ['узел присоединения', 'vA', 'vB'] };
var KMSZ_T = ['elb', 'knee', 'teeS', 'teeB', 'cross', 'conf', 'diff', 'suddE', 'suddC', 'node', 'grille', 'mesh', 'other'];
var KMSZ = { tg: null, els: [] };
KV.sel = KV.sel || [];

/* сечения цели: у поля — одно, у группы участков — каждого участка */
function kmszSecs(tg, p) {
  p = p || KV.p;
  var mk = function (a, b) { return { rect: true, a: Math.round(a * 1000), b: Math.round(b * 1000) }; };
  if (tg.path) { var f = KMSZ_F[tg.path]; return [mk(kvGet(p, f[1]), kvGet(p, f[2]))]; }
  var g = KMSZ_SEG[tg.col]; return tg.idx.map(function (i) { var s = p.segs[i]; return mk(s[g[1]], s[g[2]]); });
}
function kmszTitle(tg) {
  if (tg.path) return KMSZ_F[tg.path][0];
  var a = tg.idx.map(function (i) { return i + 1; });
  return 'Σζ, ' + KMSZ_SEG[tg.col][0] + ' — ' + (a.length === 1 ? 'участок ' + a[0] : a.length + ' участков: ' + kmszRange(a));
}
function kmszRange(a) {
  var out = [], st = a[0], pr = a[0];
  for (var i = 1; i <= a.length; i++) { if (a[i] === pr + 1) { pr = a[i]; continue; } out.push(st === pr ? String(st) : st + '–' + pr); st = pr = a[i]; }
  return out.join(', ');
}
/* Σζ одного сечения */
function kmszCalcS(s, els) {
  var F = kmsArea(s), sum = 0, rows = [];
  els.forEach(function (e) {
    var t = kmsT(e.t), n = +e.n > 0 ? +e.n : 1, x = e.xi === '' || e.xi == null ? NaN : +e.xi, au = null, why = 'введено инженером';
    if (!isFinite(x)) { au = kmsAuto(e, s, F, +e.F > 0 ? +e.F : 0); if (au) { x = au.xi; why = 'таблица КМС: ' + au.why; } }
    var k = au && au.Fv ? Math.pow(F / au.Fv, 2) : 1, xd = isFinite(x) ? x * k : NaN;
    if (isFinite(xd)) sum += xd * n;
    rows.push({ title: (e.nm || t[1]) + (t[2] ? ' ' + (e.ang || 90) + '°' : ''), x: x, k: k, xd: xd, n: n, why: why, au: au });
  });
  return { sum: sum, rows: rows, F: F, s: s, bad: rows.some(function (r) { return !isFinite(r.xd); }) };
}
function kmszBody() {
  var tg = KMSZ.tg, secs = kmszSecs(tg), s = secs[0], r = kmszCalcS(s, KMSZ.els), fm = function (v, n) { return isFinite(v) ? dpuFmt(v, n) : '—'; };
  var same = secs.every(function (x) { return x.a === s.a && x.b === s.b; });
  var sums = secs.map(function (x) { return kmszCalcS(x, KMSZ.els).sum; }), lo = Math.min.apply(null, sums), hi = Math.max.apply(null, sums);
  var h = '<h3>' + kmszTitle(tg) + '</h3><p class="sub">Сечение ' + (same ? s.a + '×' + s.b + ' мм' : 'у участков разное — ξ считается по сечению каждого участка отдельно') + '. ' +
    'Пустой ξ — из таблицы КМС: отвод R/D = 1 — по углу; прямоугольный — по H/W (W — сторона в плоскости поворота); расширение/сужение — по F0/F1 с пересчётом к скорости участка; узел — 4 варианта. ' +
    'Своё число — по паспорту изделия или справочнику (Идельчик; МР ВНИИПО п. 5.1).</p>' +
    '<div class="dpbtns kmszq">' + [['elb', 90, 'Отвод 90°'], ['elb', 45, 'Отвод 45°'], ['teeS', 0, 'Тройник — проход'], ['teeB', 0, 'Тройник — ответвление'], ['suddE', 0, 'Расширение'], ['suddC', 0, 'Сужение'], ['node', 0, 'Узел клапана']].map(function (q) {
      return '<button type="button" class="eibtn" data-kz-q="' + q[0] + '|' + q[1] + '">+ ' + q[2] + '</button>'; }).join('') + '</div>' +
    '<div class="tscroll"><table class="vei kmst"><thead><tr><th>Элемент</th><th>Угол, вариант</th><th>ξ</th><th>шт.</th><th>F соседн., м²</th><th>ξ к скорости участка' + (same ? '' : ' (1-го)') + '</th><th></th></tr></thead><tbody>' +
    KMSZ.els.map(function (e, i) {
      var t = kmsT(e.t), q = r.rows[i], au = q.au;
      return '<tr><td><select data-kz-e="' + i + '|t">' + kmsOpt(KMS_T.filter(function (x) { return KMSZ_T.indexOf(x[0]) >= 0; }), e.t) + '</select>' + (e.t === 'other' ? '<input data-kz-e="' + i + '|nm" type="text" placeholder="название" value="' + kmsNum(e.nm) + '">' : '') + '</td>' +
        '<td>' + (t[2] ? '<select data-kz-e="' + i + '|ang">' + kmsOpt(KMS_ANG.map(function (x) { return [x, x + '°']; }), e.ang || 90) + '</select>' + (e.t === 'elb' && s.a !== s.b ? '<select data-kz-e="' + i + '|side">' + kmsOpt([['a', 'поворот по a'], ['b', 'поворот по b']], e.side || 'a') + '</select>' : '') :
          e.t === 'node' ? '<select data-kz-e="' + i + '|var">' + kmsOpt([['', 'вариант…']].concat(KMS_NODE.map(function (x) { return [x[0], x[1] + ' — ' + String(x[2]).replace('.', ',')]; })), e.var || '') + '</select>' : '—') + '</td>' +
        '<td><input data-kz-e="' + i + '|xi" type="number" step="any" value="' + kmsNum(e.xi) + '" placeholder="' + (au ? dpuFmt(au.xi, 3) : 'ξ') + '"' + (!isFinite(q.xd) ? ' class="kmsneed"' : '') + ' title="' + esc(q.why) + '"></td>' +
        '<td><input data-kz-e="' + i + '|n" type="number" step="1" min="1" value="' + kmsNum(e.n || 1) + '"></td>' +
        '<td>' + (e.t === 'suddE' || e.t === 'suddC' ? '<input data-kz-e="' + i + '|F" type="number" step="any" value="' + kmsNum(e.F) + '" placeholder="задай">' : '—') + '</td>' +
        '<td class="n">' + fm(q.xd, 3) + (q.k !== 1 && isFinite(q.xd) ? ' <small>(×' + fm(q.k, 2) + ')</small>' : '') + '<small class="kmszwhy">' + esc(q.why) + '</small></td>' +
        '<td><button type="button" class="eibtn kmsx" data-kz-del="' + i + '">×</button></td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn" id="kmsz-add">+ элемент</button><b class="kmszsum">Σζ = ' + (same || lo === hi ? fm(r.sum, 3) : fm(lo, 3) + '…' + fm(hi, 3) + ' (по участкам)') + (r.bad ? ' — есть пустые ξ' : '') + '</b></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn on" id="kmsz-ok"' + (r.bad ? ' disabled' : '') + '>Применить' + (tg.idx && tg.idx.length > 1 ? ' к ' + tg.idx.length + ' участкам' : '') + '</button><button type="button" class="eibtn" id="kmsz-no">Отмена</button></div>';
  return h;
}
function kmszOpen(tg) {
  var d = $('#kmsdlg');
  if (!d) { document.body.insertAdjacentHTML('beforeend', '<dialog id="kmsdlg" class="kmsdlg"><div id="kmsz"></div></dialog>'); d = $('#kmsdlg'); }
  var col = tg.path || tg.col, first = tg.path ? kvGet(KV.p, tg.path + 'Els') : KV.p.segs[tg.idx[0]][tg.col + 'Els'];
  KMSZ.tg = tg;
  KMSZ.els = JSON.parse(JSON.stringify(first || (/nodeZ$/.test(col) ? [{ t: 'node', var: '', n: 1, xi: '' }] : [{ t: 'elb', ang: 90, n: 1, xi: '' }])));
  $('#kmsz').innerHTML = kmszBody(); d.showModal ? d.showModal() : d.setAttribute('open', '');
}
function kmszRedraw() { $('#kmsz').innerHTML = kmszBody(); }
function kmszApply() {
  var tg = KMSZ.tg, secs = kmszSecs(tg), els = KMSZ.els, rnd = function (v) { return Math.round(v * 1000) / 1000; };
  if (tg.path) {
    kvSet(KV.p, tg.path, rnd(kmszCalcS(secs[0], els).sum)); kvSet(KV.p, tg.path + 'Els', JSON.parse(JSON.stringify(els)));
    if (tg.path.indexOf('typ.') === 0 && KV.p.segMode !== 'table') KV.p.segs = kvBuildSegs(KV.p.typ);
  } else {
    tg.idx.forEach(function (i, j) { var s = KV.p.segs[i]; s[tg.col] = rnd(kmszCalcS(secs[j], els).sum); s[tg.col + 'Els'] = JSON.parse(JSON.stringify(els)); });
    KV.p.segMode = 'table';
  }
  kmszClose(); kmszReform();
}
function kmszClose() { var d = $('#kmsdlg'); if (d) d.close(); KMSZ.tg = null; }
function kmszReform() {
  var open = !!document.querySelector('.kvsegd[open]');
  $('#kv-form').innerHTML = kvForm(); if (window.hintsAttach) hintsAttach();
  if (open) { var d = document.querySelector('.kvsegd'); if (d) d.open = true; }
  kvCalc();
}

/* панель над таблицей участков: выбор, сборка Σζ, массовая правка */
function kmszSegBar() {
  var n = KV.sel.length, dis = n ? '' : ' disabled';
  return '<div class="kvbar"><span class="kvbarn">' + (n ? 'Выбрано: ' + n + ' (' + kmszRange(KV.sel.map(function (i) { return i + 1; })) + ')' : 'Отметь участки галками — один, несколько или все') + '</span>' +
    '<button type="button" class="eibtn" data-kvs="all">Все</button><button type="button" class="eibtn" data-kvs="mid">Кроме 1-го и верхнего</button><button type="button" class="eibtn" data-kvs="none">Снять</button>' +
    '<span class="kvbarg"><b>Собрать Σζ:</b><button type="button" class="eibtn on" data-kz-seg="hZ"' + dis + '>горизонтали</button><button type="button" class="eibtn on" data-kz-seg="vZ"' + dis + '>вертикали</button><button type="button" class="eibtn on" data-kz-seg="nodeZ"' + dis + '>узла</button></span>' +
    '<span class="kvbarg"><b>Задать всем выбранным:</b><select id="kvm-col">' + KV_SEGC.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + (/Σζ/.test(c[1]) ? (c[0] === 'hZ' ? ' гориз.' : ' верт.') : '') + '</option>'; }).join('') + '</select>' +
    '<input id="kvm-val" type="number" step="any" placeholder="значение"><button type="button" class="eibtn" id="kvm-set"' + dis + '>Применить</button></span></div>';
}
function kmszSegRedraw() { var b = $('#kv-segs'); if (b) b.innerHTML = kvSegs(); }

/* кнопка «+ собрать» у полей формы */
function kmszButtons() {
  Object.keys(KMSZ_F).forEach(function (k) {
    var inp = document.getElementById('kv-' + k.replace('.', '_')); if (!inp || inp.parentNode.querySelector('.kmszb')) return;
    var els = KV.p && kvGet(KV.p, k + 'Els');
    inp.insertAdjacentHTML('afterend', '<button type="button" class="eibtn kmszb" data-kz="' + k + '">' + (els && els.length ? 'состав: ' + els.length + ' эл. — изменить' : '+ собрать из элементов') + '</button>');
  });
}

/* отчёт: из чего собраны Σζ (поля и участки; одинаковые соседние участки — одной строкой) */
function kmszRep(p) {
  var rows = [], add = function (title, s, els) {
    var r = kmszCalcS(s, els);
    r.rows.forEach(function (q, j) { rows.push([j ? '' : title + ' (' + s.a + '×' + s.b + ')', esc(q.title) + (q.n > 1 ? ' × ' + q.n : ''), dpuFmt(q.x, 3), dpuFmt(q.xd * q.n, 3), esc(q.why)]); });
    rows.push(['', '<b>Σζ</b>', '', '<b>' + dpuFmt(r.sum, 3) + '</b>', '']);
  };
  Object.keys(KMSZ_F).forEach(function (k) { var els = kvGet(p, k + 'Els'); if (els && els.length) add(KMSZ_F[k][0], kmszSecs({ path: k }, p)[0], els); });
  if (p.segMode === 'table' && p.segs) Object.keys(KMSZ_SEG).forEach(function (c) {
    var g = KMSZ_SEG[c], i = 0;
    while (i < p.segs.length) {
      var s = p.segs[i], els = s[c + 'Els']; if (!els || !els.length) { i++; continue; }
      var key = JSON.stringify(els) + s[g[1]] + 'x' + s[g[2]], j = i;
      while (j + 1 < p.segs.length && p.segs[j + 1][c + 'Els'] && JSON.stringify(p.segs[j + 1][c + 'Els']) + p.segs[j + 1][g[1]] + 'x' + p.segs[j + 1][g[2]] === key) j++;
      add((i === j ? 'Участок ' + (i + 1) : 'Участки ' + (i + 1) + '–' + (j + 1)) + ', ' + g[0], { rect: true, a: Math.round(s[g[1]] * 1000), b: Math.round(s[g[2]] * 1000) }, els);
      i = j + 1;
    }
  });
  return rows.length ? '<p class="rep-p">Состав коэффициентов местного сопротивления (ξ расширения/сужения пересчитаны к скорости участка: ξ·(F<sub>уч</sub>/F<sub>мен</sub>)²):</p>' +
    repT(['Участок', 'Элемент', 'ξ', 'ξ·n к скорости участка', 'Источник'], rows) : '';
}

document.addEventListener('click', function (e) {
  var t = e.target, b = t.closest && t.closest('[data-kz]');
  if (b) { kmszOpen({ path: b.dataset.kz }); return; }
  var sg = t.closest && t.closest('[data-kz-seg]');
  if (sg && KV.sel.length) { kmszOpen({ col: sg.dataset.kzSeg, idx: KV.sel.slice().sort(function (a, c) { return a - c; }) }); return; }
  var sl = t.closest && t.closest('[data-kvs]');
  if (sl && KV.p) { var N = KV.p.segs.length, m = sl.dataset.kvs; KV.sel = []; for (var i = 0; i < N; i++) if (m === 'all' || (m === 'mid' && i > 0 && i < N - 1)) KV.sel.push(i); kmszSegRedraw(); return; }
  if (t.id === 'kvm-set' && KV.sel.length) {
    var col = $('#kvm-col').value, raw = $('#kvm-val').value; if (raw === '') return;
    var v = col === 'zkl' && raw.trim() === '' ? NaN : smkNum(raw);
    KV.sel.forEach(function (i) { var s = KV.p.segs[i]; s[col] = v; delete s[col + 'Els']; });
    KV.p.segMode = 'table'; kmszSegRedraw(); kvCalc(); return;
  }
  if (!KMSZ.tg || !t.closest || !t.closest('#kmsdlg')) return;
  var q = t.closest('[data-kz-q]');
  if (q) { var a = q.dataset.kzQ.split('|'), el = { t: a[0], n: 1, xi: '' }; if (+a[1]) el.ang = +a[1]; if (a[0] === 'node') el.var = ''; KMSZ.els.push(el); kmszRedraw(); return; }
  if (t.id === 'kmsz-add') { KMSZ.els.push({ t: 'elb', ang: 90, n: 1, xi: '' }); kmszRedraw(); return; }
  var dl = t.closest('[data-kz-del]'); if (dl) { KMSZ.els.splice(+dl.dataset.kzDel, 1); kmszRedraw(); return; }
  if (t.id === 'kmsz-no') { kmszClose(); return; }
  if (t.id === 'kmsz-ok') kmszApply();
});
document.addEventListener('change', function (e) {
  var t = e.target; if (!t.classList || !KV.p) return;
  if (t.classList.contains('kvsel')) { var i = +t.dataset.seg, k = KV.sel.indexOf(i); if (t.checked && k < 0) KV.sel.push(i); if (!t.checked && k >= 0) KV.sel.splice(k, 1); KV.sel.sort(function (a, c) { return a - c; }); kmszSegRedraw(); }
  else if (t.classList.contains('kvsel-all')) { KV.sel = []; if (t.checked) for (var j = 0; j < KV.p.segs.length; j++) KV.sel.push(j); kmszSegRedraw(); }
});
document.addEventListener('input', function (e) {
  var t = e.target, d = t.dataset && t.dataset.kzE; if (!d || !KMSZ.tg) return;
  var a = d.split('|'), el = KMSZ.els[+a[0]], k = a[1], v = t.value;
  if (k === 'xi' || k === 'F') el[k] = v === '' ? '' : smkNum(v);
  else if (k === 'n') el.n = Math.max(1, Math.round(smkNum(v)) || 1);
  else if (k === 'ang') el.ang = +v;
  else { el[k] = v; if (k === 't') { el.xi = ''; if (el.t !== 'other') delete el.nm; if (kmsT(el.t)[2] && !el.ang) el.ang = 90; } }
  var pos = t.selectionStart; kmszRedraw();
  if (t.tagName !== 'SELECT') { var n = document.querySelector('[data-kz-e="' + d + '"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } }
});
/* после каждой отрисовки формы — кнопки у полей; выбор сбрасывается, если участков стало меньше */
(function () {
  var old = window.kvCalc; if (!old) return;
  window.kvCalc = function () {
    if (KV.p && KV.p.segs) KV.sel = KV.sel.filter(function (i) { return i < KV.p.segs.length; });
    var r = old.apply(this, arguments); kmszButtons(); return r;
  };
})();
