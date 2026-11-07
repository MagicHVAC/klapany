/* Расчёт системы вытяжной противодымной вентиляции целиком — по схеме, совместимой с проектами «КВМ-Дым» (.smkprj).
   Методика: МР ВНИИПО к СП 7.13130.2013 (2013), разд. 3, п. 5.1, прил. 3; СП 7.13130 прил. Е (ДПУ).
   Порядок расчёта сети и принятые в нём допущения повторяют отчёты «КВМ-Дым» 5.2 (сверено на отчётах инженера, 06.11.2026):
   T = t + 273; ρ = 353/T; подсосы через стенки — (ρв/3600)·S·0,032·ΔP^0,65 (= МР прил. 3 п. 1, S — площадь поверхности);
   закрытый клапан — Fкл·(|P|/Sкл)^1/2; смешение — по массе; λ — Кольбрук; ν — полином по t.
   Работает в браузере (глобальные функции) и в Node (module.exports) — для стенда сверки с отчётами. */
var SMK_G = 9.81;
/* Проходное сечение клапана, м²: (W − 50)·(H − 50) мм — так в отчётах «КВМ-Дым» */
function smkPass(w, h) { return Math.max(w - 50, 0) * Math.max(h - 50, 0) / 1e6; }
/* КМС открытого клапана по типоразмеру — значения из отчётов «КВМ-Дым» для клапанов КВМ; для других — по паспорту */
var SMK_ZKL = { '800x300': 0.53, '800x400': 0.35, '1350x450': 0.26, '1500x800': 0.19 };
function smkZkl(w, h) { var k = w + 'x' + h; return k in SMK_ZKL ? SMK_ZKL[k] : NaN; }
/* кинематическая вязкость продуктов горения, м²/с — полином из отчётов «КВМ-Дым» */
function smkNu(T) { var x = (T - 273) / 1000; return (63.763736 * x * x + 99.05 * x + 11.106593) / 1e6; }
/* 1.27.0: λ — по Альтшулю, МР ВНИИПО (73): λ = 0,11·(68/Re + k/de)^1/4 (k — шероховатость, м).
   Кольбрук 1/√λ = −2·lg(ε/(3,7D) + 2,51/(Re·√λ)) — только для сверки с отчётами программ, считающих по нему (SMK_COLEBROOK = true). */
var SMK_COLEBROOK = false;
function smkLam(Re, eps, D) {
  if (!(Re > 0)) return 0;
  if (!SMK_COLEBROOK) return 0.11 * Math.pow(68 / Re + eps / D, 0.25);
  var f = 0.02;
  for (var i = 0; i < 40; i++) { var r = -2 * Math.log10(eps / (3.7 * D) + 2.51 / (Re * Math.sqrt(f))); f = 1 / (r * r); }
  return f;
}
function smkDe(a, b) { return 2 * a * b / (a + b); }
/* теплоёмкость газа, кДж/(кг·К) — МР прил. 2 */
function smkCp(T) { return 1.3615803 / Math.pow(1 + Math.exp(7.0065648 - 0.0053034712 * T), 1 / 20.761095); }

