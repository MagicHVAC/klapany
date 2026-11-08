/* 1.36.1 Небо для анимации погоды (js/wx_fx.js): «красиво, как настоящее» (инженер 08.11.2026).
   Луна — в НАСТОЯЩЕЙ фазе на сегодня (синодический месяц 29,530589 сут от новолуния 06.01.2000 18:14 UTC), моря и кратеры,
   пепельный свет тёмной части; в южном полушарии — зеркально. Звёзды разных цветов, мерцают, иногда падающая звезда.
   Солнце — мягкое свечение и блики объектива. Облака — объёмные (клубы со светом сверху и тенью снизу), заранее отрисованы. */
(function () {
  var R = Math.random, TAU = Math.PI * 2;
  function off(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

  /* ---------- Луна ---------- */
  function phase(d) { var days = (d || new Date()).getTime() / 86400000 - 10962.7597; var p = (days / 29.530588853) % 1; return p < 0 ? p + 1 : p; }
  var MARIA = [[-0.28, -0.36, 0.22], [0.12, -0.33, 0.14], [0.25, -0.07, 0.17], [0.56, -0.25, 0.10], [0.45, 0.13, 0.12], [-0.1, 0.36, 0.13],
    [-0.5, -0.05, 0.30], [-0.42, 0.22, 0.16], [0.3, 0.26, 0.08], [-0.38, 0.34, 0.07], [0.02, -0.12, 0.08]];
  var moonTex = null, moonR = 0;
  function moonTexture(r) {
    if (moonTex && moonR === r) return moonTex;
    var c = off(2 * r, 2 * r), x = c.getContext('2d');
    var g = x.createRadialGradient(r * 0.85, r * 0.8, r * 0.1, r, r, r);
    g.addColorStop(0, '#f4f1e8'); g.addColorStop(0.75, '#d9d5ca'); g.addColorStop(1, '#a9a59b');   /* потемнение к краю диска */
    x.fillStyle = g; x.beginPath(); x.arc(r, r, r, 0, TAU); x.fill();
    x.save(); x.beginPath(); x.arc(r, r, r, 0, TAU); x.clip();
    MARIA.forEach(function (m) {   /* моря — тёмные пятна с мягким краем */
      var mx = r + m[0] * r, my = r + m[1] * r, mr = m[2] * r * 1.15;
      var q = x.createRadialGradient(mx, my, 0, mx, my, mr);
      q.addColorStop(0, 'rgba(120,118,112,.55)'); q.addColorStop(0.7, 'rgba(130,128,120,.35)'); q.addColorStop(1, 'rgba(140,138,130,0)');
      x.fillStyle = q; x.beginPath(); x.arc(mx, my, mr, 0, TAU); x.fill();
    });
    for (var i = 0; i < 70; i++) {   /* кратеры: светлый вал, тень внутри */
      var a = R() * TAU, d = Math.sqrt(R()) * r * 0.92, cr = r * (0.012 + R() * R() * 0.05), cxp = r + Math.cos(a) * d, cyp = r + Math.sin(a) * d;
      x.fillStyle = 'rgba(90,88,82,' + (0.10 + R() * 0.12) + ')'; x.beginPath(); x.arc(cxp + cr * 0.15, cyp + cr * 0.15, cr, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(255,255,250,.16)'; x.lineWidth = Math.max(0.6, cr * 0.25); x.beginPath(); x.arc(cxp, cyp, cr, Math.PI, Math.PI * 1.9); x.stroke();
    }
    var tx = r - 0.1 * r, ty = r + 0.62 * r;   /* Тихо — светлый кратер с лучами */
    for (var k = 0; k < 14; k++) { var aa = k / 14 * TAU + R() * 0.2; x.strokeStyle = 'rgba(255,255,250,.07)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + Math.cos(aa) * r * (0.3 + R() * 0.5), ty + Math.sin(aa) * r * (0.3 + R() * 0.5)); x.stroke(); }
    x.fillStyle = 'rgba(255,255,250,.5)'; x.beginPath(); x.arc(tx, ty, r * 0.025, 0, TAU); x.fill();
    for (var n = 0; n < 900; n++) { x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; x.fillRect(R() * 2 * r, R() * 2 * r, 1.5, 1.5); }   /* зерно реголита */
    x.restore(); moonTex = c; moonR = r; return c;
  }
  function moon(cx, X, Y, r, lat, t) {
    var p = phase(), c = Math.cos(TAU * p), wax = p < 0.5, tex = moonTexture(r);
    var halo = cx.createRadialGradient(X, Y, r * 0.9, X, Y, r * 5);   /* ореол — ярче к полнолунию */
    var k = (1 - c) / 2; halo.addColorStop(0, 'rgba(210,220,255,' + (0.10 + 0.22 * k) + ')'); halo.addColorStop(1, 'rgba(210,220,255,0)');
    cx.fillStyle = halo; cx.beginPath(); cx.arc(X, Y, r * 5, 0, TAU); cx.fill();
    cx.save(); cx.globalAlpha = 0.10; cx.drawImage(tex, X - r, Y - r); cx.restore();   /* пепельный свет тёмной части */
    cx.save(); cx.translate(X, Y); if (!wax !== (lat < 0)) cx.scale(-1, 1);
    cx.beginPath(); cx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    cx.ellipse(0, 0, Math.abs(c) * r, r, 0, Math.PI / 2, -Math.PI / 2, c > 0);   /* терминатор */
    cx.closePath(); cx.clip();
    if (!wax !== (lat < 0)) cx.scale(-1, 1);
    cx.drawImage(tex, -r, -r); cx.restore();
    return k;
  }

  /* ---------- Звёзды ---------- */
  var COLS = ['255,255,255', '207,224,255', '255,241,214', '255,217,176', '190,210,255'];
  function stars(W, H, n) { var a = []; for (var i = 0; i < n; i++) { var b = R(); a.push({ x: R() * W, y: Math.pow(R(), 1.3) * H * 0.85, r: 0.3 + b * b * 1.5, c: COLS[(R() * COLS.length) | 0], s: R() * TAU, f: 0.5 + R() * 2 }); } return a; }
  var shoot = null;
  function drawStars(cx, S, W, H, t, dim) {
    S.forEach(function (s) {
      var a = (0.45 + 0.4 * Math.sin(t / 1000 * s.f + s.s)) * dim;
      cx.fillStyle = 'rgba(' + s.c + ',' + a + ')'; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, TAU); cx.fill();
      if (s.r > 1.3) {   /* яркая — с лучиками */
        cx.strokeStyle = 'rgba(' + s.c + ',' + a * 0.35 + ')'; cx.lineWidth = 0.7; cx.beginPath();
        cx.moveTo(s.x - s.r * 4, s.y); cx.lineTo(s.x + s.r * 4, s.y); cx.moveTo(s.x, s.y - s.r * 4); cx.lineTo(s.x, s.y + s.r * 4); cx.stroke();
      }
    });
    if (!shoot && R() < 0.003) shoot = { x: R() * W * 0.8, y: R() * H * 0.35, vx: 9 + R() * 6, vy: 3 + R() * 3, l: 1 };
    if (shoot) {
      var g = cx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 12, shoot.y - shoot.vy * 12);
      g.addColorStop(0, 'rgba(255,255,255,' + shoot.l + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
      cx.strokeStyle = g; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(shoot.x, shoot.y); cx.lineTo(shoot.x - shoot.vx * 12, shoot.y - shoot.vy * 12); cx.stroke();
      shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.l -= 0.02; if (shoot.l <= 0) shoot = null;
    }
  }

  /* ---------- Солнце ---------- */
  function sun(cx, X, Y, r, W, H, t) {
    var pul = 1 + 0.03 * Math.sin(t / 1800);
    var g = cx.createRadialGradient(X, Y, 0, X, Y, r * 9 * pul);
    g.addColorStop(0, 'rgba(255,252,235,.95)'); g.addColorStop(0.06, 'rgba(255,240,190,.75)'); g.addColorStop(0.18, 'rgba(255,205,120,.25)');
    g.addColorStop(0.45, 'rgba(255,170,80,.08)'); g.addColorStop(1, 'rgba(255,160,60,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(X, Y, r * 9 * pul, 0, TAU); cx.fill();
    var dx = W / 2 - X, dy = H / 2 - Y;   /* блики объектива — по линии солнце → центр */
    [[0.35, 0.5, '255,220,150', 0.10], [0.6, 0.9, '160,200,255', 0.06], [0.85, 0.35, '255,180,220', 0.07], [1.25, 1.4, '170,255,210', 0.04]].forEach(function (f) {
      var fx = X + dx * f[0], fy = Y + dy * f[0], fr = r * f[1], q = cx.createRadialGradient(fx, fy, 0, fx, fy, fr);
      q.addColorStop(0, 'rgba(' + f[2] + ',' + f[3] + ')'); q.addColorStop(0.8, 'rgba(' + f[2] + ',' + f[3] * 0.6 + ')'); q.addColorStop(1, 'rgba(' + f[2] + ',0)');
      cx.fillStyle = q; cx.beginPath(); cx.arc(fx, fy, fr, 0, TAU); cx.fill();
    });
  }

  /* ---------- Облака ---------- */
  /* облако: 2 прохода — форма (много мелких клубов, мягкий край) и объём (свет сверху-слева, тень к дну); размытие и поля,
     чтобы края не обрезались и не было «колец» от отдельных кругов */
  function cloudSprite(w, dark) {
    var pad = w * 0.18, h = w * 0.6, W2 = w + 2 * pad, H2 = h + 2 * pad, base = pad + h * 0.8;
    var t = off(W2, H2), x = t.getContext('2d'), puffs = [], n = 22 + ((R() * 10) | 0);
    for (var i = 0; i < n; i++) {
      var u = R(), px = pad + w * (0.08 + u * 0.84), hump = Math.sin(u * Math.PI);
      var pr = w * (0.05 + 0.10 * hump * (0.6 + R() * 0.6)), py = base - pr * 0.4 - hump * h * (0.15 + R() * 0.45);
      puffs.push([px, py, pr]);
    }
    puffs.forEach(function (p) {   /* форма — белая маска с мягким краем */
      var g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], p[2]);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,.9)'); g.addColorStop(0.85, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(p[0], p[1], p[2], 0, TAU); x.fill();
    });
    x.globalCompositeOperation = 'source-atop';   /* объём: вертикальный свет + блики на верхушках клубов */
    var top = dark ? '96,102,118' : '255,255,255', mid = dark ? '62,67,80' : '226,232,242', bot = dark ? '30,33,42' : '160,170,190';
    var v = x.createLinearGradient(0, pad, 0, base);
    v.addColorStop(0, 'rgb(' + top + ')'); v.addColorStop(0.55, 'rgb(' + mid + ')'); v.addColorStop(1, 'rgb(' + bot + ')');
    x.fillStyle = v; x.fillRect(0, 0, W2, H2);
    puffs.forEach(function (p) {
      var g = x.createRadialGradient(p[0] - p[2] * 0.35, p[1] - p[2] * 0.45, 0, p[0] - p[2] * 0.35, p[1] - p[2] * 0.45, p[2] * 0.9);
      g.addColorStop(0, 'rgba(' + top + ',' + (dark ? 0.35 : 0.55) + ')'); g.addColorStop(1, 'rgba(' + top + ',0)');
      x.fillStyle = g; x.beginPath(); x.arc(p[0], p[1], p[2], 0, TAU); x.fill();
    });
    x.globalCompositeOperation = 'destination-out';   /* плоское мягкое дно */
    var f = x.createLinearGradient(0, base - h * 0.12, 0, base + pad * 0.3); f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = f; x.fillRect(0, base - h * 0.12, W2, H2);
    var c = off(W2, H2), y = c.getContext('2d');
    y.filter = 'blur(' + Math.max(1.5, w * 0.012) + 'px)'; y.drawImage(t, 0, 0);   /* где filter не поддержан — просто без размытия */
    return c;
  }
  function clouds(W, H, n, dark, cover) {
    var a = []; for (var i = 0; i < n; i++) { var z = R(), w = (180 + z * 320) * Math.max(0.6, W / 1400); a.push({ s: cloudSprite(w, dark), x: R() * (W + w) - w, y: Math.pow(R(), 1.5) * H * cover - w * 0.2, v: 0.08 + z * 0.35, a: dark ? 0.75 + z * 0.2 : 0.35 + z * 0.35 }); }
    return a.sort(function (p, q) { return p.v - q.v; });   /* дальние — медленнее и сзади */
  }
  function drawClouds(cx, C, W) { C.forEach(function (c) { c.x += c.v; if (c.x > W) c.x = -c.s.width; cx.globalAlpha = c.a; cx.drawImage(c.s, c.x, c.y); }); cx.globalAlpha = 1; }

  /* ---------- Туман ---------- */
  function fogSprite(w) { var c = off(w, w * 0.4), x = c.getContext('2d'); for (var i = 0; i < 18; i++) { var px = R() * w, py = c.height * (0.3 + R() * 0.4), r = w * (0.06 + R() * 0.12), g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(215,220,230,.30)'); g.addColorStop(1, 'rgba(215,220,230,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); } return c; }
  function fog(W, H) { var a = []; for (var i = 0; i < 7; i++) a.push({ s: fogSprite(W * 0.9), x: R() * W - W * 0.45, y: H * (0.05 + i * 0.14), v: 0.15 + R() * 0.3 }); return a; }
  function drawFog(cx, F, W, pw) { F.forEach(function (f) { f.x += f.v; if (f.x > W) f.x = -f.s.width; cx.globalAlpha = 0.5 + pw * 0.5; cx.drawImage(f.s, f.x, f.y); }); cx.globalAlpha = 1; }

  window.WXSKY = { phase: phase, moon: moon, stars: stars, drawStars: drawStars, sun: sun, clouds: clouds, drawClouds: drawClouds, fog: fog, drawFog: drawFog };
})();
