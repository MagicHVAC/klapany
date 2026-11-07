/* 1.25.0: эскиз трассы на сетке → сеть по участкам (инженер: «сетку, на которой примитивно накидать, как сеть будет идти, а потом это построится в схему 3D,
   с учётом размеров воздуховода, решёток, клапана»).
   Эскиз: точки (x, y — план, z — отметка, м), отрезки между ними (сечение, материал, доля расхода у начала ветви), значки на точках (клапан, решётка…).
   «Построить сеть»: каждый отрезок — участок; длина — по геометрии; в конце участка — отвод с углом поворота между отрезками
   (поворот в плане — W = a, по вертикали — W = b; ξ — таблица КМС инженера); в точке ветвления — тройник: «проход» продолжению, «ответвление» новой ветви
   (ξ тройника — вводит инженер, источник — справочник/паспорт); смена сечения — внезапное расширение/сужение (ξ по F0/F1 — таблица КМС).
   Поток — от первой точки (воздухозабор у ДП, вентилятор у выброса ДВ). Эскиз хранится в сети (net.sk) и сохраняется в файл .pdv. */
var SK = { key: null, cur: 0, sel: -1, scale: 1, z: 0 };
var SK_MARK = [['', 'нет'], ['louver', 'решётка наружная'], ['grille', 'решётка'], ['fdv', 'клапан противопожарный'], ['valve', 'клапан воздушный, обратный'], ['umbr', 'зонт, оголовок'], ['sil', 'шумоглушитель'], ['mesh', 'сетка'], ['inlet', 'вход в канал'], ['outlet', 'выход (выброс)']];
function skDef() { return { nodes: [{ x: 2, y: 2, z: 0 }], segs: [], marks: {}, a: 800, b: 500, rect: true, mat: 'galv' }; }
function skNet() { return KV.p && KV.p[SK.key]; }
function skGet() { var n = skNet(); if (!n.sk) n.sk = skDef(); return n.sk; }
function skLen(sk, s) { var a = sk.nodes[s.n0], b = sk.nodes[s.n1]; return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2) + Math.pow(b.z - a.z, 2)); }
function skDir(sk, s) { var a = sk.nodes[s.n0], b = sk.nodes[s.n1], L = skLen(sk, s) || 1; return [(b.x - a.x) / L, (b.y - a.y) / L, (b.z - a.z) / L]; }
function skSnapAng(t) { /* к ближайшему из углов таблицы КМС; < 7° — прямо */
  if (t < 7) return 0; var best = KMS_ANG[0]; KMS_ANG.forEach(function (a) { if (Math.abs(a - t) < Math.abs(best - t)) best = a; }); return best;
}
/* эскиз → участки сети */
function skBuild(sk) {
  var secs = [], idx = {}, inc = {}, outs = {};
  sk.segs.forEach(function (s, i) { inc[s.n1] = i; (outs[s.n0] = outs[s.n0] || []).push(i); });
  var order = []; /* обход от первой точки в глубину — родитель раньше ребёнка */
  (function walk(n) { (outs[n] || []).forEach(function (i) { order.push(i); walk(sk.segs[i].n1); }); })(0);
  order.forEach(function (i, k) { idx[i] = k; });
  order.forEach(function (i) {
    var s = sk.segs[i], par = inc[s.n0], els = [];
    var sib = outs[s.n0] || [];
    if (sib.length > 1) els.push({ t: sib[0] === i ? 'teeS' : 'teeB', n: 1, xi: '' }); /* первый — проход, остальные — ответвления */
    if (par != null) { var ps = sk.segs[par]; if (ps.rect !== s.rect || +ps.a !== +s.a || +ps.b !== +s.b) { var Fp = kmsArea(ps), Fs = kmsArea(s); els.push({ t: Fs > Fp ? 'suddE' : 'suddC', n: 1, xi: '' }); } }
    /* поворот в конце участка — к продолжению той же ветви (первому отрезку из конечной точки) */
    var nx = (outs[s.n1] || [])[0];
    if (nx != null) {
      var d1 = skDir(sk, s), d2 = skDir(sk, sk.segs[nx]), c = Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1] + d1[2] * d2[2])), t = Math.acos(c) * 180 / Math.PI, ang = skSnapAng(t);
      if (ang) { var vert = Math.abs(d1[2]) > 0.3 || Math.abs(d2[2]) > 0.3; els.push({ t: 'elb', ang: ang, side: vert ? 'b' : 'a', n: 1, xi: '' }); }
    }
    var mk = sk.marks[s.n1]; if (mk) els.push({ t: mk, n: 1, xi: '' });
    if (par == null) { var m0 = sk.marks[s.n0]; if (m0) els.unshift({ t: m0, n: 1, xi: '' }); }
    secs.push({ nm: 'Уч. ' + (secs.length + 1) + ' (эскиз)', mat: s.mat || 'galv', eps: '', rect: s.rect !== false, a: +s.a, b: +s.b, len: Math.round(skLen(sk, s) * 100) / 100,
      up: par == null ? 0 : idx[par] + 1, q: s.q == null || s.q === '' ? (par == null ? 100 : '') : +s.q, _set: !(s.q == null || s.q === ''), els: els });
  });
  /* доля расхода: не задана — как у родителя */
  secs.forEach(function (x) {
    if (x.q !== '') return;
    var pq = x.up ? secs[x.up - 1].q : 100, sib = secs.filter(function (y) { return y.up === x.up; }), set = sib.filter(function (y) { return y.q !== '' && y !== x && typeof y.q === 'number' && y._set; });
    var free = sib.filter(function (y) { return !y._set; }).length || 1;
    x.q = Math.max(0, Math.round((pq - set.reduce(function (a, y) { return a + y.q; }, 0)) / free * 10) / 10);
  });
  secs.forEach(function (x) { delete x._set; });
  return secs;
}