/* ---------- чтение проекта «КВМ-Дым» (INI, cp1251 уже раскодирован) ---------- */
function smkIni(text) {
  var d = {}, sec = '';
  String(text).split(/\r?\n/).forEach(function (l) {
    l = l.trim(); if (!l || l[0] === '#' || l[0] === ';') return;
    if (l[0] === '[') { sec = l.slice(1, -1); d[sec] = d[sec] || {}; return; }
    var i = l.indexOf('='); if (i > 0) (d[sec] = d[sec] || {})[l.slice(0, i)] = l.slice(i + 1);
  });
  return d;
}
function smkNum(v) { var x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; }
function smkFromIni(d) {
  var R = d.Room || {}, L = d.FLoad || {}, C = d.Corridor || {}, P = d.FPlace || {}, O = d.Outside || {}, E = d.ShaftEnd || {}, S = d.SmkRcvr || {}, n = smkNum;
  var doors = [];
  for (var i = 0; i < 10; i++) { var w = n(R['Door' + i + 'W']), h = n(R['Door' + i + 'H']); if (w > 0 && h > 0) doors.push([w, h]); }
  var segs = [];
  for (var k = 0; d['Shaft' + k]; k++) {
    var s = d['Shaft' + k];
    segs.push({ storey: s.Storey || '', vw: n(s.ValveW), vh: n(s.ValveH), nodeZ: n(s.NodeZ), hA: n(s.HA), hB: n(s.HB), hL: n(s.HL), hZ: n(s.HZ), vA: n(s.VA), vB: n(s.VB), vL: n(s.VL), vZ: n(s.VZ) });
  }
  return {
    name: (d.Project || {}).Name || '', system: (d.Project || {}).System || '',
    variant: n(R.Variant), living: n(R.Living) === 1, aupt: n(R.AUPT) === 1,
    L: n(R.RoomL), W: n(R.RoomW), H: n(R.RoomH), Ff: n(R.FloorA), doors: doors, hNz: n(R.NoSmkH), tr: n(R.AirTmp), Fo: n(R.FireA),
    qp: n(L.FLDensity), qpName: L.FLDName || '', Q: n(L.BurnEnergy), v: n(L.FireSpeed), psi: n(L.SBurnSpeed), loadName: L.FLName || '',
    cL: n(C.CrdrL), cA: n(C.CrdrA), dA: n(C.DoorA), dH: n(C.DoorH), cH: n(C.CrdrH),
    eta: n(P.BurnK), r: n(P.HeatK), tOut: n(O.AirTmp), tComp: n(O.AirTmpComp), wind: n(O.WindSpeed),
    segs: segs, Skl: 11000, eps: 0.0001,
    endExhaust: n(E.EndExhaust) === 1, ductRes: n(E.ConDuctResist), vOut: n(E.ExhaustGasSpeed),
    dpuH: n(S.Hntdu), dpuW: n(S.RW), dpuB: n(S.RH), dpuType: n(S.SRType)
  };
}

/* ---------- расход продуктов горения ---------- */
function smkCorridor(p, o) {
  /* МР 3.2.1, прил. 1 — как в отчётах «КВМ-Дым»: g0 = qп/Qнд, gk = Ff·qп/((Fw − A0)·Qнд) */
  var Qnd = 13.8, V = p.L * p.W * p.H, Ff = p.L * p.W;
  o.Ff = Ff; o.V = V; o.Fw = 6 * Math.pow(V, 2 / 3);
  o.A0 = p.doors.reduce(function (s, x) { return s + x[0] * x[1]; }, 0);
  o.Pi = p.doors.reduce(function (s, x) { return s + x[0] * x[1] * Math.sqrt(x[1]); }, 0) / Math.pow(V, 2 / 3);
  o.V0 = 0.263 * p.Q; o.Tr = p.tr + 273;
  o.g0 = p.qp / Qnd; o.gk = Ff * p.qp / ((o.Fw - o.A0) * Qnd);
  o.gkr = 4500 * Math.pow(o.Pi, 3) / (1 + 500 * Math.pow(o.Pi, 3)) + Math.pow(V, 1 / 3) / (6 * o.V0);
  o.prv = o.gk > o.gkr;
  o.T0max = o.prv ? o.Tr + 940 * Math.exp(0.0047 * o.g0 - 0.141) : o.Tr + 224 * Math.pow(o.gk, 0.528);
  o.T0 = 0.8 * o.T0max;
  o.hsm = p.cH - p.hNz;
  var c = 2 * o.hsm + p.cA / p.cL;
  o.Tsm = o.Tr + 1.22 * (o.T0 - o.Tr) * c / p.cL * (1 - Math.exp(-0.58 * p.cL / c));
  o.ksm = p.living ? 1.0 : 1.2;
  o.G = o.ksm * p.dA * Math.sqrt(p.dH);
  o.hH = o.hsm / p.cH;
  if (o.hH < 0.5 - 1e-9 || o.hH > 0.6 + 1e-9) o.warn.push('hsm/H = ' + o.hH.toFixed(2).replace('.', ',') + ' — вне 0,5…0,6: зависимость (16) применима только при 0,5 ≤ hsm/H ≤ 0,6 (МР 3.2.1). Подбери Hнз = ' + (0.4 * p.cH).toFixed(2).replace('.', ',') + '…' + (0.5 * p.cH).toFixed(2).replace('.', ',') + ' м.');
}
/* ---------- 1.27.0: расход продуктов горения по МР ВНИИПО разд. 3 — сверено построчно с текстом МР (07.11.2026) ----------
   Варианты: 0 — коридор, холл, одноуровневый вестибюль, смежные с горящим (3.2.1: (13)–(17), прил. 1);
             1 — многоуровневый вестибюль, молл, атриум, смежные с горящим (3.2.2: (18), температура — (4));
             2 — зал, атриум — из горящего помещения (3.1.1, 3.1.2: (3), (4), (7) или (8) по высоте факела z1);
             3 — атриум, очаг под галереей на уровне основания (3.1.2: (9));
             4 — закрытая автостоянка, рампа (3.1.2: Qf = 5,0 МВт × ярусов, (7) или (8) по z1).
   Для 1–4 — режим (12): Gsm = Gk, расчёт без интегрирования (2). */
