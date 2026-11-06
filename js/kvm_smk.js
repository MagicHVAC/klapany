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
/* Кольбрук: 1/√λ = −2·lg(ε/(3,7D) + 2,51/(Re·√λ)) */
function smkLam(Re, eps, D) {
  if (!(Re > 0)) return 0;
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
}
function smkHall(p, o) {
  /* МР 3.1, 3.1.1: зал, стационарно (12) — Gsm = Gk при h = hsm */
  o.Tr = p.tr + 273; o.Ff = p.Ff; o.V = p.Ff * p.H; o.Asm = p.Ff; o.lsm = 2 * (p.L + p.W);
  o.Fo = p.Fo; o.Qf = p.eta * p.Q * 1000 * p.psi * p.Fo; o.Rsafe = Math.sqrt(o.Qf / (4 * Math.PI * 10));
  o.hsm = p.H - p.hNz; var z = p.hNz, Qr = p.r * o.Qf;
  o.Zf = 0.166 * Math.pow(Qr, 0.4);
  o.f = o.Zf > z ? 8 : 7;
  o.Gk = o.f === 8 ? 0.032 * Math.pow(Qr, 0.6) * z : 0.071 * Math.pow(Qr, 1 / 3) * Math.pow(z, 5 / 3) + 0.0018 * Qr;
  var Tk = o.Tr + 100, Ts = o.Tr + 50;
  for (var i = 0; i < 60; i++) {
    var cpk = smkCp(Tk); Tk = o.Tr + Qr / (cpk * o.Gk);
    var a = 0.01163 * Math.exp(0.0023 * (Ts - 273)), S = o.hsm * o.lsm + o.Asm, cs = smkCp(Ts);
    Ts = o.Tr + cs * Qr / (smkCp(Tk) * a * S) * (1 - Math.exp(-a * S / (cs * o.Gk)));
  }
  o.Tk = Tk; o.Tsm = Ts; o.alpha = 0.01163 * Math.exp(0.0023 * (Ts - 273)); o.cpk = smkCp(Tk); o.cps = smkCp(Ts);
  o.G = o.Gk;
}

/* ---------- сеть: участки снизу вверх, 1-й — этаж пожара (клапан открыт), последний — только вертикаль ---------- */
function smkNet(p, o) {
  var g = SMK_G, TB = o.Tr, roB = 353 / TB, G0 = o.G, Ts = o.Tsm, Ga = 0, rows = [], N = p.segs.length;
  var leak = function (S, P) { return roB / 3600 * S * 0.032 * Math.pow(Math.max(P, 0), 0.65); };
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
  /* участок 1: давление, подсосы и трение связаны — несколько приближений */
  var m = mix(), h = { dp: 0 }, vf, P, gH, gV, last = N === 1;
  for (var it = 0; it < 8; it++) {
    /* так в отчётах «КВМ-Дым»: без горизонтального участка тяга на 1-м участке не учитывается (P = −ΔPкл) */
    P = -dPkl - h.dp + (s0.hL > 0 ? g * s0.vL * (roB - m.ro) : 0);
    gH = last ? 0 : leak(2 * (s0.hA + s0.hB) * s0.hL, (Math.abs(dPkl) + Math.abs(P)) / 2);
    gV = leak(2 * (s0.vA + s0.vB) * s0.vL, (Math.abs(dPkl) + Math.abs(h.dp) + Math.abs(P)) / 2);
    Ga = gH + gV; m = mix();
    h = last ? { dp: 0 } : fr(m.G, m.ro, m.T, s0.hA, s0.hB, s0.hL, s0.hZ);
  }
  vf = fr(m.G, m.ro, m.T, s0.vA, s0.vB, s0.vL, s0.vZ);
  rows.push({ i: 1, P: P, gKl: 0, gH: gH, gV: gV, Ga: Ga, G: m.G, T: m.T, ro: m.ro, hor: h, ver: vf, open: true });
  var Pp = P, dPv = vf.dp, roP = m.ro;
  for (var i = 1; i < N; i++) {
    var s = p.segs[i], isLast = i === N - 1;
    P = Pp - dPv + g * s.vL * (roB - roP);
    var gK = isLast ? 0 : smkPass(s.vw, s.vh) * Math.sqrt(Math.abs(P) / p.Skl);
    var avg = (Math.abs(Pp) + Math.abs(P)) / 2;
    var gh = isLast ? 0 : leak(2 * (s.hA + s.hB) * s.hL, avg), gv = leak(2 * (s.vA + s.vB) * s.vL, avg);
    Ga += gK + gh + gv; m = mix();
    vf = fr(m.G, m.ro, m.T, s.vA, s.vB, s.vL, s.vZ);
    rows.push({ i: i + 1, P: P, gKl: gK, gH: gh, gV: gv, Ga: Ga, G: m.G, T: m.T, ro: m.ro, ver: vf, last: isLast });
    Pp = P; dPv = vf.dp; roP = m.ro;
  }
  o.rows = rows; o.PN = Pp; o.GN = m.G; o.TN = m.T; o.roN = m.ro; o.Ga = Ga;
  o.Lv = o.GN / o.roN * 3600; o.PshN = Math.abs(o.PN) + dPv; o.tFan = o.TN - 273;
  /* выброс на фасад: + сопротивление воздуховодов до выброса + 0,5·ρN·vf² (МР (90); так в отчётах «КВМ-Дым») */
  o.Pvf = p.endExhaust ? 0.5 * o.roN * p.vOut * p.vOut : 0;
  /* 1.23.0: сеть за вентилятором по участкам с КМС (kvm_kms.js) — вместо числа «сопротивление до выброса»; считается и при выбросе на кровлю */
  o.dPout = p.endExhaust ? p.ductRes : 0;
  if (p.netOut && p.netOut.secs && p.netOut.secs.length && window.kmsNet) {
    o.netOut = kmsNet(o.GN, o.roN, smkNu(o.TN), p.netOut, 'Выброс'); o.err = o.err.concat(o.netOut.err); o.dPout = o.netOut.P;
  }
  o.Psv = o.PshN + o.dPout + o.Pvf;
  o.vmax = Math.max.apply(null, [vkl].concat(rows.map(function (r) { return Math.max(r.ver.v || 0, (r.hor && r.hor.v) || 0); })));
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
  o.roComp = 353 / (p.tComp + 273); o.GaMin = o.GN / 1.3; o.GaMax = o.GN; o.LaMin = 3600 * o.GaMin / o.roComp; o.LaMax = 3600 * o.GaMax / o.roComp;
}
function smkCalc(p) {
  var o = { err: [], warn: [], variant: p.variant };
  if (p.variant === 0) smkCorridor(p, o);
  else if (p.variant === 2) smkHall(p, o);
  else { o.err.push('Вариант ' + p.variant + ' пока не поддержан — есть коридор (0) и зал (2).'); return o; }
  o.L = o.G / (353 / o.Tsm) * 3600;
  if (!p.segs.length) { o.err.push('Нет участков сети.'); return o; }
  smkNet(p, o); smkDpu(p, o);
  if (o.vmax > 11) o.warn.push('Скорость в сети до ' + o.vmax.toFixed(1).replace('.', ',') + ' м/с — больше 11 м/с (МР ВНИИПО п. 5.1.1).');
  return o;
}
if (typeof module !== 'undefined') module.exports = { smkIni: smkIni, smkFromIni: smkFromIni, smkCalc: smkCalc, smkLam: smkLam, smkPass: smkPass };
