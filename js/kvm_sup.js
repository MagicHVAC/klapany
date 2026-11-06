/* Расчёт систем приточной противодымной вентиляции — по схеме, совместимой с проектами «КВМ-Подпор» (.isrprj, «КВМ-Дым» 5.2).
   Методика: МР ВНИИПО к СП 7.13130.2013, разд. 4 (4.1 лестничные клетки, 4.2 лифтовые шахты), п. 5.2 (вентиляторы).
   Порядок расчёта и допущения повторяют отчёты «КВМ-Дым» 5.2 (сверено на отчётах инженера, 06.11.2026):
   T = t + 273,15; ρ = 353/T; ветер Pw = 0,25(Kww − Kw0)ρa·va²; воздуховоды — Кольбрук, ν воздуха по Сазерленду.
   Пока не сделаны: подземные части (4.1.4, 4.2.5), тамбур-шлюзы и зоны безопасности с вертикальным каналом. */
var SUP_G = 9.81;
function supRho(t) { return 353 / (t + 273.15); }
function supNu(t) { var T = t + 273.15, mu = 1.458e-6 * Math.pow(T, 1.5) / (T + 110.4); return mu / supRho(t); }
/* сеть от воздухозабора: круглый D или прямоугольный A×B (мм), длина, Σζ */
function supDuct(G, ro, t, d) {
  var a = d.a / 1000, b = d.b / 1000, F = d.rect ? a * b : Math.PI * a * a / 4, De = d.rect ? 2 * a * b / (a + b) : a;
  if (!(F > 0)) return { F: 0, De: 0, v: 0, Pd: 0, f: 0, dPf: 0, P: 0 };
  var v = G / ro / F, Pd = ro * v * v / 2, Re = v * De / supNu(t), f = smkLam(Re, d.eps / 1000, De);
  return { F: F, De: De, v: v, Pd: Pd, f: f, dPf: Pd * f / De, P: Pd * f / De * d.len + d.xi * Pd };
}
function supIni(text) { return smkIni(text); }
var supN = smkNum;
function supBase(d) {
  var A = d.Air || {}, n = supN;
  var o = { ta: n(A.AirTempO), tr: n(A.AirTempI), va: n(A.WindSpeed), kww: n(A.KWW), kw0: n(A.KW0) };
  o.roa = supRho(o.ta); o.ror = supRho(o.tr); o.ts = (o.ta + o.tr) / 2; o.ros = supRho(o.ts);
  o.Pw = 0.25 * (o.kww - o.kw0) * o.roa * o.va * o.va;
  return o;
}
/* высота 1-го этажа в лестничном проекте хранится номером из списка: 3 → 2,7 м, 5 → 3,9 м (по отчётам); иначе — как число */
function supFloor1(v) { var x = supN(v); return (x === Math.round(x) && x >= 0 && x <= 10) ? { h: 0.9 + 0.6 * x, guess: true } : { h: x, guess: false }; }

