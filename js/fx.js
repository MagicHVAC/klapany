/* Фон на весь экран: «противопожарная преграда держит огонь». Звук горящих дров — js/fx_snd.js (window.FXSND).
   1.37.0 «живое» (инженер 08.11.2026): пламя — тысяча мелких горячих частиц со своей температурой (бело-жёлтое у основания →
   оранжевое → красное → гаснет), поднимаются с ускорением в поле завихрений — языки складываются сами; дым рождается из
   верхушек пламени, подсвечен снизу; угли у основания мерцают; искры с хвостами.
   Режимы шапки: Работа — тлеет; Пожар — огонь до преграды, растекается под ней, дым копится слоем под преградой (как под
   потолком); После — тлеющие угли, дым уходит вверх через открытые ДД. Переходы плавные. Пауза на скрытой вкладке;
   «уменьшить движение» — статичный кадр. Искры о преграду гаснут голубыми брызгами; курсор отталкивает искры. */
(function () {
  var cv = document.createElement('canvas'), cx = cv.getContext('2d');
  if (!cx) return;
  cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var W, H, DPR, BY, F = [], E = [], S = [], D = [], I = .3, hit = 0, mx = -1e4, my = -1e4, t0 = 0, run = true, T = 0, SRC = [];
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TARGET = { n: .32, f: 1, a: .12 }, R = Math.random, TAU = Math.PI * 2;
  var SND = window.FXSND || { crack: function () {}, level: function () {} };
  function mode() { var m = document.documentElement.dataset.mode; return TARGET[m] !== undefined ? m : 'n'; }

  /* спрайты температуры пламени: от бело-жёлтого к тёмно-красному */
  function sprite(r, g, b, core) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    q.addColorStop(0, 'rgba(' + Math.min(255, r + core) + ',' + Math.min(255, g + core) + ',' + Math.min(255, b + core) + ',1)');
    q.addColorStop(.35, 'rgba(' + r + ',' + g + ',' + b + ',.55)'); q.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = q; x.fillRect(0, 0, 64, 64); return c;
  }
  var HEAT = [sprite(255, 236, 170, 30), sprite(255, 196, 90, 20), sprite(255, 140, 40, 10), sprite(236, 88, 24, 0), sprite(180, 44, 16, 0), sprite(110, 24, 10, 0)];
  var SP_SMOKE = (function () { var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'), q = x.createRadialGradient(64, 64, 0, 64, 64, 64); q.addColorStop(0, 'rgba(255,255,255,.5)'); q.addColorStop(.35, 'rgba(255,255,255,.32)'); q.addColorStop(.7, 'rgba(255,255,255,.1)'); q.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 128, 128); return c; })();
  var SP_BLUE = sprite(99, 190, 255, 60), SP_EMBER = sprite(255, 170, 60, 60);
  var FB = document.createElement('canvas'), fb = FB.getContext('2d');   /* буфер пламени (1/4 разрешения) */

  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = document.documentElement.clientWidth || innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    place();
    SRC = []; var n = Math.max(6, Math.round(W / 90));   /* очаги горения вдоль низа — разной силы, медленно меняются */
    for (var i = 0; i < n; i++) SRC.push({ x: (i + .5) / n * W + (R() - .5) * 60, k: .4 + R() * .6, ph: R() * TAU });
  }
  /* 1.27.6: преграда — сразу под пунктом «Главная» бокового меню; на телефоне — 34 % высоты */
  function place() {
    var a = document.querySelector('.nav a'), y = 0;
    if (a && getComputedStyle(a.parentNode).position !== 'fixed') { var r = a.getBoundingClientRect(); if (r.height) y = Math.round(r.bottom + 12); }
    BY = y > 40 && y < H * .6 ? y : Math.round(H * .34);
  }
  /* поле завихрений (дешёвый «шум»): горизонтальный снос зависит от высоты и времени — пламя рвётся на языки */
  function curl(x, y) { return Math.sin(y * .018 + T * .0021 + Math.sin(x * .011 + T * .0007) * 2) * .9 + Math.sin(y * .043 - T * .0035 + x * .02) * .5; }

  function flame() {
    var s = SRC[(R() * SRC.length) | 0], str = s.k * (.75 + .25 * Math.sin(T * .0009 + s.ph));
    return { x: s.x + (R() - .5) * 70, y: H + 6, vx: 0, vy: -(1.2 + R() * 1.6) * (.6 + 1.2 * I) * (.6 + str * .6), r: (7 + R() * 13) * (.7 + I * .6), life: 1, dec: .010 + R() * .010 };
  }
  function spark() { return { x: R() * W, y: H - R() * 40, px: 0, py: 0, vx: (R() - .5) * .8, vy: -(1.6 + R() * 2.8), w: R() * TAU, life: 1 }; }
  function puff(x, y, warm) { return { x: x, y: y, vx: (R() - .5) * .3, vy: -(0.35 + R() * .5), r: warm ? 26 + R() * 30 : 50 + R() * 60, life: 1, warm: warm }; }
  function burst(x) {
    hit = Math.min(1, hit + .08);
    for (var i = 0; i < 4; i++) S.push({ x: x, y: BY, vx: (R() - .5) * 3.2, vy: R() * 1.6 + .2, life: 1 });
    SND.crack(.5);
  }
  function spawn(rate, dt, list, make, cap) { var n = rate * dt; while (n > 0 && list.length < cap) { if (R() < n) list.push(make()); n -= 1; } }

  function step(dt) {
    var m = mode();
    T += 16.7 * dt;
    I += (TARGET[m] - I) * .012 * dt;
    hit *= Math.pow(.95, dt);
    spawn(W / 1400 * (6 + 34 * I), dt, F, flame, 1400);
    spawn(.12 + 1.4 * I * I, dt, E, spark, 110);
    var reach = BY + (H - BY) * (1 - I);   /* до какой высоты доходит пламя */
    for (var i = F.length - 1; i >= 0; i--) {
      var p = F[i];
      p.vx += curl(p.x, p.y) * .06 * dt; p.vx *= Math.pow(.93, dt);
      p.vy -= .02 * dt * (.5 + I);   /* плавучесть: горячее ускоряется вверх */
      if (p.y < BY + 20) { p.vy *= Math.pow(.86, dt); p.vx += (p.x > W / 2 ? .05 : -.05) * dt; hit = Math.min(1, hit + .0006 * dt); }   /* растекается под преградой */
      p.x += p.vx * dt; p.y += p.vy * dt;
      var over = Math.max(0, (H - p.y) / Math.max(1, H - reach) - .8);
      p.life -= p.dec * dt * (1 + over * 5);
      if (p.life <= 0) { if (R() < .06 + .1 * I) D.push(puff(p.x, p.y, true)); F.splice(i, 1); }   /* верхушка пламени → дым */
    }
    for (var j = E.length - 1; j >= 0; j--) {
      var e = E[j]; e.px = e.x; e.py = e.y;
      e.w += .08 * dt; e.vx += curl(e.x, e.y) * .03 * dt; e.x += (e.vx + Math.sin(e.w) * .4) * dt; e.y += e.vy * dt; e.vy *= Math.pow(.997, dt);
      var dx = e.x - mx, dy = e.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 12000) e.x += dx / Math.sqrt(d2 + 1) * (12000 - d2) / 12000 * 2.2 * dt;
      e.life -= .0018 * dt;
      if (e.y <= BY) { burst(e.x); E.splice(j, 1); continue; }   /* преграда держит */
      if (e.life <= 0) E.splice(j, 1);
    }
    for (var k = S.length - 1; k >= 0; k--) { var s = S[k]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += .06 * dt; s.life -= .03 * dt; if (s.life <= 0) S.splice(k, 1); }
    if (m === 'a') spawn(.35, dt, D, function () { return puff(R() * W, H - 10, false); }, 160);   /* После: дым от углей */
    for (var q = D.length - 1; q >= 0; q--) {
      var d = D[q];
      d.vx += curl(d.x, d.y) * .02 * dt; d.vx *= Math.pow(.97, dt);
      if (m !== 'a' && d.y < BY + d.r * .4) { d.vy *= Math.pow(.9, dt); d.vx += (R() - .5) * .08 * dt; d.life -= .0008 * dt; }   /* слой дыма под преградой */
      d.x += d.vx * dt; d.y += d.vy * dt; d.r += .18 * dt; d.life -= .0024 * dt;
      if (d.life <= 0 || d.y < -150 || D.length > 220) D.splice(q, 1);
    }
    SND.level(I, m);
  }
  function blit(img, x, y, r, a, k) { if (a <= 0) return; k = k || 1; cx.globalAlpha = Math.min(1, a); cx.drawImage(img, x - r / k, y - r * k, r * 2 / k, r * 2 * k); }

  function draw(t) {
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    cx.clearRect(0, 0, W, H);
    var m = mode();
    var fl = .85 + Math.sin(t / 530) * .08 + Math.sin(t / 170) * .05 + (R() - .5) * .04;   /* мерцание жара */
    var g = cx.createLinearGradient(0, H, 0, BY);
    g.addColorStop(0, 'rgba(255,90,30,' + (.30 * I * fl) + ')'); g.addColorStop(.45, 'rgba(190,45,15,' + (.10 * I * fl) + ')'); g.addColorStop(1, 'rgba(160,30,10,0)');
    cx.fillStyle = g; cx.fillRect(0, BY, W, H - BY);
    /* угли: тлеющая полоса у низа, пятна разгораются и гаснут */
    for (var u = 0; u < SRC.length; u++) {
      var s = SRC[u], gl = (.35 + .65 * (.5 + .5 * Math.sin(t / (600 + u * 37) + s.ph))) * (.35 + .65 * Math.max(I, m === 'a' ? .5 : 0));
      var eg = cx.createRadialGradient(s.x, H + 6, 0, s.x, H + 6, 70 + 50 * s.k);
      eg.addColorStop(0, 'rgba(255,120,40,' + .55 * gl + ')'); eg.addColorStop(.5, 'rgba(200,50,15,' + .25 * gl + ')'); eg.addColorStop(1, 'rgba(120,20,8,0)');
      cx.fillStyle = eg; cx.beginPath(); cx.ellipse(s.x, H + 6, 70 + 50 * s.k, 26 + 14 * s.k, 0, 0, TAU); cx.fill();
    }
    /* дым — обычным смешением, подсвечен снизу огнём */
    for (var q = 0; q < D.length; q++) {
      var d = D[q], hy = Math.max(0, Math.min(1, (d.y - BY) / Math.max(1, H - BY)));
      var c = d.warm ? 'rgb(' + (10 * Math.round((90 + 60 * hy * I) / 10)) + ',' + (10 * Math.round((84 + 22 * hy * I) / 10)) + ',' + (10 * Math.round((86 + 8 * hy) / 10)) + ')' : 'rgb(120,124,134)';   /* шаг 10 — кэш оттенков мал */
      cx.save(); cx.globalAlpha = Math.min(1, d.life) * (d.warm ? .26 : .18); cx.fillStyle = c; cx.globalCompositeOperation = 'source-over';
      cx.translate(d.x, d.y); var k = d.r / 64; cx.scale(k, k * .85);
      cx.drawImage(tint(c), -64, -64); cx.restore();
    }
    /* пламя рисуется в буфер в 4 раза меньше и растягивается на экран: частицы сливаются в сплошные языки */
    var fw = Math.ceil(W / 4), fh = Math.ceil(H / 4);
    if (FB.width !== fw || FB.height !== fh) { FB.width = fw; FB.height = fh; }
    fb.globalCompositeOperation = 'source-over'; fb.clearRect(0, 0, fw, fh); fb.globalCompositeOperation = 'lighter';
    for (var i = 0; i < F.length; i++) {   /* температура по возрасту частицы */
      var p = F[i], l = p.life, idx = Math.min(5, Math.floor((1 - l) * 6.2)), rr = p.r * (.5 + l * .8) / 4, kk = 1.6;
      fb.globalAlpha = Math.min(1, (.16 + .16 * I) * (0.35 + l)); fb.drawImage(HEAT[idx], p.x / 4 - rr / kk, p.y / 4 - rr * kk, rr * 2 / kk, rr * 2 * kk);
    }
    cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = 1; cx.imageSmoothingEnabled = true; cx.drawImage(FB, 0, 0, W, H);
    cx.lineCap = 'round';
    for (var j = 0; j < E.length; j++) {   /* искры с хвостом по направлению полёта */
      var e = E[j], a = e.life * (.6 + .4 * Math.sin(e.w * 5)), vx = e.x - e.px, vy = e.y - e.py;
      var tg = cx.createLinearGradient(e.x, e.y, e.x - vx * 5, e.y - vy * 5); tg.addColorStop(0, 'rgba(255,210,120,' + a * .8 + ')'); tg.addColorStop(1, 'rgba(255,120,40,0)');
      cx.strokeStyle = tg; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(e.x, e.y); cx.lineTo(e.x - vx * 5, e.y - vy * 5); cx.stroke();
      blit(SP_EMBER, e.x, e.y, 3, a);
    }
    for (var k2 = 0; k2 < S.length; k2++) { var b = S[k2]; blit(SP_BLUE, b.x, b.y, 4, b.life); }
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    /* преграда */
    var lit = Math.min(1, .25 + hit * 1.2 + I * .3);
    var bg = cx.createLinearGradient(0, BY - 26, 0, BY + 26);
    bg.addColorStop(0, 'rgba(99,179,255,0)'); bg.addColorStop(.5, 'rgba(99,179,255,' + .14 * lit + ')'); bg.addColorStop(1, 'rgba(99,179,255,0)');
    cx.fillStyle = bg; cx.fillRect(0, BY - 26, W, 52);
    cx.strokeStyle = 'rgba(99,179,255,' + (.25 + .55 * lit) + ')'; cx.lineWidth = 1.6;
    cx.setLineDash(m === 'a' ? [6, 26] : [22, 6, 3, 6]);
    cx.lineDashOffset = -t / 70;
    cx.beginPath(); cx.moveTo(0, BY); cx.lineTo(W, BY); cx.stroke(); cx.setLineDash([]);
    cx.font = '600 10px "Golos Text", system-ui, sans-serif'; cx.textAlign = 'right';
    cx.fillStyle = 'rgba(99,179,255,' + (.25 + .35 * lit) + ')';
    cx.fillText(m === 'a' ? 'ДД открыты · дымоудаление' : 'ПРЕГРАДА EI 150 · НО закрыт', W - 10, BY - 6); cx.textAlign = 'left';
  }
  /* дым нужного оттенка: белый спрайт, окрашенный один раз и закэшированный по цвету */
  var TC = {};
  function tint(c) {
    if (TC[c]) return TC[c];
    var o = document.createElement('canvas'); o.width = o.height = 128; var x = o.getContext('2d');
    x.drawImage(SP_SMOKE, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = c; x.fillRect(0, 0, 128, 128);
    var keys = Object.keys(TC); if (keys.length > 60) delete TC[keys[0]];
    return (TC[c] = o);
  }
  function loop(t) {
    if (!run) return;
    var dt = Math.min(3, t0 ? (t - t0) / 16.7 : 1); t0 = t;
    step(dt); draw(t);
    requestAnimationFrame(loop);
  }

  size();
  addEventListener('resize', size);
  addEventListener('scroll', place, { passive: true });
  setTimeout(place, 600);   /* меню строит app.js — после него пересчитать */
  addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', function () { mx = my = -1e4; });
  document.addEventListener('visibilitychange', function () { run = !document.hidden && !calm; if (run) { t0 = 0; requestAnimationFrame(loop); } });
  if (calm) { I = .5; for (var n = 0; n < 240; n++) { step(2); } draw(0); }
  else requestAnimationFrame(loop);
})();