function smkPlume(p, o, Gk) {
  /* (4) с Tk = Tr + rQf/(cpk·Gk), α = 0,01163·exp(0,0023(Tsm − 273)); последовательные приближения */
  var Qr = p.r * o.Qf, Tk = o.Tr + 100, Ts = o.Tr + 50;
  for (var i = 0; i < 80; i++) {
    var cpk = smkCp(Tk); Tk = o.Tr + Qr / (cpk * Gk);
    var a = 0.01163 * Math.exp(0.0023 * (Ts - 273)), S = o.hsm * o.lsm + o.Asm, cs = smkCp(Ts);
    Ts = o.Tr + cs * Qr / (smkCp(Tk) * a * S) * (1 - Math.exp(-a * S / (cs * Gk)));
  }
  o.Gk = Gk; o.Tk = Tk; o.Tsm = Ts; o.alpha = 0.01163 * Math.exp(0.0023 * (Ts - 273)); o.cpk = smkCp(Tk); o.cps = smkCp(Ts);
  o.G = Gk;
}
function smkRoom(p, o) {
  /* общая геометрия горящего (защищаемого) помещения: Asm — площадь, lsm = 2(a + b), hsm = H − Hнз */
  o.Tr = p.tr + 273; o.Asm = p.Ff > 0 ? p.Ff : p.L * p.W; o.Ff = o.Asm; o.V = o.Asm * p.H; o.lsm = 2 * (p.L + p.W);
  o.hsm = p.H - p.hNz; o.z = p.hNz;
  if (!(o.hsm > 0)) o.err.push('Hнз = ' + smkF(p.hNz) + ' м не ниже высоты помещения ' + smkF(p.H) + ' м — дымового слоя нет.');
}
function smkQf(p, o) { o.Fo = p.Fo; o.Qf = p.eta * p.Q * 1000 * p.psi * p.Fo; } /* (3), кВт: η·Qнр[МДж/кг]·1000·ψ·F0 */
function smk78(p, o) {
  /* выбор (7) или (8): z1 = 0,166(rQf)^2/5; z1 < z — (7), z1 > z — (8) */
  var Qr = p.r * o.Qf, z = o.z;
  o.Zf = 0.166 * Math.pow(Qr, 0.4);
  o.f = o.Zf > z ? 8 : 7;
  return o.f === 8 ? 0.032 * Math.pow(Qr, 0.6) * z : 0.071 * Math.pow(Qr, 1 / 3) * Math.pow(z, 5 / 3) + 0.0018 * Qr;
}
function smkHall(p, o) {
  smkRoom(p, o); smkQf(p, o);
  o.Rsafe = Math.sqrt(o.Qf / (4 * Math.PI * 10)); /* справочно: радиус при qкр = 10 кВт/м² (не из МР) */
  smkPlume(p, o, smk78(p, o));
}
function smkGallery(p, o) {
  /* (9): Gk = 0,36·(Qf·W)^1/3·(z + 0,25H); W — ширина струи из-под ограждения галереи, H — от основания атриума до ограждения,
     z — от ограждения до низа дымового слоя = Hнз − H. В МР стоит (Qf·W)^1/3 — так и считаем (в NFPA 92 — W²). */
  smkRoom(p, o); smkQf(p, o);
  o.Hg = p.gH; o.Wg = p.gW; o.zg = p.hNz - p.gH; o.f = 9;
  if (!(o.zg > 0)) { o.err.push('Низ дымового слоя Hнз = ' + smkF(p.hNz) + ' м должен быть выше ограждения галереи H = ' + smkF(p.gH) + ' м.'); return; }
  smkPlume(p, o, 0.36 * Math.pow(o.Qf * p.gW, 1 / 3) * (o.zg + 0.25 * p.gH));
}
function smkPark(p, o) {
  /* 3.1.2: автостоянка манежного типа — Qf = 5,0 МВт; 2- или 3-ярусная механизированная — Qf × 2 или × 3; Gk — (7) или (8) по z1.
     Низ дымового слоя — не ниже верха дверей эвакуационных выходов из помещения. */
  smkRoom(p, o);
  o.tiers = Math.min(3, Math.max(1, Math.round(+p.tiers || 1))); o.Qf = 5000 * o.tiers;
  if (p.hNz < p.dExitH) o.warn.push('Hнз = ' + smkF(p.hNz) + ' м ниже верха дверей эвакуационных выходов ' + smkF(p.dExitH) + ' м — по МР 3.1.2 низ дымового слоя не ниже верха этих дверей.');
  smkPlume(p, o, smk78(p, o));
}
function smkMall(p, o) {
  /* 3.2.2, (18): Gk = 0,68(Aw·Hw^1/2)^1/3·(Zw + a)^5/3 + 1,59·Aw·Hw^1/2; a = 2,4·Aw^2/5·Hw^1/5 − 2,1·Hw;
     Zw — от верха проёма горящего помещения до низа дымового слоя = Hнз − (низ проёма + Hw). Тсл — по (4), Qf — по (3) для горящего помещения. */
  smkRoom(p, o); smkQf(p, o);
  var Aw = p.wA, Hw = p.wH; o.Aw = Aw; o.Hw = Hw; o.f = 18;
  o.Zw = p.hNz - (p.wZ + Hw); o.aw = 2.4 * Math.pow(Aw, 0.4) * Math.pow(Hw, 0.2) - 2.1 * Hw;
  if (!(o.Zw > 0)) { o.err.push('Низ дымового слоя Hнз = ' + smkF(p.hNz) + ' м должен быть выше верха проёма ' + smkF(p.wZ + Hw) + ' м.'); return; }
  if (!(o.Zw + o.aw > 0)) { o.err.push('Zw + a ≤ 0 — в (18) нет решения, проверь размеры проёма.'); return; }
  var k = Aw * Math.sqrt(Hw);
  smkPlume(p, o, 0.68 * Math.pow(k, 1 / 3) * Math.pow(o.Zw + o.aw, 5 / 3) + 1.59 * k);
}
function smkF(v) { return (+v).toFixed(2).replace('.', ','); }
/* МР прил. 3 п. 2 (обязательное): Sдп закрытого НЗ клапана, м³/кг, по температуре газа, °C */
function smkSklT(t) { return t <= 20 ? 29900 : t <= 100 ? 30300 : t <= 200 ? 38300 : t <= 300 ? 37900 : 29300; }
function smkSkl(p, t) { return p.Skl > 0 ? p.Skl : smkSklT(t); }

