/* 1.36.0 Анимация погоды на всю страницу (инженер 08.11.2026): солнце / ночь, тучи, дождь, снег, гроза, туман, ветер с листьями,
   торнадо — летят листья, палки, люди, коровы. Canvas поверх страницы, клики проходят насквозь (pointer-events: none).
   1.36.1 «красиво, как настоящее»: небо — js/wx_sky.js (луна в настоящей фазе, звёзды, объёмные облака, туман);
   дождь — 3 слоя глубины и брызги; снег — 3 слоя с размытием; молния — ветвистая, со вспышкой неба.
   WXFX.play(kind, power 0..1, {day, lat}), WXFX.stop(). Вкладка скрыта — requestAnimationFrame сам встаёт. */
(function () {
  var cv = null, cx = null, W = 0, H = 0, raf = 0, kind = '', pw = 0.5, op = {}, P = [], C = [], S = [], F = [], SPL = [], flash = 0, bolt = null;
  var R = Math.random, TAU = Math.PI * 2, K = window.WXSKY;
  function size() { W = cv.width = innerWidth; H = cv.height = innerHeight; if (kind) play(kind, pw, op); }
  function mk() {
    if (cv) return;
    cv = document.createElement('canvas'); cv.id = 'wxfx';
    /* 1.36.2 (инженер: «облака за таблицей»): небо — слой 0, над фоном .cbg и под содержимым (z 1); торнадо и ветер — поверх (z 60) */
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:0';
    document.body.appendChild(cv); cx = cv.getContext('2d'); W = cv.width = innerWidth; H = cv.height = innerHeight;
    var tm = 0; addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(size, 200); });
  }
  /* ---------- осадки ---------- */
  function drops(n) { P = []; for (var i = 0; i < n; i++) { var z = R(); P.push({ x: R() * W, y: R() * H, z: z, v: 8 + z * 14, l: 8 + z * 22 }); } }
  function rain(wind) {
    for (var layer = 0; layer < 3; layer++) {
      cx.strokeStyle = 'rgba(185,205,240,' + [0.18, 0.32, 0.5][layer] + ')'; cx.lineWidth = [0.7, 1, 1.5][layer]; cx.beginPath();
      P.forEach(function (p) {
        if ((p.z * 3 | 0) !== layer) return;
        p.y += p.v; p.x += wind * (0.5 + p.z);
        if (p.y > H - 4) { if (p.z > 0.55 && SPL.length < 120) SPL.push({ x: p.x, y: H - 3 - R() * 30 * (1 - p.z), r: 1, l: 1 }); p.y = -p.l - R() * 60; p.x = R() * W * 1.1 - W * 0.05; }
        if (p.x > W + 20) p.x = -20;
        cx.moveTo(p.x, p.y); cx.lineTo(p.x - wind * (0.5 + p.z) * 1.4, p.y - p.l);
      });
      cx.stroke();
    }
    cx.strokeStyle = 'rgba(200,220,255,.35)'; cx.lineWidth = 1;   /* брызги */
    for (var i = SPL.length - 1; i >= 0; i--) { var s = SPL[i]; cx.globalAlpha = s.l; cx.beginPath(); cx.ellipse(s.x, s.y, s.r * 2.2, s.r * 0.6, 0, Math.PI, TAU); cx.stroke(); s.r += 0.5; s.l -= 0.08; if (s.l <= 0) SPL.splice(i, 1); }
    cx.globalAlpha = 1;
  }
  var flake = null;
  function flakes(n) {
    if (!flake) { flake = document.createElement('canvas'); flake.width = flake.height = 32; var x = flake.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); }
    P = []; for (var i = 0; i < n; i++) { var z = R(); P.push({ x: R() * W, y: R() * H, z: z, v: 0.4 + z * 1.6, r: 2 + z * z * 9, s: R() * TAU, w: 0.3 + R() * 0.9 }); }
    P.sort(function (a, b) { return a.z - b.z; });
  }
  function snow(t) {
    P.forEach(function (p) {
      p.y += p.v; p.x += Math.sin(t / 1100 * p.w + p.s) * (0.3 + p.z * 0.9) + pw * p.z;
      if (p.y > H + 10) { p.y = -10; p.x = R() * W; } if (p.x > W + 10) p.x = -10;
      cx.globalAlpha = 0.35 + p.z * 0.6; cx.drawImage(flake, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });
    cx.globalAlpha = 1;
  }
  /* ---------- молния ---------- */
  function branch(x, y, len, ang, depth, out) {
    var pts = [[x, y]];
    for (var i = 0; i < len; i++) { ang += (R() - 0.5) * 0.9; x += Math.sin(ang) * (14 + R() * 18); y += Math.cos(ang) * (14 + R() * 18); pts.push([x, y]); if (depth < 2 && R() < 0.12) branch(x, y, (len - i) * 0.5 | 0, ang + (R() < 0.5 ? -0.8 : 0.8), depth + 1, out); if (y > H * 0.92) break; }
    out.push({ p: pts, w: 3 - depth });
  }
  function lightning() {
    if (!bolt && R() < 0.004 + pw * 0.008) { var segs = []; branch(W * (0.1 + R() * 0.8), -10, 26 + (R() * 12 | 0), 0, 0, segs); bolt = { s: segs, life: 14, x: segs[segs.length - 1].p[0][0] }; flash = 1; }
    if (flash > 0) {
      var g = cx.createRadialGradient(bolt ? bolt.x : W / 2, 0, 0, bolt ? bolt.x : W / 2, 0, Math.max(W, H));
      g.addColorStop(0, 'rgba(225,232,255,' + flash * 0.45 + ')'); g.addColorStop(1, 'rgba(200,210,255,' + flash * 0.08 + ')');
      cx.fillStyle = g; cx.fillRect(0, 0, W, H); flash -= 0.07 + R() * 0.05; if (flash < 0.3 && flash > 0.2 && R() < 0.3) flash = 0.8;   /* повторная вспышка */
    }
    if (bolt) {
      var a = Math.min(1, bolt.life / 8);
      bolt.s.forEach(function (s) {
        cx.lineJoin = 'round';
        cx.strokeStyle = 'rgba(160,185,255,' + a * 0.25 + ')'; cx.lineWidth = s.w * 5; draw(s.p);   /* свечение */
        cx.strokeStyle = 'rgba(250,252,255,' + a + ')'; cx.lineWidth = s.w * 0.9; draw(s.p);       /* канал */
      });
      if (--bolt.life <= 0) bolt = null;
    }
  }
  function draw(p) { cx.beginPath(); p.forEach(function (q, i) { if (i) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); cx.stroke(); }
  /* ---------- ветер и торнадо ---------- */
  var FLY = ['🍂', '🍃', '🍁', '🌿', '🪵', '🧍', '🐄', '🍂', '🪵', '🐄', '🧍‍♂️', '🍃'];
  var EMO = 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif';
  function debris(n, list) { P = []; for (var i = 0; i < n; i++) P.push({ a: R() * TAU, h: R(), e: list[i % list.length], s: 18 + R() * 22, rot: R() * TAU, vr: (R() - 0.5) * 0.2, x: R() * W, y: R() * H, vx: 3 + R() * 6, vy: (R() - 0.5) * 2 }); }
  /* 1.36.3 (инженер: «детские рисунки»): листья и ветки — векторные, без эмодзи; лист кувыркается (сжатие по ширине = поворот в 3D) */
  var LEAF = [['#b5542a', '#6e2d14'], ['#c98a2e', '#7a4c12'], ['#9c3a1e', '#561c0c'], ['#c9a437', '#7d6118'], ['#7d8a35', '#434b19'], ['#8a4a2a', '#4a2412']];
  function leaf(p) {
    var s = p.s * 0.55, c = LEAF[p.c], g = cx.createLinearGradient(-s, 0, s, 0);
    g.addColorStop(0, c[0]); g.addColorStop(1, c[1]);
    cx.fillStyle = g; cx.beginPath(); cx.moveTo(-s, 0);
    cx.bezierCurveTo(-s * 0.4, -s * 0.62, s * 0.5, -s * 0.5, s, 0); cx.bezierCurveTo(s * 0.5, s * 0.5, -s * 0.4, s * 0.62, -s, 0); cx.fill();
    cx.strokeStyle = 'rgba(40,20,8,.45)'; cx.lineWidth = Math.max(0.6, s * 0.06); cx.beginPath(); cx.moveTo(-s * 1.25, 0); cx.lineTo(s * 0.9, 0);   /* черешок и жилка */
    for (var i = -2; i <= 2; i++) { if (!i) continue; var x0 = s * 0.25 * i; cx.moveTo(x0, 0); cx.lineTo(x0 + s * 0.28, (i % 2 ? -1 : 1) * s * 0.3); }
    cx.stroke();
  }
  function twig(p) {
    var s = p.s * 0.8; cx.strokeStyle = '#4b3524'; cx.lineCap = 'round'; cx.lineWidth = Math.max(1, s * 0.07);
    cx.beginPath(); cx.moveTo(-s, 0); cx.quadraticCurveTo(0, s * 0.08, s, -s * 0.05); cx.moveTo(-s * 0.1, s * 0.02); cx.lineTo(s * 0.35, -s * 0.35); cx.moveTo(s * 0.4, -s * 0.02); cx.lineTo(s * 0.7, s * 0.25); cx.stroke();
  }
  function blown(n) { P = []; for (var i = 0; i < n; i++) { var z = R(); P.push({ x: R() * W, y: R() * H, z: z, s: 10 + z * 26, c: (R() * LEAF.length) | 0, tw: R() < 0.15, rot: R() * TAU, vr: (R() - 0.5) * 0.12, fl: R() * TAU, vf: 0.05 + R() * 0.12, vx: 2 + z * 6, vy: (R() - 0.3) * 1.2 }); } P.sort(function (a, b) { return a.z - b.z; }); }
  var GUST = [];
  function windy(t) {
    if (GUST.length < 14 && R() < 0.2) GUST.push({ x: -W * 0.3, y: R() * H, l: W * (0.2 + R() * 0.35), a: 0.04 + R() * 0.07, v: 14 + R() * 12, k: R() * TAU });
    cx.lineCap = 'round';
    for (var i = GUST.length - 1; i >= 0; i--) {   /* струи ветра — тонкие изогнутые штрихи */
      var g = GUST[i]; g.x += g.v * (0.6 + pw);
      cx.strokeStyle = 'rgba(220,228,240,' + g.a + ')'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(g.x, g.y);
      cx.bezierCurveTo(g.x + g.l * 0.3, g.y - 10 * Math.sin(g.k), g.x + g.l * 0.7, g.y + 12 * Math.sin(g.k + 1), g.x + g.l, g.y); cx.stroke();
      if (g.x > W + 50) GUST.splice(i, 1);
    }
    P.forEach(function (p) {
      p.x += p.vx * (0.6 + pw); p.y += p.vy + Math.sin(t / 700 + p.fl) * 0.8; p.rot += p.vr; p.fl += p.vf;
      if (p.x > W + 40) { p.x = -40; p.y = R() * H; } if (p.y > H + 40) p.y = -40; if (p.y < -40) p.y = H + 40;
      cx.save(); cx.globalAlpha = 0.55 + p.z * 0.45; cx.translate(p.x, p.y); cx.rotate(p.rot); cx.scale(Math.max(0.12, Math.abs(Math.cos(p.fl))), 1);
      if (p.tw) twig(p); else leaf(p); cx.restore();
    });
    cx.globalAlpha = 1;
  }
  function tornado(t) {
    var bx = W * 0.5 + Math.sin(t / 2500) * W * 0.25, top = -20, bot = H * 0.98;
    cx.fillStyle = 'rgba(30,34,44,.18)'; cx.fillRect(0, 0, W, H);
    /* 1.36.3: воронка — сплошной пыльный столб с волнистыми краями и объёмом (без «колец»), вихрь пыли, облако у земли */
    var N = 40, L = [], Rr = [];
    for (var i = 0; i <= N; i++) {
      var h = i / N, y = bot - h * (bot - top), rad = 12 + h * h * W * 0.2, wob = Math.sin(t / 420 + h * 9) * (6 + 22 * h) + Math.sin(t / 900 + h * 3) * 30 * h;
      L.push([bx + wob - rad, y]); Rr.push([bx + wob + rad, y]);
    }
    var gx = cx.createLinearGradient(bx - W * 0.2, 0, bx + W * 0.2, 0);
    gx.addColorStop(0, 'rgba(70,74,84,.0)'); gx.addColorStop(0.3, 'rgba(110,116,128,.38)'); gx.addColorStop(0.5, 'rgba(150,156,168,.30)'); gx.addColorStop(0.7, 'rgba(90,95,106,.42)'); gx.addColorStop(1, 'rgba(60,64,74,.0)');
    cx.save(); cx.filter = 'blur(6px)'; cx.fillStyle = gx; cx.beginPath(); cx.moveTo(L[0][0], L[0][1]);
    L.forEach(function (q) { cx.lineTo(q[0], q[1]); }); for (var j = Rr.length - 1; j >= 0; j--) cx.lineTo(Rr[j][0], Rr[j][1]); cx.closePath(); cx.fill(); cx.restore();
    for (var d = 0; d < 160; d++) {   /* пыль вокруг столба — вращается */
      var q1 = Math.sin(d * 12.9898) * 43758.5453, q2 = Math.sin(d * 78.233) * 12543.21; q1 -= Math.floor(q1); q2 -= Math.floor(q2);   /* случайно, без «бус» */
      var hh = (q1 + t / (7000 + q2 * 6000)) % 1, yy = bot - hh * (bot - top) + (q2 - 0.5) * 30, rr = (12 + hh * hh * W * 0.2) * (0.7 + q2 * 0.6), aa = q2 * TAU * 7 + t / (120 + hh * 200);
      cx.fillStyle = 'rgba(160,160,160,' + (Math.sin(aa) > 0 ? 0.10 : 0.05) + ')'; cx.beginPath(); cx.arc(bx + Math.cos(aa) * rr * 1.05, yy + Math.sin(aa) * rr * 0.18, 2 + hh * 6, 0, TAU); cx.fill();
    }
    var gb = cx.createRadialGradient(bx, bot, 0, bx, bot, W * 0.14);   /* облако пыли у земли */
    gb.addColorStop(0, 'rgba(120,108,92,.45)'); gb.addColorStop(1, 'rgba(120,108,92,0)');
    cx.fillStyle = gb; cx.beginPath(); cx.ellipse(bx, bot, W * 0.14, W * 0.05, 0, 0, TAU); cx.fill();
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    P.forEach(function (p) {   /* 1.36.3: листья, ветки, доски — вектор; люди и коровы — тёмные силуэты в пыли (не цветные эмодзи) */
      p.a += 0.06 + (1 - p.h) * 0.06; p.h += 0.0025 + R() * 0.001; if (p.h > 1.05) { p.h = 0; p.a = R() * TAU; }
      var y = bot - p.h * (bot - top), rad = 14 + p.h * p.h * W * 0.22, x = bx + Math.cos(p.a) * rad, yy = y + Math.sin(p.a) * rad * 0.22, front = Math.sin(p.a) > 0;
      p.rot += p.vr * 2; p.fl = (p.fl || 0) + 0.15;
      cx.save(); cx.globalAlpha = front ? 0.95 : 0.5; cx.translate(x, yy); cx.rotate(p.rot); var sc = front ? 1.2 : 0.8; cx.scale(sc, sc);
      if (p.t === 'leaf') { cx.scale(Math.max(0.15, Math.abs(Math.cos(p.fl))), 1); leaf(p); }
      else if (p.t === 'twig') twig(p);
      else if (p.t === 'plank') { cx.fillStyle = '#5a4630'; cx.fillRect(-p.s, -p.s * 0.12, p.s * 2, p.s * 0.24); cx.strokeStyle = 'rgba(0,0,0,.35)'; cx.lineWidth = 1; cx.strokeRect(-p.s, -p.s * 0.12, p.s * 2, p.s * 0.24); }
      else { cx.filter = 'brightness(0.28) saturate(0.3)'; cx.fillStyle = '#fff'; cx.font = Math.round(p.s * 1.5) + EMO; cx.fillText(p.e, 0, 0); cx.filter = 'none'; }
      cx.restore();
    });
  }
  /* ---------- кадр ---------- */
  function sky(t) {   /* светило: днём солнце, ночью звёзды и луна */
    var X = W * 0.82, Y = Math.min(H * 0.16, 140), r = Math.max(20, Math.min(W, H) * 0.05);
    if (op.day) K.sun(cx, X, Y, r, W, H, t);
    else { K.drawStars(cx, S, W, H, t, 1); K.moon(cx, X, Y, r, op.lat || 50, t); }
  }
  function frame(t) {
    raf = requestAnimationFrame(frame); cx.clearRect(0, 0, W, H);
    switch (kind) {
      case 'sun': case 'night': sky(t); K.drawClouds(cx, C, W); break;
      case 'clouds': if (!op.day) K.drawStars(cx, S, W, H, t, 0.4); K.drawClouds(cx, C, W); break;
      case 'fog': K.drawClouds(cx, C, W); K.drawFog(cx, F, W, pw); break;
      case 'rain': K.drawClouds(cx, C, W); rain(1 + pw * 2); break;
      case 'snow': K.drawClouds(cx, C, W); snow(t); break;
      case 'storm': K.drawClouds(cx, C, W); lightning(); rain(3 + pw * 3); break;
      case 'wind': K.drawClouds(cx, C, W); windy(t); break;
      case 'tornado': tornado(t); break;
    }
  }
  function play(k, power, o) {
    if (!K) return;
    mk(); if (raf) cancelAnimationFrame(raf);
    kind = k; pw = Math.max(0, Math.min(1, power === undefined ? 0.5 : power)); op = o || {};
    if (k === 'sun') op.day = true; if (k === 'night') op.day = false;
    P = []; C = []; S = []; F = []; SPL = []; bolt = null; flash = 0;
    var dark = !op.day;
    if (k === 'sun' || k === 'night') { C = K.clouds(W, H, 3, dark, 0.5); C.forEach(function (c) { c.a *= dark ? 0.35 : 0.8; }); if (!op.day) S = K.stars(W, H, 260); }
    else if (k === 'clouds') { C = K.clouds(W, H, 14, dark, 0.55); if (!op.day) S = K.stars(W, H, 120); }
    else if (k === 'fog') { C = K.clouds(W, H, 6, true, 0.3); F = K.fog(W, H); }
    else if (k === 'rain') { C = K.clouds(W, H, 14, true, 0.35); drops(Math.round(160 + pw * 420)); }
    else if (k === 'snow') { C = K.clouds(W, H, 10, !op.day, 0.35); flakes(Math.round(110 + pw * 260)); }
    else if (k === 'storm') { C = K.clouds(W, H, 18, true, 0.45); drops(Math.round(380 + pw * 320)); }
    else if (k === 'wind') { C = K.clouds(W, H, 8, true, 0.4); C.forEach(function (c) { c.v *= 4; }); blown(Math.round(25 + pw * 35)); GUST = []; }
    else if (k === 'tornado') { debris(46, FLY); P.forEach(function (p, i) { p.t = p.e === '🐄' || p.e.indexOf('🧍') === 0 ? 'fig' : ['leaf', 'leaf', 'twig', 'plank'][i % 4]; p.c = (R() * LEAF.length) | 0; }); }
    cv.style.zIndex = k === 'tornado' ? '60' : '0';   /* 1.36.3: ветер тоже под текстом */
    cv.style.display = ''; raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cx) cx.clearRect(0, 0, W, H); if (cv) cv.style.display = 'none'; kind = ''; }
  window.WXFX = { play: play, stop: stop, kind: function () { return kind; } };
})();
