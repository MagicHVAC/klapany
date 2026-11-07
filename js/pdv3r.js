/* 1.24.0: качественная объёмная схема ПДВ — WebGL (three.js r149, js/vendor/three.min.js, лицензия MIT — js/vendor/LICENSE_three.txt).
   Инженер: «на другом листе качественное 3D отрендеренное». Свет, тени, сглаживание; в Word — PNG, на странице — вращение мышью или пальцем.
   Строго по расчёту: этажи, клапаны, скорости (цвет — пороги МР ВНИИПО п. 5.1.1, как на прежней схеме p3vcol), подача и давление вентилятора.
   three.js подгружается только когда нужен (раздел «Расчёт ПДВ» или выгрузка Word). Нет WebGL — остаётся прежняя SVG-схема. */
var P3R = { st: 0, q: [] };
function pdv3rLoad(cb) {
  if (window.THREE) return cb(true);
  P3R.q.push(cb); if (P3R.st) return; P3R.st = 1;
  var s = document.createElement('script'); s.src = 'js/vendor/three.min.js?v=' + APP.ver;
  s.onload = function () { P3R.q.splice(0).forEach(function (f) { f(true); }); };
  s.onerror = function () { P3R.st = 0; P3R.q.splice(0).forEach(function (f) { f(false); }); };
  document.head.appendChild(s);
}
function p3rCol(v) { return !(v > 0) ? 0x9aa3ad : v <= 9 ? 0x2fb67a : v <= 11 ? 0xe7c13a : v <= 15 ? 0xee8a2f : 0xd8432e; }
/* подпись — спрайт с текстом на холсте */
function p3rLabel(lines, opt) {
  opt = opt || {};
  var fs = opt.fs || 34, pad = 14, c = document.createElement('canvas'), g = c.getContext('2d');
  g.font = '600 ' + fs + 'px Arial'; var w = Math.max.apply(null, lines.map(function (l) { return g.measureText(l).width; })) + pad * 2, h = lines.length * fs * 1.25 + pad * 1.4;
  c.width = Math.ceil(w); c.height = Math.ceil(h); g = c.getContext('2d');
  g.fillStyle = opt.bg || 'rgba(255,255,255,.92)'; g.strokeStyle = opt.bd || '#333'; g.lineWidth = 3;
  g.beginPath(); if (g.roundRect) g.roundRect(1.5, 1.5, c.width - 3, c.height - 3, 12); else g.rect(1.5, 1.5, c.width - 3, c.height - 3); g.fill(); g.stroke();
  g.fillStyle = opt.fg || '#111'; g.textBaseline = 'top';
  lines.forEach(function (l, i) { g.font = (i === 0 ? '700 ' : '500 ') + fs + 'px Arial'; g.fillText(l, pad, pad * 0.7 + i * fs * 1.25); });
  var t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
  var k = (opt.size || 1) / 90; sp.scale.set(c.width * k, c.height * k, 1); sp.renderOrder = 10;
  return sp;
}
function p3rBox(sc, w, h, d, x, y, z, mat) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; sc.add(m); return m; }
function p3rMat(c, o) { o = o || {}; return new THREE.MeshStandardMaterial({ color: c, roughness: o.r == null ? 0.55 : o.r, metalness: o.m || 0.1, transparent: !!o.op, opacity: o.op || 1, emissive: o.e || 0, emissiveIntensity: o.ei || 0, depthWrite: !o.op }); }