/* ---------- сеть: МР п. 5.1, (70)–(87). Узел i — вход этажного канала i в коллектор; 1-й — этаж пожара (клапан открыт).
   От узла i к узлу i + 1 — вертикаль участка i: P(i+1) = P(i) − ΔPтр,i + g·h·(ρr − ρi) (83, знак «−» — разрежение);
   подсосы через стенки (84) — по среднему давлению участка, через закрытый клапан (85) — Sдп по прил. 3 при температуре газа.
   Последний участок — вертикаль до вентилятора (без клапана). Теплопотери q = 0 (5.1.5 допускает при падении t < 1 К; в запас по объёму). ---------- */
function smkNet(p, o) {
  var g = SMK_G, TB = o.Tr, roB = 353 / TB, G0 = o.G, Ts = o.Tsm, Ga = 0, rows = [], N = p.segs.length;
  var leak = function (S, P) { return roB / 3600 * S * 0.032 * Math.pow(Math.max(P, 0), 0.65); }; /* = (84): 3,556·10⁻⁵·ρr·P^0,65·F/de·l */
  var mix = function () { var T = (TB * Ga + Ts * G0) / (G0 + Ga); return { T: T, ro: 353 / T, G: G0 + Ga }; };
  var fr = function (G, ro, T, a, b, L, Z) {
    if (!(a > 0 && b > 0)) return { v: 0, dp: 0, lam: 0, Re: 0, De: 0 };
    var F = a * b, De = smkDe(a, b), v = G / (ro * F), Re = v * De / smkNu(T), lam = smkLam(Re, p.eps, De);
    return { v: v, dp: 0.5 * ro * v * v * (lam * L / De + Z), lam: lam, Re: Re, De: De };
  };
  var s0 = p.segs[0], Fkl = smkPass(s0.vw, s0.vh), zkl = isFinite(s0.zkl) ? s0.zkl : smkZkl(s0.vw, s0.vh);
  if (!isFinite(zkl)) { o.err.push('Нет КМС клапана ' + s0.vw + '×' + s0.vh + ' мм — задай по паспорту.'); zkl = 0; }
  var ro0 = 353 / Ts, vkl = G0 / (Fkl * ro0), dPkl = 0.5 * (zkl + s0.nodeZ) * vkl * vkl * ro0;
  o.Fkl = Fkl; o.zkl = zkl; o.vkl = vkl; o.dPkl = dPkl;
  /* узел 1: клапан + узел (82) и горизонталь (70); подсосы горизонтали — по среднему давлению */
  var m = mix(), h = { dp: 0 }, P = -dPkl, gH = 0;
  if (N > 1 && s0.hL > 0) for (var it = 0; it < 8; it++) {
    h = fr(m.G, m.ro, m.T, s0.hA, s0.hB, s0.hL, s0.hZ); P = -dPkl - h.dp;
    gH = leak(2 * (s0.hA + s0.hB) * s0.hL, (dPkl + Math.abs(P)) / 2); Ga = gH; m = mix();
  }
  var row = { i: 1, P: P, gKl: 0, gH: gH, gV: 0, Ga: Ga, G: m.G, T: m.T, ro: m.ro, hor: h, open: true };
  rows.push(row);
  for (var i = 0; i < N; i++) {
    var s = p.segs[i], cur = rows[i], Pn = cur.P, vf, gv = 0, Pend = Pn;
    /* вертикаль участка i: трение, тяга, подсосы стенок — 3 приближения по среднему давлению */
    for (var k = 0; k < 4; k++) {
      var mm = { G: cur.G + gv, T: (cur.T * cur.G + TB * gv) / (cur.G + gv), ro: 0 }; mm.ro = 353 / mm.T;
      vf = fr(mm.G, mm.ro, mm.T, s.vA, s.vB, s.vL, s.vZ);
      Pend = Pn - vf.dp + g * s.vL * (roB - mm.ro);
      gv = leak(2 * (s.vA + s.vB) * s.vL, (Math.abs(Pn) + Math.abs(Pend)) / 2);
    }
    cur.gV = gv; cur.ver = vf; Ga += gv; cur.Ga = Ga; m = mix(); cur.G = m.G; cur.T = m.T; cur.ro = m.ro;
    if (i === N - 1) { cur.last = true; o.PN = Pend; break; }
    /* узел i + 1: закрытый клапан этажа (85) и подсосы его горизонтали */
    var s1 = p.segs[i + 1], isLast = i + 1 === N - 1, tC = m.T - 273;
    var gK = isLast ? 0 : smkPass(s1.vw, s1.vh) * Math.sqrt(Math.abs(Pend) / smkSkl(p, tC));
    var gh = isLast ? 0 : leak(2 * (s1.hA + s1.hB) * s1.hL, Math.abs(Pend));
    Ga += gK + gh; m = mix();
    rows.push({ i: i + 2, P: Pend, gKl: gK, gH: gh, gV: 0, Ga: Ga, G: m.G, T: m.T, ro: m.ro, Skl: isLast ? 0 : smkSkl(p, tC), last: isLast });
  }
  o.rows = rows; o.GN = m.G; o.TN = m.T; o.roN = m.ro; o.Ga = Ga;
  o.Lv = o.GN / o.roN * 3600; o.PshN = Math.abs(o.PN); o.tFan = o.TN - 273;  /* (88) */
  /* Pd — присоединительные воздуховоды от коллектора до выброса, включая обвязку вентилятора (89); сеть по участкам — вместо числа */
  o.dPout = +p.ductRes || 0;
  if (p.netOut && p.netOut.secs && p.netOut.secs.length && typeof kmsNet === 'function') {
    o.netOut = kmsNet(o.GN, o.roN, smkNu(o.TN), p.netOut, 'Выброс'); o.err = o.err.concat(o.netOut.err); o.dPout = o.netOut.P;
  }
  o.Pvf = p.endExhaust ? 0.5 * o.roN * p.vOut * p.vOut : 0;                  /* (90): + 0,5·ρN·vf², vf ≥ 20 м/с */
  o.PsvW = o.PshN + o.dPout + o.Pvf;                                          /* в рабочих условиях (справочно) */
  o.Psv = 1.2 * o.PsvW / o.roN;                                               /* (89)/(90): приведённое к стандартным условиям */
  if (p.endExhaust && p.vOut < 20) o.warn.push('Скорость выброса ' + smkF(p.vOut) + ' м/с — меньше нормированных 20 м/с (МР п. 5.1.6).');
  o.vmax = Math.max.apply(null, [vkl].concat(rows.map(function (r) { return Math.max((r.ver && r.ver.v) || 0, (r.hor && r.hor.v) || 0); })));
}

