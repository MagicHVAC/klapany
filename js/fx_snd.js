/* Звук огня (вынесен из fx.js в 1.37.0, без изменений): горящие дрова, синтез, по умолч. выкл. Глобально: window.FXSND = { crack, level }. */
(function () {
  /* ---- Звук: горящие дрова (синтез, без файлов). 1.34.0, инженер 08.11: запись камина убрана —
     в ней голоса людей; нужно «просто горящие дрова». По умолчанию выключен.
     Слои: 1) дыхание пламени — бурый шум 150–700 Гц, громкость мерцает случайно (не ровный гул, иначе «ветер»);
     2) потрескивание — пачки коротких сухих щелчков 2–7 кГц с неровным шагом (ровный темп = «попкорн»);
     3) редкий хлопок полена — щелчок + глухой удар 90–220 Гц. Режим: Работа — спокойно, Пожар — сильнее, После — угли. */
  window.FXSND = (function () {
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

})();