/* ---------- 4.1 лестничная клетка (вариант SW-OG) ---------- */
function supStairFromIni(d) {
  var B = d.Building || {}, A = d.Air || {}, S = d.StairWell || {}, F = d.FanData || {}, T = d.Terms || {}, n = supN, f1 = supFloor1(B.Floor2L);
  return {
    name: (d.Project || {}).Name || '', system: (d.Project || {}).System || '', kind: 'stair',
    windows: n(T.Term1) === 1, outerExit: n(T.Term2) === 1, noFloor1: n(T.Term3) === 1, floorTamb: n(T.Term4) === 1,
    N: n(B.FloorQty), z1: n(B.SWN1z) || 1, z2: n(B.SWN2z) || n(B.FloorQty), h1: f1.h, h1Guess: f1.guess, hf: n(B.FloorH), p: n(B.SWQty) || 1,
    Gsm: n(A.GasMExps), Fs: n(S.ProjArea), xis: n(S.XIs), Fda: n(S.ODoorArea), hda: n(S.ODoorH), nd: n(S.ODoorSQty) || 1, xid: n(S.ODoorXid) || 2.44, xir: n(S.OTambXir),
    Fd: n(S.DoorwayArea), hd: n(S.DoorwayH), gasProof: n(S.DoorGasProof) === 1, Sd: n(S.DoorResist), Fw: n(S.WindowArea), winVar: n(S.WinPenetVar), winVal: n(S.WinAirPenet),
    Pplus: n(F.Pplus) || 20, h0: n(F.H0s), duct: { a: n(F.PipeSizeA), b: n(F.PipeSizeB), rect: n(F.PipeIsRect) === 1, len: n(F.PipeLen), eps: n(F.PipeEpsilon) || 0.1, xi: n(F.PipeXi) }
  };
}
function supStair(d) {
  var p = d.kind ? d : supStairFromIni(d), o = supBase(d.kind ? { Air: d.air } : d), g = SUP_G;
  if (p.air) { o = supBaseFrom(p.air); }
  o.p = p; o.err = []; o.warn = [];
  if (p.h1Guess) o.warn.push('Высота 1-го этажа в проекте задана номером из списка — принято ' + p.h1.toFixed(2).replace('.', ',') + ' м. Проверь.');
  var ros = o.ros, dro = ros - o.ror, Pw = o.Pw;
  o.Sd = p.Sd > 0 ? p.Sd : (p.gasProof ? 60000 : 5300) / ros;
  var elev = function (i) { return i <= 1 ? 0 : p.h1 + (i - 2) * p.hf; };
  var hc = function (i) { return elev(i) + p.hd / 2; };
  o.q = Math.max(p.p - 1, 1); o.GsF = p.Gsm / o.q;
  var start, rows = [];
  if (!p.noFloor1) {
    /* 4.1.2: ЛК сообщается с 1-м этажом одинарной дверью — (33), (34) */
    o.P1 = p.Pplus + Pw - 0.5 * g * p.hd * dro;
    o.Gsa = Math.sqrt(2 * ros * (p.Pplus + Pw + 0.5 * g * p.hda * (o.roa - ros)) / ((p.nd * p.xid + p.xir + 1) / (p.Fda * p.Fda)));
    start = 1;
  } else {
    /* 4.1.1: не сообщается с 1-м этажом — (23), (24) */
    o.P1 = p.Pplus + Pw - g * (elev(2) + 0.5 * p.hd) * dro;
    o.Gsa = p.outerExit ? Math.sqrt(2 * ros * (p.Pplus + Pw - g * (elev(2) + 0.5 * p.hd) * dro + 0.5 * g * p.hda * (o.roa - ros)) /
      ((p.nd * p.xid + p.xir + 1) / (p.Fda * p.Fda) + p.xis / (p.Fs * p.Fs))) : 0;
    start = 2;
  }
  o.Gs0 = Math.max(o.GsF, o.Gsa);
  var P = o.P1, G = o.Gs0, dpmax = 0, dPprev = 20;
  var winG = function (i, Ps) {
    if (!p.windows || !(p.Fw > 0)) return { gw: 0, G: 0 };
    var x = Ps + Pw + g * hc(i) * (o.roa - ros), gw;
    if (p.winVar === 1) gw = Math.pow(Math.max(x, 0) / 100, 2 / 3) * o.roa * p.winVal;        /* ΔQ100, м³/(ч·м²) */
    else if (p.winVar === 0) gw = Math.pow(Math.max(x, 0) / 10, 2 / 3) * p.winVal;             /* ΔG10, кг/(ч·м²) */
    else if (p.winVar === 2) gw = Math.pow(Math.max(x, 0) / 10, 2 / 3) / p.winVal;             /* R10 */
    else gw = Math.pow(Math.max(x, 0) / 100, 2 / 3) / (o.roa * p.winVal);                     /* R100 */
    return { gw: gw, G: gw * p.Fw / 3600 };
  };
  rows.push({ i: start, h: hc(start), P: P, dPd: 20, dG: 0, G: G });
  for (var i = start; i < p.N; i++) {
    var v = G / (ros * p.Fs), dPs = 0.5 * p.xis * ros * v * v;
    rows[rows.length - 1].v = v; rows[rows.length - 1].dPs = dPs;
    P += dPs;
    /* так в отчётах «КВМ-Дым»: утечка через дверь (i+1)-го этажа — по перепаду на двери этажа ниже */
    var dPd = P - Pw + g * hc(i + 1) * dro, gd = p.floorTamb ? 0 : p.Fd / Math.sqrt(o.Sd) * Math.sqrt(Math.max(dPprev, 0)), w = winG(i + 1, P);
    G += gd + w.G; if (dPd > dpmax) dpmax = dPd; dPprev = dPd;
    rows.push({ i: i + 1, h: hc(i + 1), P: P, dPd: dPd, dG: gd, dGw: w.G, Gw: w.gw, G: G });
  }
  var vN = G / (ros * p.Fs), dPN = 0.5 * p.xis * ros * vN * vN;
  rows[rows.length - 1].v = vN; rows[rows.length - 1].dPs = dPN;
  o.rows = rows; o.Gs = G; o.Ps = P + dPN; o.dpmax = dpmax;
  o.hsN = p.N * p.hf;
  o.duct = supDuct(G, o.roa, o.ta, p.duct);
  o.Lv = 3600 * G / o.roa;
  o.Psv = o.Ps + g * o.hsN * (o.roa - ros) + g * p.h0 * (o.roa - o.ror) + o.duct.P;
  if (dpmax > 150) o.warn.push('Перепад на закрытых дверях до ' + dpmax.toFixed(0).replace('.', ',') + ' Па — больше 150 Па (СП 7 п. 7.16 б): рассечка или распределённая подача.');
  return o;
}
function supBaseFrom(a) {
  var o = { ta: a.ta, tr: a.tr, va: a.va, kww: a.kww, kw0: a.kw0 };
  o.roa = supRho(o.ta); o.ror = supRho(o.tr); o.ts = (o.ta + o.tr) / 2; o.ros = supRho(o.ts);
  o.Pw = 0.25 * (o.kww - o.kw0) * o.roa * o.va * o.va; return o;
}