/* ---------- ДПУ (СП 7 прил. Е) и компенсация ---------- */
function smkDpu(p, o) {
  var D = smkDe(p.dpuW / 1000, p.dpuB / 1000);
  o.dpuD = D; o.gamma = p.dpuType === 0 ? 1 : 0.5; o.d = p.dpuH - p.hNz;
  o.ro = 353 / o.Tsm;
  o.V1 = 4.16 * o.gamma * Math.pow(Math.max(o.d, 0), 2.5) * Math.sqrt(Math.max(o.Tsm - o.Tr, 0) / o.Tr);
  o.Nmin = o.V1 > 0 ? Math.ceil(o.G / (o.ro * o.V1) - 1e-9) : NaN;
  o.Lmin = 0.9 * Math.sqrt(o.V1);
  if (o.d < 2 * D) o.warn.push('d = ' + o.d.toFixed(2).replace('.', ',') + ' м меньше 2D = ' + (2 * D).toFixed(2).replace('.', ',') + ' м (прил. Е СП 7): ДПУ велико или стоит низко.');
  /* 1.27.0: МР 4.4 (65), (66): Ga = Gsm/(1 − n), −0,3 ≤ n ≤ 0,3; Gsm — расход из защищаемого помещения (не у вентилятора) */
  o.roComp = 353 / (p.tComp + 273); o.nDis = isFinite(+p.nDis) ? Math.max(-0.3, Math.min(0.3, +p.nDis)) : 0;
  o.GaMin = o.G / 1.3; o.GaMax = o.G / 0.7; o.Gac = o.G / (1 - o.nDis);
  o.LaMin = 3600 * o.GaMin / o.roComp; o.LaMax = 3600 * o.GaMax / o.roComp; o.La = 3600 * o.Gac / o.roComp;
}

