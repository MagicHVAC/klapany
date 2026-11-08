/* 1.36.0 Анимация погоды на всю страницу (инженер 08.11.2026): солнце / ночь, тучи, дождь, снег, гроза, туман, ветер с листьями,
   торнадо — летят листья, палки, люди, коровы. Canvas поверх страницы, клики проходят насквозь (pointer-events: none).
   WXFX.play(kind, power 0..1), WXFX.stop(). Вкладка скрыта — requestAnimationFrame сам встаёт. */
(function () {
  var cv = null, cx = null, W = 0, H = 0, raf = 0, kind = '', pw = 0.5, P = [], cl = [], t0 = 0, flash = 0, bolt = null;
  var R = Math.random;
  function size() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
  function mk() {
    if (cv) return;
    cv = document.createElement('canvas'); cv.id = 'wxfx';
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60';
    document.body.appendChild(cv); cx = cv.getContext('2d'); size();
    addEventListener('resize', size);
  }
  function drops(n, snow) {
    P = []; for (var i = 0; i < n; i++) P.push({ x: R() * W, y: R() * H, v: snow ? 0.6 + R() * 1.2 : 9 + R() * 8, r: snow ? 1.5 + R() * 2.5 : 0, s: R() * 6.28 });
  }
  function clouds(n, dark) {
    cl = []; for (var i = 0; i < n; i++) cl.push({ x: R() * W * 1.2 - W * 0.1, y: R() * H * 0.35, w: 160 + R() * 260, v: 0.15 + R() * 0.35, a: dark ? 0.35 + R() * 0.25 : 0.12 + R() * 0.12, d: dark });
  }
  var FLY = ['🍂', '🍃', '🍁', '🌿', '🪵', '🧍', '🐄', '🍂', '🪵', '🐄', '🧍‍♂️', '🍃'];
  function debris(n, list) {
    P = []; for (var i = 0; i < n; i++) P.push({ a: R() * 6.28, h: R(), r: 0, e: list[i % list.length], s: 18 + R() * 22, rot: R() * 6.28, vr: (R() - 0.5) * 0.2, x: R() * W, y: R() * H, vx: 3 + R() * 6, vy: (R() - 0.5) * 2 });
  }
  function cloudDraw() {
    cl.forEach(function (c) {
      c.x += c.v; if (c.x - c.w > W) c.x = -c.w;
      /* мягкий край: градиент круговой, сплющен масштабом — без резкой нижней кромки */
      var col = c.d ? '40,46,60' : '235,240,250';
      cx.save(); cx.translate(c.x, c.y); cx.scale(1, 0.45);
      var g = cx.createRadialGradient(0, 0, 0, 0, 0, c.w);
      g.addColorStop(0, 'rgba(' + col + ',' + c.a + ')'); g.addColorStop(0.6, 'rgba(' + col + ',' + c.a * 0.5 + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, c.w, 0, 6.28); cx.fill(); cx.restore();
    });
  }
  function rain(wind) {
    cx.strokeStyle = 'rgba(170,200,255,.45)'; cx.lineWidth = 1.2; cx.beginPath();
    P.forEach(function (p) { p.y += p.v; p.x += wind; if (p.y > H) { p.y = -20; p.x = R() * W; } if (p.x > W) p.x = 0; cx.moveTo(p.x, p.y); cx.lineTo(p.x - wind * 1.5, p.y - p.v * 1.6); });
    cx.stroke();
  }
  function snow(t) {
    cx.fillStyle = 'rgba(255,255,255,.85)';
    P.forEach(function (p) { p.y += p.v; p.x += Math.sin(t / 900 + p.s) * 0.6; if (p.y > H) { p.y = -5; p.x = R() * W; } cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.28); cx.fill(); });
  }
  function sun(t) {
    var x = W * 0.86, y = H * 0.12, r = Math.min(W, H) * 0.09;
    for (var i = 0; i < 12; i++) {   /* лучи */
      var a = i / 12 * 6.28 + t / 9000, l = r * (2.2 + 0.3 * Math.sin(t / 700 + i));
      cx.strokeStyle = 'rgba(255,210,110,.18)'; cx.lineWidth = 10; cx.beginPath(); cx.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2); cx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); cx.stroke();
    }
    var g = cx.createRadialGradient(x, y, 0, x, y, r * 2.4);
    g.addColorStop(0, 'rgba(255,236,160,.75)'); g.addColorStop(0.35, 'rgba(255,190,90,.25)'); g.addColorStop(1, 'rgba(255,170,60,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r * 2.4, 0, 6.28); cx.fill();
  }
  function night(t) {
    if (!P.length) for (var i = 0; i < 140; i++) P.push({ x: R() * W, y: R() * H * 0.7, r: R() * 1.4 + 0.3, s: R() * 6.28 });
    P.forEach(function (p) { cx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.35 * Math.sin(t / 600 + p.s)) + ')'; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.28); cx.fill(); });
    var x = W * 0.86, y = H * 0.12, r = Math.min(W, H) * 0.05;
    cx.fillStyle = 'rgba(240,240,255,.8)'; cx.beginPath(); cx.arc(x, y, r, 0, 6.28); cx.fill();
    cx.fillStyle = 'rgba(10,16,34,.9)'; cx.beginPath(); cx.arc(x + r * 0.45, y - r * 0.2, r * 0.9, 0, 6.28); cx.fill();
  }
  function fog(t) {
    for (var i = 0; i < 5; i++) {
      var y = H * (0.2 + i * 0.17) + Math.sin(t / 3000 + i) * 20;
      var g = cx.createLinearGradient(0, y - 80, 0, y + 80);
      g.addColorStop(0, 'rgba(210,215,225,0)'); g.addColorStop(0.5, 'rgba(210,215,225,' + (0.10 + pw * 0.12) + ')'); g.addColorStop(1, 'rgba(210,215,225,0)');
      cx.fillStyle = g; cx.fillRect(0, y - 80, W, 160);
    }
  }
  function lightning() {
    if (!bolt && R() < 0.006 + pw * 0.01) {
      bolt = { pts: [], life: 12 }; var x = W * (0.15 + R() * 0.7), y = 0;
      while (y < H * (0.5 + R() * 0.4)) { bolt.pts.push([x, y]); x += (R() - 0.5) * 70; y += 20 + R() * 40; }
      flash = 1;
    }
    if (flash > 0) { cx.fillStyle = 'rgba(220,230,255,' + flash * 0.35 + ')'; cx.fillRect(0, 0, W, H); flash -= 0.08; }
    if (bolt) {
      cx.strokeStyle = 'rgba(235,240,255,' + bolt.life / 12 + ')'; cx.lineWidth = 3; cx.shadowColor = '#bcd2ff'; cx.shadowBlur = 18;
      cx.beginPath(); bolt.pts.forEach(function (p, i) { if (i) cx.lineTo(p[0], p[1]); else cx.moveTo(p[0], p[1]); }); cx.stroke();
      cx.shadowBlur = 0; if (--bolt.life <= 0) bolt = null;
    }
  }
  function windy() {   /* сильный ветер: листья и палки летят слева направо */
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff';
    P.forEach(function (p) {
      p.x += p.vx * (0.6 + pw); p.y += p.vy + Math.sin(p.x / 60) * 1.2; p.rot += p.vr;
      if (p.x > W + 40) { p.x = -40; p.y = R() * H; }
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.font = Math.round(p.s * 1.3) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif'; cx.fillText(p.e, 0, 0); cx.restore();
    });
  }
  function tornado(t) {
    var bx = W * 0.5 + Math.sin(t / 2500) * W * 0.25, top = -20, bot = H * 0.98;
    cx.fillStyle = 'rgba(30,34,44,.18)'; cx.fillRect(0, 0, W, H);   /* сумрак — под воронкой и мусором */
    for (var i = 0; i < 70; i++) {   /* воронка: от узкой внизу к широкой вверху */
      var h = i / 70, y = bot - h * (bot - top), rad = 14 + h * h * W * 0.22, a = t / 160 + i * 0.7;
      cx.fillStyle = 'rgba(130,138,150,' + (0.07 + 0.09 * (1 - h)) + ')';
      cx.beginPath(); cx.ellipse(bx + Math.sin(t / 900 + h * 3) * 30 * h, y, rad, rad * 0.22, 0, 0, 6.28); cx.fill();
      cx.strokeStyle = 'rgba(190,195,205,.10)'; cx.beginPath(); cx.ellipse(bx, y, rad * (0.8 + 0.2 * Math.sin(a)), rad * 0.2, 0, a, a + 2); cx.stroke();
    }
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff';   /* цветные эмодзи берут прозрачность fillStyle — от воронки была 5–10 % */
    P.forEach(function (p) {   /* мусор по спирали вверх: листья, палки, люди, коровы */
      p.a += 0.06 + (1 - p.h) * 0.06; p.h += 0.0025 + R() * 0.001; if (p.h > 1.05) { p.h = 0; p.a = R() * 6.28; }
      var y = bot - p.h * (bot - top), rad = 14 + p.h * p.h * W * 0.22;
      var x = bx + Math.cos(p.a) * rad, yy = y + Math.sin(p.a) * rad * 0.22, front = Math.sin(p.a) > 0;
      p.rot += p.vr * 2;
      cx.save(); cx.globalAlpha = front ? 1 : 0.6; cx.translate(x, yy); cx.rotate(p.rot); cx.font = Math.round(p.s * (front ? 1.6 : 1.1)) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif'; cx.fillText(p.e, 0, 0); cx.restore();
    });
  }
  function frame(t) {
    raf = requestAnimationFrame(frame); cx.clearRect(0, 0, W, H);
    switch (kind) {
      case 'sun': sun(t); cloudDraw(); break;
      case 'night': night(t); cloudDraw(); break;
      case 'clouds': cloudDraw(); break;
      case 'fog': cloudDraw(); fog(t); break;
      case 'rain': cloudDraw(); rain(1 + pw * 2); break;
      case 'snow': cloudDraw(); snow(t); break;
      case 'storm': cloudDraw(); rain(3 + pw * 3); lightning(); break;
      case 'wind': cloudDraw(); windy(); break;
      case 'tornado': tornado(t); break;
    }
  }
  function play(k, power) {
    mk(); stop(); kind = k; pw = Math.max(0, Math.min(1, power || 0.5)); P = []; cl = []; bolt = null; flash = 0;
    if (k === 'sun') clouds(2, false);
    else if (k === 'night') clouds(2, true);
    else if (k === 'clouds') clouds(10, false);
    else if (k === 'fog') clouds(4, false);
    else if (k === 'rain') { clouds(8, true); drops(Math.round(120 + pw * 380), false); }
    else if (k === 'snow') { clouds(6, false); drops(Math.round(90 + pw * 260), true); }
    else if (k === 'storm') { clouds(12, true); drops(Math.round(350 + pw * 300), false); }
    else if (k === 'wind') { clouds(6, true); debris(30, ['🍂', '🍃', '🍁', '🌿', '🪵']); }
    else if (k === 'tornado') debris(46, FLY);
    cv.style.display = ''; raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cx) cx.clearRect(0, 0, W, H); if (cv) cv.style.display = 'none'; kind = ''; }
  window.WXFX = { play: play, stop: stop, kind: function () { return kind; } };
})();