/* ---------- 4.2 лифтовая шахта (вариант LIFT), надземная часть ---------- */
function supLiftFromIni(d) {
  var B = d.Building || {}, S = d.Shaft || {}, F = d.FanData || {}, T = d.Terms || {}, n = supN;
  return {
    name: (d.Project || {}).Name || '', system: (d.Project || {}).System || '', kind: 'lift',
    outer: n(T.Term2) === 1, hall1: n(T.Term3) === 1, hallUp: n(T.Term4) === 1, hallUG: n(T.Term5) === 1, method: n(T.LMethod),
    N: n(B.OGFloorQty), h2: n(B.Floor2L), hf: n(B.OGFloorH), NUG: n(B.UGFloorQty), hUG: n(B.UGFloorH),
    Fdl: n(S.LShaftDoorA), Fdr: n(S.LHallDoorA), hdl: n(S.LShaftDoorH), nc: n(S.LCageQty) || 1, m: n(S.LHallDoorQty) || 1, xil: n(S.LCageXil), xid: n(S.LHallDoorXid) || 2.44,
    Fk: n(S.LCageA), Fls: n(S.LShaftA), Sdl: n(S.LShaftDoorSR), Sdr: n(S.LHallDoorSR),
    muGap: n(S.LMuGap) || 0.65,
    Pplus: n(F.LPplus) || 20, h0: n(F.H0s), duct: { a: n(F.PipeSizeA), b: n(F.PipeSizeB), rect: n(F.PipeIsRect) === 1, len: n(F.PipeLen), eps: n(F.PipeEpsilon) || 0.1, xi: n(F.PipeXi) }
  };
}
function supLift(d) {
  var p = d.kind ? d : supLiftFromIni(d), o = d.kind ? supBaseFrom(p.air) : supBase(d), g = SUP_G;
  o.p = p; o.err = []; o.warn = [];
  if (p.NUG > 0 && p.method !== 1) o.warn.push('Подземная часть шахты (' + p.NUG + ' эт.) пока не считается — только надземная.');
  var rol = o.ros, dro = rol - o.ror, Pw = p.outer ? o.Pw : 0;
  o.rol = rol; o.Sdl = p.Sdl > 0 ? p.Sdl : 2600 / rol; o.Sdr = p.Sdr > 0 ? p.Sdr : 5300 / rol;
  o.Slr = o.Sdl / Math.pow(p.nc * p.Fdl, 2) + (p.hallUp ? o.Sdr / Math.pow(p.m * p.Fdr, 2) : 0);
  o.xil = p.xil > 0 ? p.xil : 4.3 + p.Fk / p.Fls;
  o.P1 = p.Pplus - g * (p.h2 + 0.5 * p.hdl) * dro + 0.5 * g * p.hdl * (o.roa - rol) + Pw;
  var den = o.xil / Math.pow(p.nc * p.Fdl, 2) + (p.hall1 ? (p.xid + 1) / Math.pow(p.m * p.Fdr, 2) : 0);
  o.G1 = Math.sqrt(2 * rol * Math.max(o.P1, 0) / den);
  o.Pl = Pw + p.Pplus - g * (p.h2 + 0.5 * p.hdl) * dro;
  /* LMethod = 1 («приток только сверху»): высоты от нижнего подземного этажа, давление по (55) + потери в зазоре кабина–шахта */
  var base = 0;
  if (p.method === 1) {
    base = p.NUG > 0 ? -p.NUG * p.hUG : 0;
    if (p.NUG > 0) o.Pl = p.Pplus - g * 0.5 * p.hdl * dro;
    o.vcs = o.G1 / rol / p.muGap / (p.Fls - p.Fk); o.dPcs = 0.5 * rol * o.vcs * o.vcs; o.PlRef = o.Pl; o.Pl = o.Pl + o.dPcs;
  }
  var rows = [{ i: 1, h: 0, P: o.P1, dPd: NaN, dG: 0 }], sum = 0, elev = function (i) { return p.h2 + (i - 2) * p.hf; };
  for (var i = 2; i <= p.N; i++) {
    var dPd = o.Pl + g * (elev(i) - base + 0.5 * p.hdl) * dro - Pw, dG = Math.sqrt(Math.max(dPd, 0) / o.Slr);
    sum += dG; rows.push({ i: i, h: elev(i), P: o.Pl, dPd: dPd, dG: dG });
  }
  o.rows = rows; o.leak = sum; o.Gl = o.G1 + sum;
  o.hl = p.h2 + (p.N - 1) * p.hf - base;
  o.duct = supDuct(o.Gl, o.roa, o.ta, p.duct);
  o.Lv = 3600 * o.Gl / o.roa;
  /* так в отчётах «КВМ-Дым»: без слагаемого g·hlN·(ρa − ρl) из формулы (96) МР — его показываем отдельно */
  o.gH = g * o.hl * (o.roa - rol);
  o.PsvMR = o.Pl + o.gH + g * p.h0 * (o.roa - o.ror) + o.duct.P;
  o.Psv = p.method === 1 ? o.PsvMR : o.PsvMR - o.gH;
  if (p.method !== 1) o.warn.push('Давление вентилятора — как в «КВМ-Дым» (без g·hlN·(ρa − ρl) = ' + o.gH.toFixed(1).replace('.', ',') + ' Па). По формуле (96) МР ВНИИПО — ' + o.PsvMR.toFixed(0).replace('.', ',') + ' Па.');
  return o;
}
function supCalcIni(text) {
  var d = smkIni(text), v = ((d.Project || {}).Variant || '').trim();
  if (v === 'SW-OG') return supStair(d);
  if (v === 'LIFT') return supLift(d);
  return { err: ['Вариант «' + v + '» пока не поддержан: есть лестничная клетка (SW-OG) и лифтовая шахта (LIFT).'], warn: [] };
}
if (typeof module !== 'undefined') module.exports = { supCalcIni: supCalcIni, supStair: supStair, supLift: supLift };