/* ---------- 1.27.0: «Как уложиться» — подбор сечений, если скорость больше 11 м/с (МР п. 5.1.1) или давление больше предела проектировщика ----------
   Шахта и горизонтали: площадь под целевую скорость vt (10 → 9 → … м/с), стороны пропорционально, вверх до 50 мм; клапан — ближайший больший
   типоразмер с известным ζ (иначе — требуемое проходное сечение для подбора по паспорту). После каждого шага — полный пересчёт smkCalc. */
var SMK_VALVES = [[800, 300], [800, 400], [1350, 450], [1500, 800]];
function smkUp(a, b, F) { var s = Math.sqrt(F / (a * b)); if (s <= 1) return [a, b]; return [Math.ceil(a * s / 0.05 - 1e-9) * 0.05, Math.ceil(b * s / 0.05 - 1e-9) * 0.05]; }
function smkAdvise(p, o) {
  var lim = p.Plim > 0 ? p.Plim : 1000;
  if (!o || !(o.vmax > 11 || o.Psv > lim)) return null;
  var q = JSON.parse(JSON.stringify(p)), r = o, vt = [10, 9, 8, 7, 6, 5.5, 5, 4.5, 4], manualZ = q.segs.some(function (s) { return isFinite(s.zkl); }), why = [];
  if (o.vmax > 11) why.push('скорость до ' + smkF(o.vmax) + ' м/с > 11 м/с (МР п. 5.1.1)');
  if (o.Psv > lim) why.push('давление ' + Math.round(o.Psv) + ' Па > ' + lim + ' Па (СП 60.13330.2020 п. 9.8, 9.13)');
  for (var k = 0; k < vt.length && (r.vmax > 11 || r.Psv > lim); k++) {
    var G = Math.max.apply(null, r.rows.map(function (x) { return x.G; })), ro = Math.min.apply(null, r.rows.map(function (x) { return x.ro; }));
    var F = G / (ro * vt[k]), Fp = r.G / (353 / r.Tsm * vt[k]);
    q.segs.forEach(function (s, i) {
      var u = smkUp(s.vA, s.vB, F); s.vA = u[0]; s.vB = u[1];
      if (s.hL > 0) { var h = smkUp(s.hA, s.hB, F); s.hA = h[0]; s.hB = h[1]; }
      if (!manualZ && i < q.segs.length - 1 && smkPass(s.vw, s.vh) < Fp) { var c = SMK_VALVES.filter(function (x) { return smkPass(x[0], x[1]) >= Fp; })[0] || SMK_VALVES[SMK_VALVES.length - 1]; s.vw = c[0]; s.vh = c[1]; }
    });
    if (q.typ) { var s0 = q.segs[0]; ['vA', 'vB', 'hA', 'hB', 'vw', 'vh'].forEach(function (k2) { q.typ[k2] = s0[k2]; }); }
    r = smkCalc(q, true);
    if (r.err && r.err.length) break;
  }
  var s0 = p.segs[0], s1 = q.segs[0];
  return { why: why, q: q, r: r, ok: !(r.vmax > 11 || r.Psv > lim), lim: lim, Fp: r.G / (353 / r.Tsm * 11),
    shaft: [s0.vA, s0.vB, s1.vA, s1.vB], hor: [s0.hA, s0.hB, s1.hA, s1.hB], valve: [s0.vw, s0.vh, s1.vw, s1.vh], manualZ: manualZ, valveShort: smkPass(s1.vw, s1.vh) < r.G / (353 / r.Tsm * 11) };
}
function smkCalc(p, noAdv) {
  var o = { err: [], warn: [], variant: p.variant };
  var v = +p.variant;
  if (v === 0) smkCorridor(p, o);
  else if (v === 1) smkMall(p, o);
  else if (v === 2) smkHall(p, o);
  else if (v === 3) smkGallery(p, o);
  else if (v === 4) smkPark(p, o);
  else { o.err.push('Неизвестный вариант ' + p.variant + '.'); return o; }
  if (o.err.length || !(o.G > 0)) return o;
  o.L = o.G / (353 / o.Tsm) * 3600;
  if (!p.segs.length) { o.err.push('Нет участков сети.'); return o; }
  smkNet(p, o); smkDpu(p, o);
  if (o.vmax > 11) o.warn.push('Скорость в сети до ' + o.vmax.toFixed(1).replace('.', ',') + ' м/с — больше 11 м/с (МР ВНИИПО п. 5.1.1): увеличь сечения — см. «Как уложиться».');
  var lim = p.Plim > 0 ? p.Plim : 1000;
  if (o.Psv > lim && !(p.exempt98 && lim === 1000)) o.warn.push('Давление вентилятора ' + Math.round(o.Psv) + ' Па (приведённое к 20 °C) — больше ' + lim + ' Па: СП 60.13330.2020 п. 9.8 — не более 1000 Па; п. 9.13 — сеть сопротивлением больше 1000 Па без обоснования не допускается, высотные здания — зонировать по высоте. Увеличь сечения — см. «Как уложиться».');
  if (!noAdv) o.adv = smkAdvise(p, o);
  return o;
}
if (typeof module !== 'undefined') module.exports = { smkSklT: smkSklT, smkIni: smkIni, smkFromIni: smkFromIni, smkCalc: smkCalc, smkLam: smkLam, smkPass: smkPass };
