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
  function windy() {
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff';   /* цветные эмодзи берут прозрачность fillStyle */
    P.forEach(function (p) {
      p.x += p.vx * (0.6 + pw); p.y += p.vy + Math.sin(p.x / 60) * 1.2; p.rot += p.vr;
      if (p.x > W + 40) { p.x = -40; p.y = R() * H; }
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.font = Math.round(p.s * 1.3) + EMO; cx.fillText(p.e, 0, 0); cx.restore();
    });
  }
  function tornado(t) {
    var bx = W * 0.5 + Math.sin(t / 2500) * W * 0.25, top = -20, bot = H * 0.98;
    cx.fillStyle = 'rgba(30,34,44,.18)'; cx.fillRect(0, 0, W, H);
    for (var i = 0; i < 70; i++) {
      var h = i / 70, y = bot - h * (bot - top), rad = 14 + h * h * W * 0.22, a = t / 160 + i * 0.7;
      cx.fillStyle = 'rgba(130,138,150,' + (0.07 + 0.09 * (1 - h)) + ')';
      cx.beginPath(); cx.ellipse(bx + Math.sin(t / 900 + h * 3) * 30 * h, y, rad, rad * 0.22, 0, 0, TAU); cx.fill();
      cx.strokeStyle = 'rgba(190,195,205,.10)'; cx.beginPath(); cx.ellipse(bx, y, rad * (0.8 + 0.2 * Math.sin(a)), rad * 0.2, 0, a, a + 2); cx.stroke();
    }
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff';
    P.forEach(function (p) {
      p.a += 0.06 + (1 - p.h) * 0.06; p.h += 0.0025 + R() * 0.001; if (p.h > 1.05) { p.h = 0; p.a = R() * TAU; }
      var y = bot - p.h * (bot - top), rad = 14 + p.h * p.h * W * 0.22, x = bx + Math.cos(p.a) * rad, yy = y + Math.sin(p.a) * rad * 0.22, front = Math.sin(p.a) > 0;
      p.rot += p.vr * 2;
      cx.save(); cx.globalAlpha = front ? 1 : 0.6; cx.translate(x, yy); cx.rotate(p.rot); cx.font = Math.round(p.s * (front ? 1.6 : 1.1)) + EMO; cx.fillText(p.e, 0, 0); cx.restore();
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
      case 'wind': K.drawClouds(cx, C, W); windy(); break;
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
    else if (k === 'wind') { C = K.clouds(W, H, 8, true, 0.4); C.forEach(function (c) { c.v *= 4; }); debris(30, ['🍂', '🍃', '🍁', '🌿', '🪵']); }
    else if (k === 'tornado') debris(46, FLY);
    cv.style.zIndex = k === 'tornado' || k === 'wind' ? '60' : '0';
    cv.style.display = ''; raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cx) cx.clearRect(0, 0, W, H); if (cv) cv.style.display = 'none'; kind = ''; }
  window.WXFX = { play: play, stop: stop, kind: function () { return kind; } };
})();