/* сцена по расчёту; возвращает {scene, camera, target, R} */
function p3rScene(mode, p, o) {
  var sc = new THREE.Scene(); sc.background = new THREE.Color(0xf3f5f8);
  var N = o.rows.length, hf = mode === 'smk' ? (p.segs && p.segs[1] ? +p.segs[1].vL : 3) || 3 : +(p.hf || 3);
  var Hb = N * hf, BW = 22, BD = 13;
  /* земля, свет */
  var gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0xe4e8ee, roughness: 1 })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; sc.add(gr);
  sc.add(new THREE.HemisphereLight(0xffffff, 0xb8c2cc, 0.75));
  var sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(-30, Hb + 40, 35); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); var sh = sun.shadow.camera; sh.left = -40; sh.right = 40; sh.top = Hb + 20; sh.bottom = -20; sh.far = Hb + 150; sc.add(sun);
  /* перекрытия и стеклянный объём здания */
  var slab = p3rMat(0xdfe5ec, { r: 0.9, op: 0.38 }), glass = p3rMat(0xb9d3ea, { op: 0.08, r: 0.1 }), edge = new THREE.LineBasicMaterial({ color: 0x8a96a3 });
  for (var k = 0; k <= N; k++) { var sl = p3rBox(sc, BW, 0.12, BD, 0, k * hf, 0, k ? slab : p3rMat(0xc9d1da, { r: 0.9 })); sl.castShadow = false; sl.receiveShadow = !k;
    var eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BW, 0.12, BD)), edge); eg.position.copy(sl.position); sc.add(eg); }
  var gl = p3rBox(sc, BW, Hb, BD, 0, Hb / 2, 0, glass); gl.castShadow = false; gl.receiveShadow = false;
  var shX = BW / 2 - 2.2, shZ = BD / 2 - 1.8, labX = BW / 2 + 1.5;
  /* номера этажей */
  for (k = 0; k < N; k++) { var fl = p3rLabel([String(mode === 'tamb' ? o.rows[k].n : o.rows[k].i)], { fs: 30, size: N > 25 ? 1.1 : 1.6, bg: 'rgba(255,255,255,.8)', bd: '#999' }); fl.position.set(-BW / 2 - 1.6, k * hf + hf / 2, BD / 2); sc.add(fl); }
  var fanY = Hb + 1.4, txt = [];
  if (mode === 'smk') {
    /* шахта по участкам — цвет по скорости */
    o.rows.forEach(function (r, i) { p3rBox(sc, 1.1, hf, 1.1, shX, i * hf + hf / 2, shZ, p3rMat(p3rCol(r.ver && r.ver.v), { r: 0.35, m: 0.35 })); });
    /* клапаны и горизонталь этажа пожара */
    o.rows.forEach(function (r, i) {
      if (r.last) return;
      p3rBox(sc, 0.9, 0.55, 0.25, shX - 0.9, i * hf + hf * 0.75, shZ + 0.2, p3rMat(r.open ? 0xd8432e : 0x46505a, { m: 0.5, r: 0.4, e: r.open ? 0x661100 : 0, ei: r.open ? 0.6 : 0 }));
    });
    var y1 = hf * 0.75, hv = o.rows[0].hor && o.rows[0].hor.v;
    p3rBox(sc, BW * 0.55, 0.45, 0.6, shX - 1.3 - BW * 0.275, y1, shZ + 0.2, p3rMat(p3rCol(hv || o.vkl), { r: 0.35, m: 0.35 }));
    /* очаг и дым */
    [[2.4, 2.8, 0xff6a00, 1.4], [1.7, 2.3, 0xffa21a, 1.6], [0.9, 1.6, 0xffe066, 1.8]].forEach(function (f) {
      var c = new THREE.Mesh(new THREE.ConeGeometry(f[0], f[1], 24), new THREE.MeshStandardMaterial({ color: f[2], emissive: f[2], emissiveIntensity: f[3], roughness: 0.7, transparent: true, opacity: 0.9 }));
      c.position.set(-BW / 4, f[1] / 2 + 0.06, BD / 5); sc.add(c); });
    var fl2 = new THREE.PointLight(0xff7a2a, 2.2, 22); fl2.position.set(-BW / 4, 2, BD / 5); sc.add(fl2);
    /* дымовой слой под потолком этажа пожара — к открытому клапану */
    var smoke = new THREE.MeshStandardMaterial({ color: 0x3b4046, transparent: true, opacity: 0.6, depthWrite: false, roughness: 1 });
    var sx0 = -BW / 4, sx1 = shX - 1.2;
    for (var s = 0; s < 18; s++) { var u = s / 17, b = new THREE.Mesh(new THREE.SphereGeometry(1.15 + 0.3 * Math.sin(s * 1.7), 14, 10), smoke); b.scale.set(1.5, 0.5, 1.2); b.position.set(sx0 + (sx1 - sx0) * u, hf * 0.8, BD / 5 + (shZ + 0.2 - BD / 5) * u); sc.add(b); }
    txt.push([['Очаг пожара', 'дым ' + dpuFmt(o.G, 2) + ' кг/с'], -BW / 2 - 7, hf * 0.5 + 1, BD / 2 + 2]);
    txt.push([['Открытый клапан', 'v ' + dpuFmt(o.vkl, 1) + ' м/с'], shX - 4, y1 + 1.8, shZ + 3]);
    var top = o.rows[N - 1];
    txt.push([['Вентилятор ДВ', dpuFmt(o.Lv, 0) + ' м³/ч · ' + dpuFmt(o.Psv, 0) + ' Па', 't ' + dpuFmt(o.tFan, 0) + ' °C'], shX + 2, fanY + 5.5, shZ + 1]);
    txt.push([['Шахта у вентилятора', 'G ' + dpuFmt(top.G, 2) + ' кг/с · v ' + dpuFmt(top.ver.v, 1) + ' м/с'], labX + 7, Hb - hf / 2, shZ + 2]);
  } else {
    var vol = mode === 'stair' ? [6, 5] : mode === 'lift' ? [3, 3] : [1, 0.6];
    var cv = mode === 'stair' ? 0x7fb2e5 : mode === 'lift' ? 0x8fa6c4 : 0x5a9bd8;
    p3rBox(sc, vol[0], Hb, vol[1], shX - vol[0] / 2 + 0.6, Hb / 2, shZ + vol[1] / 2 - 0.6, p3rMat(cv, { op: mode === 'tamb' ? 0 : 0.45, r: 0.3 }));
    if (mode === 'tamb') o.rows.forEach(function (r, i) { p3rBox(sc, 0.9, hf, 0.6, shX, i * hf + hf / 2, shZ, p3rMat(p3rCol(r.v), { r: 0.35, m: 0.35 })); p3rBox(sc, 0.7, 0.5, 0.25, shX - 0.75, i * hf + hf * 0.7, shZ + 0.2, p3rMat(0x46505a, { m: 0.5 })); });
    /* воздух из шахты на этажах — стрелки-конусы, длина по перепаду на дверях */
    var dmax = Math.max.apply(null, o.rows.map(function (r) { return Math.abs(mode === 'tamb' ? r.dPk : r.dPd) || 0; })) || 1;
    o.rows.forEach(function (r, i) {
      var d = Math.abs(mode === 'tamb' ? r.dPk : r.dPd) || 0; if (!d) return;
      var a = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6 + 2.2 * d / dmax, 12), p3rMat(0x2f8fe0, { r: 0.4 })); a.rotation.z = Math.PI / 2; a.position.set(shX - vol[0] - 0.4 - (1.1 * d / dmax), i * hf + hf * 0.45, shZ + 0.4); sc.add(a);
    });
    p3rBox(sc, 0.9, fanY - Hb, 0.9, shX, Hb + (fanY - Hb) / 2, shZ, p3rMat(0x9aa3ad, { m: 0.4, r: 0.4 }));
    txt.push([['Вентилятор ДП', dpuFmt(o.Lv, 0) + ' м³/ч · ' + dpuFmt(o.Psv, 0) + ' Па', 'наружный ' + dpuFmt(p.air && p.air.ta, 0) + ' °C'], shX + 2, fanY + 5.5, shZ + 1]);
    var r0 = o.rows[0], rN = o.rows[N - 1];
    txt.push([[mode === 'stair' ? 'Лестничная клетка' : mode === 'lift' ? 'Лифтовая шахта' : 'Канал подпора', 'P внизу ' + dpuFmt(r0.P, 1) + ' Па', 'P вверху ' + dpuFmt(rN.P, 1) + ' Па'], labX + 7, Hb / 2, shZ + 2]);
  }
  /* вентилятор на кровле */
  var fan = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.4, 28), p3rMat(0x2a3138, { m: 0.6, r: 0.35 })); fan.position.set(shX, fanY, shZ); fan.castShadow = true; sc.add(fan);
  var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16), p3rMat(0xd0d6dc, { m: 0.7, r: 0.3 })); hub.position.copy(fan.position); sc.add(hub);
  /* тени — только от крупных предметов: тень шахты сквозь стеклянные этажи читалась как «призрак» */
  sc.traverse(function (m) { if (m.isMesh && m.geometry && m.geometry.parameters && m.geometry.parameters.height > 4) m.castShadow = false; });
  var R = Math.max(Hb * 2.45, 62), ls = 1.25 + R / 70;
  txt.forEach(function (t) { var l = p3rLabel(t[0], { size: ls }); l.position.set(t[1], t[2], t[3]); sc.add(l); });
  var cam = new THREE.PerspectiveCamera(32, 680 / 480, 0.5, 900), target = new THREE.Vector3(1.5, Hb * 0.5 + 1.5, 0);
  return { scene: sc, camera: cam, target: target, R: R, Hb: Hb };
}
function p3rPose(S, az, el) { var c = S.camera, t = S.target; c.position.set(t.x + S.R * Math.cos(el) * Math.sin(az), t.y + S.R * Math.sin(el), t.z + S.R * Math.cos(el) * Math.cos(az)); c.lookAt(t); }
/* PNG для Word: 1360×960, сглаживание, тени */
function pdv3rPng(mode, p, o, cb) {
  pdv3rLoad(function (ok) {
    if (!ok) return cb('');
    try {
      var S = p3rScene(mode, p, o), W = 1360, H = 960, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); R.setSize(W, H, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
      R.outputEncoding = THREE.sRGBEncoding; S.camera.aspect = W / H; S.camera.updateProjectionMatrix(); p3rPose(S, -0.72, 0.36);
      R.render(S.scene, S.camera); var url = cv.toDataURL('image/png'); R.dispose(); cb(url);
    } catch (x) { cb(''); }
  });
}
/* на странице: окно с вращением */
function pdv3rView(box, mode, p, o) {
  pdv3rLoad(function (ok) {
    if (!ok || !box) return;
    try {
      if (P3R.cur) { try { P3R.cur.dispose(); P3R.cur.forceContextLoss(); } catch (x) {} P3R.cur = null; } /* одно окно WebGL — у браузера лимит контекстов */
      var S = p3rScene(mode, p, o), w = box.clientWidth || 680, h = Math.round(w * 0.66);
      var R = new THREE.WebGLRenderer({ antialias: true }); P3R.cur = R; R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.setSize(w, h); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputEncoding = THREE.sRGBEncoding;
      S.camera.aspect = w / h; S.camera.updateProjectionMatrix();
      box.innerHTML = ''; box.appendChild(R.domElement); R.domElement.style.cssText = 'width:100%;height:auto;border-radius:12px;touch-action:none;cursor:grab';
      var az = -0.72, el = 0.36, drag = null, draw = function () { p3rPose(S, az, el); R.render(S.scene, S.camera); };
      R.domElement.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY, az, el]; R.domElement.setPointerCapture(e.pointerId); });
      R.domElement.addEventListener('pointermove', function (e) { if (!drag) return; az = drag[2] - (e.clientX - drag[0]) * 0.008; el = Math.max(0.05, Math.min(1.3, drag[3] + (e.clientY - drag[1]) * 0.006)); draw(); });
      R.domElement.addEventListener('pointerup', function () { drag = null; });
      R.domElement.addEventListener('wheel', function (e) { e.preventDefault(); S.R = Math.max(20, Math.min(400, S.R * (e.deltaY > 0 ? 1.1 : 0.9))); draw(); }, { passive: false });
      draw();
    } catch (x) {}
  });
}
