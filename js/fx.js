/* Фон на весь экран: «противопожарная преграда держит огонь» + звук горящих дров (синтез, по умолч. выкл).
   Пламя — мягкие светящиеся частицы (готовые спрайты, рисуются drawImage — дёшево и плавно).
   Пламя поднимается к преграде на 1/3 высоты и растекается под ней; искры о преграду гаснут голубыми брызгами.
   Режимы шапки: Работа — тлеет; Пожар — сильный огонь до преграды; После — угли и дым уходит через ДД.
   Переходы плавные (интенсивность догоняет цель ~3 с). Пауза на скрытой вкладке; «уменьшить движение» — статичный кадр. */
(function () {
  var cv = document.createElement('canvas'), cx = cv.getContext('2d');
  if (!cx) return;
  cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var W, H, DPR, BY, F = [], E = [], S = [], D = [], I = .3, hit = 0, mx = -1e4, my = -1e4, t0 = 0, run = true;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TARGET = { n: .32, f: 1, a: .12 };
  function mode() { var m = document.documentElement.dataset.mode; return TARGET[m] !== undefined ? m : 'n'; }

  /* спрайты: мягкое пятно пламени, искра, дым */
  function sprite(stops) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(function (s) { r.addColorStop(s[0], s[1]); });
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return c;
  }
  var SP_HOT = sprite([[0, 'rgba(255,240,180,1)'], [.25, 'rgba(255,190,80,.75)'], [.6, 'rgba(255,110,30,.25)'], [1, 'rgba(255,60,20,0)']]);
  var SP_MID = sprite([[0, 'rgba(255,170,60,.9)'], [.4, 'rgba(255,100,30,.4)'], [1, 'rgba(220,40,15,0)']]);
  var SP_RED = sprite([[0, 'rgba(230,60,20,.7)'], [.5, 'rgba(170,30,15,.25)'], [1, 'rgba(120,20,10,0)']]);
  var SP_SPARK = sprite([[0, 'rgba(255,250,220,1)'], [.2, 'rgba(255,180,80,.8)'], [1, 'rgba(255,90,30,0)']]);
  var SP_SMOKE = sprite([[0, 'rgba(150,165,190,.22)'], [1, 'rgba(150,165,190,0)']]);
  var SP_BLUE = sprite([[0, 'rgba(200,235,255,1)'], [.3, 'rgba(99,200,255,.6)'], [1, 'rgba(99,179,255,0)']]);

  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = document.documentElement.clientWidth || innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    place();
  }
  /* 1.27.6, инженер 08.11: преграда — сразу под пунктом «Главная» бокового меню (больше места пламени в «Пожаре»).
     Меню липкое — пересчёт при прокрутке; на телефоне меню внизу — тогда прежние 34 % высоты. */
  function place() {
    var a = document.querySelector('.nav a'), y = 0;
    if (a && getComputedStyle(a.parentNode).position !== 'fixed') { var r = a.getBoundingClientRect(); if (r.height) y = Math.round(r.bottom + 12); }
    BY = y > 40 && y < H * .6 ? y : Math.round(H * .34);
  }
  function flame() {
    var big = 30 + Math.random() * 60;
    return { x: Math.random() * W, y: H + big * .3, vx: (Math.random() - .5) * .3, vy: -(0.9 + Math.random() * 1.4) * (0.7 + 1.5 * I),
      r: big * (0.6 + I * .7), w: Math.random() * 6.28, life: 1, dec: .004 + Math.random() * .004 };
  }
  function spark() {
    return { x: Math.random() * W, y: H - Math.random() * 40, vx: (Math.random() - .5) * .6, vy: -(1.2 + Math.random() * 2.2), r: 2 + Math.random() * 4, w: Math.random() * 6.28, life: 1 };
  }
  function puff() {
    return { x: Math.random() * W, y: H + 60, vx: (Math.random() - .5) * .25, vy: -(0.3 + Math.random() * .45), r: 60 + Math.random() * 90, w: Math.random() * 6.28, life: 1 };
  }
  function burst(x) {
    hit = Math.min(1, hit + .08);
    for (var i = 0; i < 4; i++) S.push({ x: x, y: BY, vx: (Math.random() - .5) * 3.2, vy: Math.random() * 1.6 + .2, life: 1 });
    SND.crack(.5);
  }
  function spawn(rate, dt, list, make, cap) { var n = rate * dt; while (n > 0 && list.length < cap) { if (Math.random() < n) list.push(make()); n -= 1; } }

  function step(dt) {
    var m = mode();
    I += (TARGET[m] - I) * .012 * dt;                       /* плавный переход между режимами */
    hit *= Math.pow(.95, dt);
    spawn(W / 1400 * (2 + 8 * I), dt, F, flame, 320);
    spawn(.15 + 1.6 * I * I, dt, E, spark, 120);
    if (m === 'a') spawn(.12, dt, D, puff, 45);
    var reach = BY + (H - BY) * (1 - I);                    /* до какой высоты доходит пламя */
    for (var i = F.length - 1; i >= 0; i--) {
      var p = F[i];
      p.w += .03 * dt;
      p.x += (p.vx + Math.sin(p.w) * .5) * dt; p.y += p.vy * dt;
      if (p.y < BY + p.r * .3) { p.vy *= Math.pow(.9, dt); p.vx += (p.x > W / 2 ? .03 : -.03) * dt; hit = Math.min(1, hit + .002 * dt); }  /* растекается под преградой */
      var top = (H - p.y) / Math.max(1, H - reach);
      p.life -= p.dec * dt * (1 + Math.max(0, top - 1) * 4);
      if (p.life <= 0) F.splice(i, 1);
    }
    for (var j = E.length - 1; j >= 0; j--) {
      var e = E[j];
      e.w += .08 * dt; e.x += (e.vx + Math.sin(e.w) * .6) * dt; e.y += e.vy * dt;
      var dx = e.x - mx, dy = e.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 12000) e.x += dx / Math.sqrt(d2 + 1) * (12000 - d2) / 12000 * 2.2 * dt;
      e.life -= .0016 * dt;
      if (e.y <= BY) { burst(e.x); E.splice(j, 1); continue; }  /* преграда держит */
      if (e.life <= 0) E.splice(j, 1);
    }
    for (var k = S.length - 1; k >= 0; k--) { var s = S[k]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += .06 * dt; s.life -= .03 * dt; if (s.life <= 0) S.splice(k, 1); }
    for (var q = D.length - 1; q >= 0; q--) { var d = D[q]; d.w += .01 * dt; d.x += (d.vx + Math.sin(d.w) * .3) * dt; d.y += d.vy * dt; d.r += .12 * dt; d.life -= .0022 * dt; if (d.life <= 0 || d.y < -200) D.splice(q, 1); }
    SND.level(I, m);
  }
  function blit(img, x, y, r, a, k) { if (a <= 0) return; k = k || 1; cx.globalAlpha = Math.min(1, a); cx.drawImage(img, x - r / k, y - r * k, r * 2 / k, r * 2 * k); }

  function draw(t) {
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    cx.clearRect(0, 0, W, H);
    var m = mode();
    /* общий жар снизу, медленно «дышит» */
    var fl = .9 + Math.sin(t / 700) * .06 + Math.sin(t / 290) * .04;
    var g = cx.createLinearGradient(0, H, 0, BY);
    g.addColorStop(0, 'rgba(255,80,25,' + (.35 * I * fl) + ')');
    g.addColorStop(.5, 'rgba(200,40,15,' + (.12 * I * fl) + ')');
    g.addColorStop(1, 'rgba(200,40,15,0)');
    cx.fillStyle = g; cx.fillRect(0, BY, W, H - BY);
    /* дым — до пламени, обычным смешением */
    for (var q = 0; q < D.length; q++) { var d = D[q]; blit(SP_SMOKE, d.x, d.y, d.r, d.life); }
    cx.globalCompositeOperation = 'lighter';
    /* пламя: от молодых горячих к остывающим красным */
    for (var i = 0; i < F.length; i++) {
      var p = F[i], l = p.life, a = l * (.2 + .16 * I);
      var img = l > .7 ? SP_HOT : l > .4 ? SP_MID : SP_RED;
      blit(img, p.x, p.y, p.r * (.5 + l * .6), a, 1.25 + (1 - l) * .5);   /* язык вытянут вверх */
    }
    for (var j = 0; j < E.length; j++) { var e = E[j]; blit(SP_SPARK, e.x, e.y, e.r * (2.5 + Math.sin(e.w * 3)), e.life * .9); }
    for (var k = 0; k < S.length; k++) { var s = S[k]; blit(SP_BLUE, s.x, s.y, 4, s.life); }
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
  function loop(t) {
    if (!run) return;
    var dt = Math.min(3, t0 ? (t - t0) / 16.7 : 1); t0 = t;
    step(dt); draw(t);
    requestAnimationFrame(loop);
  }

  /* ---- Звук: горящие дрова (синтез, без файлов). 1.34.0, инженер 08.11: запись камина убрана —
     в ней голоса людей; нужно «просто горящие дрова». По умолчанию выключен.
     Слои: 1) дыхание пламени — бурый шум 150–700 Гц, громкость мерцает случайно (не ровный гул, иначе «ветер»);
     2) потрескивание — пачки коротких сухих щелчков 2–7 кГц с неровным шагом (ровный темп = «попкорн»);
     3) редкий хлопок полена — щелчок + глухой удар 90–220 Гц. Режим: Работа — спокойно, Пожар — сильнее, После — угли. */
  var SND = (function () {
    var ac = null, master, bed, noise, on = false, nextBurst = 0, nextPop = 0, nextFlick = 0;
    function build() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      var len = ac.sampleRate * 4, bb = ac.createBuffer(1, len, ac.sampleRate), bd = bb.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; bd[i] = last * 3.5; }
      var wb = ac.createBuffer(1, len, ac.sampleRate), wd = wb.getChannelData(0);
      for (var j = 0; j < len; j++) wd[j] = Math.random() * 2 - 1;
      noise = wb;
      master = ac.createGain(); master.gain.value = 0;
      var comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ac.destination);
      var s1 = ac.createBufferSource(); s1.buffer = bb; s1.loop = true;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 150;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      bed = ac.createGain(); bed.gain.value = 0;
      s1.connect(hp); hp.connect(lp); lp.connect(bed); bed.connect(master); s1.start();
      return true;
    }
    /* сухой щелчок: шум 1–8 мс, полоса выше 2 кГц, быстрый спад */
    function tick(t, a) {
      var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), d = .001 + Math.random() * .007;
      src.buffer = noise; f.type = 'highpass'; f.frequency.value = 1800 + Math.random() * 5000;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .0005); g.gain.exponentialRampToValueAtTime(.0003, t + d);
      src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random() * 3, d + .01);
    }
    /* хлопок полена: громкий щелчок + глухой удар */
    function pop(t, a) {
      tick(t, a);
      var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), d = .05 + Math.random() * .08;
      src.buffer = noise; f.type = 'bandpass'; f.frequency.value = 90 + Math.random() * 130; f.Q.value = 1.2;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * 1.8, t + .003); g.gain.exponentialRampToValueAtTime(.0003, t + d);
      src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random() * 3, d + .02);
      if (Math.random() < .5) for (var k = 1 + (Math.random() * 4 | 0); k > 0; k--) tick(t + .01 + Math.random() * .12, a * (.15 + Math.random() * .3));
    }
    /* пачка потрескивания: 2–14 щелчков с неровным шагом 4–60 мс */
    function burst(t, a) {
      var n = 2 + (Math.random() * 12 | 0), tt = t;
      for (var i = 0; i < n; i++) { tick(tt, a * (.3 + Math.random() * .7)); tt += .004 + Math.random() * Math.random() * .06; }
    }
    function crack(p) { if (on && ac && ac.state === 'running') tick(ac.currentTime + .01, .15 + .3 * p); }
    function level(I, m) {
      if (!on || !ac || ac.state !== 'running') return;
      var now = ac.currentTime, k = m === 'f' ? 1 : m === 'a' ? .3 : .55;
      master.gain.setTargetAtTime(m === 'a' ? .35 : .55, now, .5);
      if (now > nextFlick) { bed.gain.setTargetAtTime((m === 'a' ? .05 : .1 + .2 * I) * (.5 + Math.random()), now, .12); nextFlick = now + .08 + Math.random() * .25; }
      if (now > nextBurst) {
        burst(now + .02, (.12 + .25 * Math.random()) * (.6 + .6 * k));
        nextBurst = now + (.15 + Math.random() * Math.random() * 1.6) / (.4 + k);
      }
      if (now > nextPop) {
        if (m !== 'a' || Math.random() < .3) pop(now + .03, .35 + .35 * Math.random() * k);
        nextPop = now + (1.5 + Math.random() * 5) / (.5 + k);
      }
    }
    var btn = document.createElement('button');
    function set(v) {
      on = v; try { localStorage.setItem('klapany-snd2', v ? '1' : '0'); } catch (x) {}
      if (v) { if (!ac && !build()) { on = false; return; } ac.resume(); }
      else if (ac) { master.gain.setTargetAtTime(0, ac.currentTime, .15); setTimeout(function () { if (!on && ac) ac.suspend(); }, 600); }
      btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on);
      btn.title = on ? 'Выключить звук огня' : 'Включить звук огня';
    }
    btn.type = 'button'; btn.id = 'snd'; btn.className = 'sndbtn'; btn.setAttribute('aria-pressed', 'false'); btn.title = 'Включить звук огня';
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="w" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg><span>Звук</span>';
    var tin = document.querySelector('.top .tin'); if (tin) tin.appendChild(btn);
    btn.addEventListener('click', function () { set(!on); });
    /* новый ключ klapany-snd2: у всех по умолчанию выключено (старое «вкл» от записи с голосами не переносим) */
    var want = false; try { want = localStorage.getItem('klapany-snd2') === '1'; } catch (x) {}
    if (want) {
      var first = function (e) { if (e.target.closest && e.target.closest('#snd')) return; set(true); removeEventListener('pointerdown', first, true); };
      addEventListener('pointerdown', first, true);
    }
    document.addEventListener('visibilitychange', function () { if (!ac || !on) return; if (document.hidden) ac.suspend(); else ac.resume(); });
    return { crack: function (p) { if (Math.random() < .35) crack(p); }, level: level };
  })();

  size();
  addEventListener('resize', size);
  addEventListener('scroll', place, { passive: true });
  setTimeout(place, 600);   /* меню строит app.js — после него пересчитать */
  addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', function () { mx = my = -1e4; });
  document.addEventListener('visibilitychange', function () { run = !document.hidden && !calm; if (run) { t0 = 0; requestAnimationFrame(loop); } });
  if (calm) { I = .5; for (var n = 0; n < 160; n++) { step(4); } draw(0); }
  else requestAnimationFrame(loop);
})();