/* ---------- окно ---------- */
function skOpen(key) {
  SK.key = key; SK.sel = -1; var sk = skGet(); SK.cur = sk.nodes.length - 1;
  var d = $('#skdlg'); if (!d) { document.body.insertAdjacentHTML('beforeend', '<dialog id="skdlg" class="kmsdlg skdlg"><div id="sk"></div></dialog>'); d = $('#skdlg'); }
  skDraw(); d.showModal ? d.showModal() : d.setAttribute('open', '');
}
function skXY(n) { var s = 30 / SK.scale; return [30 + n.x * s, 410 - n.y * s]; }
function skSvg(sk) {
  var W = 660, H = 440, s = 30 / SK.scale, g = '';
  for (var x = 30; x <= W; x += 30) g += '<path d="M' + x + ' 20V' + 410 + '" class="skg"/>';
  for (var y = 410; y >= 20; y -= 30) g += '<path d="M30 ' + y + 'H' + W + '" class="skg"/>';
  g += '<text x="34" y="430" class="skt">клетка = ' + dpuFmt(SK.scale, SK.scale < 1 ? 1 : 0) + ' м; щелчок — точка от текущей (●), щелчок по точке — сделать текущей (ветвь от неё)</text>';
  sk.segs.forEach(function (sg, i) {
    var a = skXY(sk.nodes[sg.n0]), b = skXY(sk.nodes[sg.n1]), vert = a[0] === b[0] && a[1] === b[1];
    if (vert) g += '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="13" class="sks' + (i === SK.sel ? ' on' : '') + '" data-sks="' + i + '" fill="none"/><text x="' + (a[0] + 15) + '" y="' + (a[1] - 12) + '" class="skt">↕ ' + dpuFmt(sk.nodes[sg.n1].z - sk.nodes[sg.n0].z, 1) + ' м</text>';
    else g += '<path d="M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1] + '" class="sks' + (i === SK.sel ? ' on' : '') + '" data-sks="' + i + '"/>' +
      '<text x="' + ((a[0] + b[0]) / 2 + 4) + '" y="' + ((a[1] + b[1]) / 2 - 5) + '" class="skt">' + (i + 1) + ': ' + (sg.rect !== false ? sg.a + '×' + sg.b : '⌀' + sg.a) + ', ' + dpuFmt(skLen(sk, sg), 1) + ' м</text>';
  });
  sk.nodes.forEach(function (n, i) {
    var p = skXY(n), mk = sk.marks[i];
    g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === SK.cur ? 7 : 5) + '" class="skn' + (i === SK.cur ? ' cur' : '') + (i === 0 ? ' st' : '') + '" data-skn="' + i + '"/>' +
      (mk ? '<text x="' + (p[0] + 8) + '" y="' + (p[1] + 14) + '" class="skt skm">' + (SK_MARK.filter(function (m) { return m[0] === mk; })[0] || ['', mk])[1] + '</text>' : '') +
      (n.z ? '<text x="' + (p[0] - 8) + '" y="' + (p[1] + 16) + '" class="skt" text-anchor="end">' + dpuFmt(n.z, 1) + '</text>' : '');
  });
  return '<svg id="sksvg" viewBox="0 0 ' + W + ' ' + H + '" class="sksvg">' + '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent" data-skbg="1"/>' + g + '</svg>';
}
function skDraw() {
  var sk = skGet(), sg = SK.sel >= 0 ? sk.segs[SK.sel] : null, secs = skBuild(sk);
  var h = '<h3>Эскиз трассы — ' + (SK.key === 'netOut' ? 'от вентилятора до выброса' : SK.key === 'compNet' ? 'компенсация' : 'от воздухозабора до шахты') + '</h3>' +
    '<div class="skbar"><label>Клетка <select data-skc="scale">' + [[0.5, '0,5 м'], [1, '1 м'], [2, '2 м'], [5, '5 м']].map(function (o) { return '<option value="' + o[0] + '"' + (+o[0] === SK.scale ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
    '<label>Новый отрезок: <select data-skc="rect"><option value="1"' + (sk.rect !== false ? ' selected' : '') + '>прямоугольный</option><option value="0"' + (sk.rect === false ? ' selected' : '') + '>круглый</option></select></label>' +
    '<label>a/D, мм <input data-skc="a" type="number" value="' + sk.a + '"></label><label>b, мм <input data-skc="b" type="number" value="' + sk.b + '"></label>' +
    '<label>Материал <select data-skc="mat">' + kmsOpt(KMS_MAT, sk.mat) + '</select></label>' +
    '<label>↕ от текущей точки, м <input id="skdz" type="number" step="any" value="3"></label><button type="button" class="eibtn" id="sk-up">↕ подъём/опуск</button>' +
    '<label>На текущей точке <select data-skc="mark">' + kmsOpt(SK_MARK, sk.marks[SK.cur] || '') + '</select></label></div>' +
    '<div class="skwrap"><div class="skplan">' + skSvg(sk) + '</div><div class="sk3d" id="sk3d"></div></div>' +
    (sg ? '<div class="skbar"><b>Отрезок ' + (SK.sel + 1) + ':</b><label>форма <select data-sks-e="rect"><option value="1"' + (sg.rect !== false ? ' selected' : '') + '>прям.</option><option value="0"' + (sg.rect === false ? ' selected' : '') + '>кругл.</option></select></label>' +
      '<label>a/D <input data-sks-e="a" type="number" value="' + sg.a + '"></label><label>b <input data-sks-e="b" type="number" value="' + sg.b + '"></label>' +
      '<label>материал <select data-sks-e="mat">' + kmsOpt(KMS_MAT, sg.mat || 'galv') + '</select></label>' +
      '<label>доля расхода, % <input data-sks-e="q" type="number" value="' + (sg.q == null ? '' : sg.q) + '" placeholder="как у родителя"></label>' +
      '<button type="button" class="eibtn kmsx" id="sk-del" title="Удалить (только конец ветви)">× удалить</button></div>' : '') +
    '<p class="sub">Будет участков: ' + secs.length + (secs.length ? ' · длины ' + secs.map(function (x) { return dpuFmt(x.len, 1); }).join(' / ') + ' м · элементов КМС ' + secs.reduce(function (a, x) { return a + x.els.length; }, 0) : '') +
    '. Повороты, тройники и переходы ставятся сами; ξ отводов и переходов — из таблицы КМС, тройников и изделий — ввести в сети.</p>' +
    '<div class="dpbtns"><button type="button" class="eibtn on" id="sk-build"' + (secs.length ? '' : ' disabled') + '>Построить сеть по эскизу</button><button type="button" class="eibtn" id="sk-undo"' + (sk.segs.length ? '' : ' disabled') + '>Отменить последний</button><button type="button" class="eibtn" id="sk-clr">Очистить</button><button type="button" class="eibtn" id="sk-close">Закрыть</button></div>';
  $('#sk').innerHTML = h;
  clearTimeout(SK.t); SK.t = setTimeout(sk3d, 250);
}
/* 3D трассы — WebGL (three.js), сечения в масштабе */
function sk3d() {
  var box = $('#sk3d'); if (!box || !window.pdv3rLoad) return;
  pdv3rLoad(function (ok) {
    if (!ok) return; var sk = skGet();
    if (SK.R) { try { SK.R.dispose(); SK.R.forceContextLoss(); } catch (x) {} }
    var w = box.clientWidth || 300, h = box.clientHeight || 300, sc = new THREE.Scene(); sc.background = new THREE.Color(0xf3f5f8);
    sc.add(new THREE.HemisphereLight(0xffffff, 0xaab4bf, 0.9)); var dl = new THREE.DirectionalLight(0xffffff, 0.7); dl.position.set(-20, 40, 30); sc.add(dl);
    var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    sk.nodes.forEach(function (n) { [n.x, n.z, -n.y].forEach(function (v, i) { mn[i] = Math.min(mn[i], v); mx[i] = Math.max(mx[i], v); }); });
    var c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], span = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2], 4);
    sk.segs.forEach(function (s, i) {
      var a = sk.nodes[s.n0], b = sk.nodes[s.n1], A = new THREE.Vector3(a.x, a.z, -a.y), B = new THREE.Vector3(b.x, b.z, -b.y), L = A.distanceTo(B); if (!(L > 0)) return;
      var wa = (+s.a || 500) / 1000, wb = (s.rect !== false ? +s.b || 300 : +s.a || 500) / 1000;
      var geo = s.rect !== false ? new THREE.BoxGeometry(wa, wb, L) : new THREE.CylinderGeometry(wa / 2, wa / 2, L, 20).rotateX(Math.PI / 2);
      var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: i === SK.sel ? 0x2f8fe0 : 0x9aa7b4, metalness: 0.5, roughness: 0.35 }));
      m.position.copy(A).add(B).multiplyScalar(0.5); m.lookAt(B); if (Math.abs(B.y - A.y) > 0.99 * L) { m.lookAt(B.x + 1e-4, B.y, B.z); } sc.add(m);
    });
    sk.nodes.forEach(function (n, i) { if (!sk.marks[i] && i) return; var q = new THREE.Mesh(new THREE.SphereGeometry(0.18 + span * 0.01, 14, 10), new THREE.MeshStandardMaterial({ color: i === 0 ? 0x2fb67a : 0xd8432e })); q.position.set(n.x, n.z, -n.y); sc.add(q); });
    var cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 2000), R = span * 1.9 + 4, az = -0.7, el = 0.55;
    var Rn = new THREE.WebGLRenderer({ antialias: true }); SK.R = Rn; Rn.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); Rn.setSize(w, h);
    box.innerHTML = ''; box.appendChild(Rn.domElement); Rn.domElement.style.cssText = 'width:100%;height:100%;touch-action:none;cursor:grab;border-radius:10px';
    var draw = function () { cam.position.set(c[0] + R * Math.cos(el) * Math.sin(az), c[1] + R * Math.sin(el), c[2] + R * Math.cos(el) * Math.cos(az)); cam.lookAt(c[0], c[1], c[2]); Rn.render(sc, cam); }, drag = null;
    Rn.domElement.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY, az, el]; Rn.domElement.setPointerCapture(e.pointerId); });
    Rn.domElement.addEventListener('pointermove', function (e) { if (!drag) return; az = drag[2] - (e.clientX - drag[0]) * 0.01; el = Math.max(-1.2, Math.min(1.4, drag[3] + (e.clientY - drag[1]) * 0.008)); draw(); });
    Rn.domElement.addEventListener('pointerup', function () { drag = null; });
    draw();
  });
}
function skAdd(x, y, z) {
  var sk = skGet(), n0 = SK.cur; if (n0 == null || !sk.nodes[n0]) n0 = sk.nodes.length - 1;
  var a = sk.nodes[n0]; if (a.x === x && a.y === y && a.z === z) return;
  sk.nodes.push({ x: x, y: y, z: z }); var n1 = sk.nodes.length - 1;
  sk.segs.push({ n0: n0, n1: n1, a: sk.a, b: sk.b, rect: sk.rect !== false, mat: sk.mat });
  SK.cur = n1; SK.sel = -1; skDraw();
}
document.addEventListener('click', function (e) {
  var t = e.target; if (!t.closest) return;
  var sb = t.closest('[data-sketch]'); if (sb) { skOpen(sb.dataset.sketch); return; }
  if (!SK.key || !t.closest('#skdlg')) return;
  var sk = skGet(), nd = t.closest('[data-skn]'), sg = t.closest('[data-sks]');
  if (nd) { SK.cur = +nd.dataset.skn; SK.sel = -1; skDraw(); return; }
  if (sg) { SK.sel = +sg.dataset.sks; skDraw(); return; }
  if (t.dataset && t.dataset.skbg) {
    var svg = $('#sksvg'), r = svg.getBoundingClientRect(), k = 660 / r.width, px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k, s = 30 / SK.scale;
    var x = Math.round((px - 30) / 30) * SK.scale, y = Math.round((410 - py) / 30) * SK.scale; if (x < 0 || y < 0) return;
    skAdd(x, y, sk.nodes[SK.cur] ? sk.nodes[SK.cur].z : 0); return;
  }
  if (t.id === 'sk-up') { var a = sk.nodes[SK.cur], dz = smkNum($('#skdz').value); if (a && dz) skAdd(a.x, a.y, Math.round((a.z + dz) * 100) / 100); return; }
  if (t.id === 'sk-undo') { var last = sk.segs.pop(); if (last && last.n1 === sk.nodes.length - 1) { sk.nodes.pop(); delete sk.marks[last.n1]; } SK.cur = Math.min(SK.cur, sk.nodes.length - 1); SK.sel = -1; skDraw(); return; }
  if (t.id === 'sk-del' && SK.sel >= 0) {
    var s0 = sk.segs[SK.sel]; if (sk.segs.some(function (x) { return x.n0 === s0.n1; })) { alert('Удалить можно только конец ветви.'); return; }
    sk.segs.splice(SK.sel, 1); SK.sel = -1; skDraw(); return;
  }
  if (t.id === 'sk-clr') { if (!sk.segs.length || confirm('Очистить эскиз?')) { skNet().sk = skDef(); SK.cur = 0; SK.sel = -1; skDraw(); } return; }
  if (t.id === 'sk-close') { $('#skdlg').close(); if (SK.R) { try { SK.R.dispose(); SK.R.forceContextLoss(); } catch (x) {} SK.R = null; } SK.key = null; return; }
  if (t.id === 'sk-build') {
    var net = skNet(), secs = skBuild(sk); if (!secs.length) return;
    if (net.secs.length && !net.secs.every(function (x) { return /\(эскиз\)/.test(x.nm || ''); }) && !confirm('Заменить участки сети (' + net.secs.length + ' шт.) участками по эскизу (' + secs.length + ' шт.)?')) return;
    net.secs = secs; var key = SK.key; $('#skdlg').close(); if (SK.R) { try { SK.R.dispose(); SK.R.forceContextLoss(); } catch (x) {} SK.R = null; } SK.key = null;
    if (window.KMS_SEL) KMS_SEL[key] = []; kmsRedraw(key); kvCalc();
  }
});
document.addEventListener('input', function (e) {
  var t = e.target, d = t.dataset || {}; if (!SK.key) return;
  var sk = skGet();
  if (d.skc) {
    if (d.skc === 'scale') SK.scale = +t.value; else if (d.skc === 'rect') sk.rect = t.value === '1'; else if (d.skc === 'mat') sk.mat = t.value;
    else if (d.skc === 'mark') { if (t.value) sk.marks[SK.cur] = t.value; else delete sk.marks[SK.cur]; } else sk[d.skc] = smkNum(t.value);
    if (t.tagName === 'SELECT') skDraw(); return;
  }
  if (d.sksE && SK.sel >= 0) {
    var s = sk.segs[SK.sel], k = d.sksE; if (k === 'rect') s.rect = t.value === '1'; else if (k === 'mat') s.mat = t.value; else if (k === 'q') s.q = t.value === '' ? null : smkNum(t.value); else s[k] = smkNum(t.value);
    if (t.tagName === 'SELECT') skDraw(); else { clearTimeout(SK.t); SK.t = setTimeout(sk3d, 500); } /* число — без перерисовки окна, чтобы не терять фокус */
  }
});
