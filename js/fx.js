/* Фон на весь экран: «противопожарная преграда держит огонь».
   Снизу жар и искры, на 2/3 высоты — преграда EI 150: искры о неё гаснут голубыми брызгами.
   Режимы шапки: Работа — редкие искры; Пожар — шквал, преграда раскаляется; После — дым уходит через открытые ДД вверх.
   Экономно: до 160 частиц, пауза на скрытой вкладке, при «уменьшить движение» — один статичный кадр. */
(function () {
  var cv = document.createElement('canvas'), cx = cv.getContext('2d');
  if (!cx) return;
  cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var W, H, DPR, BY, P = [], S = [], heat = 0, hit = 0, mx = -1e4, my = -1e4, t0 = 0, run = true;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CFG = { n: { rate: .35, glow: .35 }, f: { rate: 2.6, glow: 1 }, a: { rate: 0, glow: .15 } };
  function mode() { return CFG[document.documentElement.dataset.mode] ? document.documentElement.dataset.mode : 'n'; }
  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = document.documentElement.clientWidth || innerWidth; H = innerHeight; BY = Math.round(H * .34);
    cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function ember() {
    return { k: 0, x: Math.random() * W, y: H + 10, vx: (Math.random() - .5) * .4, vy: -(0.6 + Math.random() * 1.6), r: .8 + Math.random() * 1.9, w: Math.random() * 6.28, life: 1 };
  }
  function smoke() {
    return { k: 1, x: Math.random() * W, y: H + 40, vx: (Math.random() - .5) * .3, vy: -(0.35 + Math.random() * .5), r: 30 + Math.random() * 50, w: Math.random() * 6.28, life: 1 };
  }
  function burst(x) {
    hit = Math.min(1, hit + .12);
    for (var i = 0; i < 5; i++) S.push({ x: x, y: BY, vx: (Math.random() - .5) * 3, vy: Math.random() * 1.8 + .3, life: 1 });
  }
  function step(dt) {
    var m = mode(), c = CFG[m];
    heat += (c.glow - heat) * .02;
    hit *= .96;
    var n = c.rate * dt;
    while (n > 0 && P.length < 160) { if (Math.random() < n) P.push(ember()); n -= 1; }
    if (m === 'a' && P.length < 40 && Math.random() < .08 * dt) P.push(smoke());
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i];
      p.w += .05 * dt;
      p.x += (p.vx + Math.sin(p.w) * .35) * dt; p.y += p.vy * dt;
      var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 9000) { var f = (9000 - d2) / 9000 * .9; p.x += dx / Math.sqrt(d2 + 1) * f * dt * 2; }
      if (p.k === 0) {
        p.life -= .0018 * dt;
        if (p.y <= BY) { burst(p.x); P.splice(i, 1); continue; }   /* преграда держит */
      } else { p.r += .15 * dt; p.life -= .0028 * dt; }
      if (p.life <= 0 || p.y < -100) P.splice(i, 1);
    }
    for (var j = S.length - 1; j >= 0; j--) {
      var s = S[j]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += .06 * dt; s.life -= .035 * dt;
      if (s.life <= 0) S.splice(j, 1);
    }
  }
  function draw(t) {
    cx.clearRect(0, 0, W, H);
    var m = mode();
    /* жар снизу, дрожит */
    var fl = .85 + Math.sin(t / 380) * .08 + Math.sin(t / 133) * .05;
    var g = cx.createLinearGradient(0, H, 0, H * .45);
    g.addColorStop(0, 'rgba(255,90,30,' + (.32 * heat * fl) + ')');
    g.addColorStop(.45, 'rgba(255,60,20,' + (.10 * heat * fl) + ')');
    g.addColorStop(1, 'rgba(255,60,20,0)');
    cx.fillStyle = g; cx.fillRect(0, H * .45, W, H * .55);
    /* языки у самого низа */
    cx.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 7; k++) {
      var fx = W * (k + .5) / 7 + Math.sin(t / 900 + k * 2) * 40, fh = H * (.12 + .06 * Math.sin(t / 260 + k * 1.7)) * (.4 + heat);
      var rg = cx.createRadialGradient(fx, H, 0, fx, H, fh);
      rg.addColorStop(0, 'rgba(255,140,50,' + (.22 * heat) + ')'); rg.addColorStop(1, 'rgba(255,60,20,0)');
      cx.fillStyle = rg; cx.beginPath(); cx.arc(fx, H, fh, Math.PI, 0); cx.fill();
    }
    /* искры */
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      if (p.k === 0) {
        var a = Math.max(0, p.life) * (.55 + .45 * Math.sin(p.w * 3));
        cx.fillStyle = 'rgba(255,' + (120 + (p.r * 40 | 0)) + ',60,' + a + ')';
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.28); cx.fill();
        cx.fillStyle = 'rgba(255,90,30,' + a * .18 + ')';
        cx.beginPath(); cx.arc(p.x, p.y, p.r * 4, 0, 6.28); cx.fill();
      }
    }
    for (var j = 0; j < S.length; j++) {
      var s = S[j]; cx.fillStyle = 'rgba(99,200,255,' + s.life * .8 + ')'; cx.fillRect(s.x, s.y, 1.6, 1.6);
    }
    cx.globalCompositeOperation = 'source-over';
    /* дым после пожара: уходит вверх сквозь открытые клапаны */
    for (var q = 0; q < P.length; q++) {
      var d = P[q];
      if (d.k !== 1) continue;
      var sg = cx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      sg.addColorStop(0, 'rgba(150,165,190,' + .10 * d.life + ')'); sg.addColorStop(1, 'rgba(150,165,190,0)');
      cx.fillStyle = sg; cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.28); cx.fill();
    }
    /* преграда: штрих-пунктир, раскаляется от ударов */
    var lit = Math.min(1, .25 + hit + (m === 'f' ? .25 : 0));
    var bg = cx.createLinearGradient(0, BY - 18, 0, BY + 18);
    bg.addColorStop(0, 'rgba(99,179,255,0)'); bg.addColorStop(.5, 'rgba(99,179,255,' + .10 * lit + ')'); bg.addColorStop(1, 'rgba(99,179,255,0)');
    cx.fillStyle = bg; cx.fillRect(0, BY - 18, W, 36);
    cx.strokeStyle = 'rgba(99,179,255,' + (.25 + .5 * lit) + ')'; cx.lineWidth = 1.5;
    cx.setLineDash(m === 'a' ? [6, 26] : [22, 6, 3, 6]);
    cx.lineDashOffset = -t / 60;
    cx.beginPath(); cx.moveTo(0, BY); cx.lineTo(W, BY); cx.stroke(); cx.setLineDash([]);
    cx.font = '600 10px "Golos Text", system-ui, sans-serif'; cx.textAlign = 'right';
    cx.fillStyle = 'rgba(99,179,255,' + (.25 + .35 * lit) + ')';
    cx.fillText(m === 'a' ? 'ДД открыты · дымоудаление' : 'ПРЕГРАДА EI 150 · НО закрыт', W - 10, BY - 6); cx.textAlign = 'left';
  }
  function loop(t) {
    if (!run) return;
    var dt = Math.min(3, t0 ? (t - t0) / 16.7 : 1); t0 = t;
    step(dt); draw(t);
    requestAnimationFrame(loop);
  }
  size();
  addEventListener('resize', size);
  addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  addEventListener('pointerleave', function () { mx = my = -1e4; });
  document.addEventListener('visibilitychange', function () { run = !document.hidden && !calm; if (run) { t0 = 0; requestAnimationFrame(loop); } });
  if (calm) { heat = .35; for (var i = 0; i < 60; i++) { var e = ember(); e.y = BY + Math.random() * (H - BY); P.push(e); } draw(0); }
  else requestAnimationFrame(loop);
})();
