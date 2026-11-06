/* 1.23.3: «+ собрать» у полей Σζ сети дымоудаления (типовой этаж, крайние участки) — окно сборки КМС из элементов.
   ξ — из таблицы КМС инженера (kvm_kms.js: kmsAuto) или своё число; внезапное расширение/сужение отнесены к скорости в меньшем сечении
   и пересчитываются к скорости участка: ξуч = ξ·(Fуч/Fмен)². Состав запоминается рядом с полем (путь + 'Els') и показывается в отчёте. */
var KMSZ_F = {
  'typ.hZ': ['Горизонтальный участок этажа', 'typ.hA', 'typ.hB'], 'typ.vZ': ['Вертикальный участок на этаж (шахта)', 'typ.vA', 'typ.vB'],
  'typ.z1': ['Вертикаль на этаже пожара', 'typ.vA', 'typ.vB'], 'typ.topZ': ['Верхний участок до вентилятора', 'typ.vA', 'typ.vB'],
  'typ.nodeZ': ['Узел присоединения клапана к шахте', 'typ.vA', 'typ.vB']
};
var KMSZ_T = ['elb', 'knee', 'teeS', 'teeB', 'cross', 'conf', 'diff', 'suddE', 'suddC', 'node', 'grille', 'mesh', 'other'];
var KMSZ = { path: null, els: [] };
function kmszSec(path) { var f = KMSZ_F[path], p = KV.p; return { rect: true, a: Math.round(kvGet(p, f[1]) * 1000), b: Math.round(kvGet(p, f[2]) * 1000) }; }
function kmszCalc(path, els) {
  var s = kmszSec(path), F = kmsArea(s), sum = 0, rows = [];
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
  var path = KMSZ.path, f = KMSZ_F[path], r = kmszCalc(path, KMSZ.els), s = r.s, fm = function (v, n) { return isFinite(v) ? dpuFmt(v, n) : '—'; };
  var h = '<h3>' + f[0] + ' — Σζ</h3><p class="sub">Сечение участка ' + s.a + '×' + s.b + ' мм (из полей формы). Пустой ξ — из таблицы КМС: отвод R/D = 1 — по углу; прямоугольный — по H/W (W — сторона в плоскости поворота); ' +
    'расширение/сужение — по F0/F1, пересчёт к скорости участка; узел — 4 варианта. Своё число — по паспорту изделия или справочнику (Идельчик, МР ВНИИПО п. 5.1).</p>' +
    '<div class="tscroll"><table class="vei kmst"><thead><tr><th>Элемент</th><th>Угол, вариант</th><th>ξ</th><th>шт.</th><th>F соседн., м²</th><th>ξ к скорости участка</th><th></th></tr></thead><tbody>' +
    KMSZ.els.map(function (e, i) {
      var t = kmsT(e.t), q = r.rows[i], au = q.au;
      return '<tr><td><select data-kz-e="' + i + '|t">' + kmsOpt(KMS_T.filter(function (x) { return KMSZ_T.indexOf(x[0]) >= 0; }), e.t) + '</select>' + (e.t === 'other' ? '<input data-kz-e="' + i + '|nm" type="text" placeholder="название" value="' + kmsNum(e.nm) + '">' : '') + '</td>' +
        '<td>' + (t[2] ? '<select data-kz-e="' + i + '|ang">' + kmsOpt(KMS_ANG.map(function (x) { return [x, x + '°']; }), e.ang || 90) + '</select>' + (e.t === 'elb' && s.a !== s.b ? '<select data-kz-e="' + i + '|side">' + kmsOpt([['a', 'поворот по a'], ['b', 'поворот по b']], e.side || 'a') + '</select>' : '') :
          e.t === 'node' ? '<select data-kz-e="' + i + '|var">' + kmsOpt([['', 'вариант…']].concat(KMS_NODE.map(function (x) { return [x[0], x[1] + ' — ' + String(x[2]).replace('.', ',')]; })), e.var || '') + '</select>' : '—') + '</td>' +
        '<td><input data-kz-e="' + i + '|xi" type="number" step="any" value="' + kmsNum(e.xi) + '" placeholder="' + (au ? dpuFmt(au.xi, 3) : 'ξ') + '"' + (!isFinite(q.xd) ? ' class="kmsneed"' : '') + ' title="' + esc(q.why) + '"></td>' +
        '<td><input data-kz-e="' + i + '|n" type="number" step="1" min="1" value="' + kmsNum(e.n || 1) + '"></td>' +
        '<td>' + (e.t === 'suddE' || e.t === 'suddC' ? '<input data-kz-e="' + i + '|F" type="number" step="any" value="' + kmsNum(e.F) + '" placeholder="задай">' : '—') + '</td>' +
        '<td class="n">' + fm(q.xd, 3) + (q.k !== 1 && isFinite(q.xd) ? ' <small>(×' + fm(q.k, 2) + ')</small>' : '') + '</td>' +
        '<td><button type="button" class="eibtn kmsx" data-kz-del="' + i + '">×</button></td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn" id="kmsz-add">+ элемент</button><b class="kmszsum">Σζ = ' + fm(r.sum, 3) + (r.bad ? ' — есть пустые ξ' : '') + '</b></div>' +
    '<div class="dpbtns"><button type="button" class="eibtn on" id="kmsz-ok"' + (r.bad ? ' disabled' : '') + '>Применить</button><button type="button" class="eibtn" id="kmsz-no">Отмена</button></div>';
  return h;
}
function kmszOpen(path) {
  var d = $('#kmsdlg');
  if (!d) { document.body.insertAdjacentHTML('beforeend', '<dialog id="kmsdlg" class="kmsdlg"><div id="kmsz"></div></dialog>'); d = $('#kmsdlg'); }
  KMSZ.path = path; KMSZ.els = JSON.parse(JSON.stringify(kvGet(KV.p, path + 'Els') || (path === 'typ.nodeZ' ? [{ t: 'node', var: '', n: 1, xi: '' }] : [{ t: 'elb', ang: 90, n: 1, xi: '' }])));
  $('#kmsz').innerHTML = kmszBody(); d.showModal ? d.showModal() : d.setAttribute('open', '');
}
function kmszRedraw() { $('#kmsz').innerHTML = kmszBody(); }
/* отчёт: из чего собраны Σζ */
function kmszRep(p) {
  var rows = [];
  Object.keys(KMSZ_F).forEach(function (k) {
    var els = kvGet(p, k + 'Els'); if (!els || !els.length) return;
    var save = KV.p; KV.p = p; var r = kmszCalc(k, els); KV.p = save;
    r.rows.forEach(function (q, j) { rows.push([j ? '' : KMSZ_F[k][0] + ' (' + r.s.a + '×' + r.s.b + ')', esc(q.title) + (q.n > 1 ? ' × ' + q.n : ''), dpuFmt(q.x, 3), dpuFmt(q.xd * q.n, 3), esc(q.why)]); });
    rows.push(['', '<b>Σζ</b>', '', '<b>' + dpuFmt(r.sum, 3) + '</b>', '']);
  });
  return rows.length ? '<p class="rep-p">Состав коэффициентов местного сопротивления участков (ξ расширения/сужения пересчитаны к скорости участка: ξ·(F<sub>уч</sub>/F<sub>мен</sub>)²):</p>' +
    repT(['Участок', 'Элемент', 'ξ', 'ξ к скорости участка', 'Источник'], rows) : '';
}
/* кнопка у поля — вставляется в разметку формы после отрисовки */
function kmszButtons() {
  Object.keys(KMSZ_F).forEach(function (k) {
    var inp = document.getElementById('kv-' + k.replace('.', '_')); if (!inp || inp.parentNode.querySelector('.kmszb')) return;
    var els = KV.p && kvGet(KV.p, k + 'Els');
    inp.insertAdjacentHTML('afterend', '<button type="button" class="eibtn kmszb" data-kz="' + k + '">' + (els && els.length ? 'состав: ' + els.length + ' эл. — изменить' : '+ собрать из элементов') + '</button>');
  });
}
document.addEventListener('click', function (e) {
  var t = e.target, b = t.closest && t.closest('[data-kz]');
  if (b) { kmszOpen(b.dataset.kz); return; }
  if (!KMSZ.path || !t.closest || !t.closest('#kmsdlg')) return;
  if (t.id === 'kmsz-add') { KMSZ.els.push({ t: 'elb', ang: 90, n: 1, xi: '' }); kmszRedraw(); return; }
  var dl = t.closest('[data-kz-del]'); if (dl) { KMSZ.els.splice(+dl.dataset.kzDel, 1); kmszRedraw(); return; }
  if (t.id === 'kmsz-no') { $('#kmsdlg').close(); KMSZ.path = null; return; }
  if (t.id === 'kmsz-ok') {
    var r = kmszCalc(KMSZ.path, KMSZ.els), path = KMSZ.path;
    kvSet(KV.p, path, Math.round(r.sum * 1000) / 1000); kvSet(KV.p, path + 'Els', KMSZ.els);
    if (path.indexOf('typ.') === 0 && KV.p.segMode !== 'table') KV.p.segs = kvBuildSegs(KV.p.typ);
    $('#kmsdlg').close(); KMSZ.path = null;
    $('#kv-form').innerHTML = kvForm(); if (window.hintsAttach) hintsAttach(); kmszButtons(); kvCalc();
  }
});
document.addEventListener('input', function (e) {
  var t = e.target, d = t.dataset && t.dataset.kzE; if (!d || !KMSZ.path) return;
  var a = d.split('|'), el = KMSZ.els[+a[0]], k = a[1], v = t.value;
  if (k === 'xi' || k === 'F') el[k] = v === '' ? '' : smkNum(v);
  else if (k === 'n') el.n = Math.max(1, Math.round(smkNum(v)) || 1);
  else if (k === 'ang') el.ang = +v;
  else { el[k] = v; if (k === 't') { el.xi = ''; if (el.t !== 'other') delete el.nm; } if (k !== 'nm') el.xi = el.xi; }
  if (t.tagName === 'SELECT' || k === 'xi' || k === 'n' || k === 'F') {
    var pos = t.selectionStart; kmszRedraw();
    if (t.tagName !== 'SELECT') { var n = document.querySelector('[data-kz-e="' + d + '"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } }
  }
});
/* после каждой отрисовки формы — кнопки у полей */
(function () {
  var old = window.kvCalc;
  if (!old) return;
  window.kvCalc = function () { var r = old.apply(this, arguments); kmszButtons(); return r; };
})();
