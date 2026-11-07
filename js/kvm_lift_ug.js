/* 1.27.x: лифтовая шахта подземной части — МР ВНИИПО к СП 7.13130.2013, п. 4.2.5, формулы (55)–(58); вентилятор (95), (96).
   П. 4.2.6: шахта, сообщающаяся с подземной и надземной частью, — раздельная подача в верхнюю и нижнюю части;
   надземная — (43)–(54) (supLift), подземная — (55)–(58) (здесь); расход через открытые двери основного посадочного этажа
   делится между системами в произвольном соотношении (доля нижней системы — p.ugShare, 0…1).
   Отметки: пол 1-го (основного посадочного) этажа = 0, h-i = −i·hUG, h-n = −n·hUG.
   (55) Pl-n = 20 + g(h-n − (h-n + 0,5hdl-n))(ρl − ρr);
   (56) Gl1 = {2ρl/[ξl/(nFdl)² + (ξd + 1)/(mFdr)²]·[20 − 0,5ghdl-n(ρl − ρr) + 0,25(kww − kw0)ρa·va² − g(h-n − 0,5hdl1)(ρa − ρl)]}^1/2;
   (57) Pl-i = Pl-n;  (58) Gl = Gl1 + Σ[(Pl-i + g(h-n − (h-i + 0,5hdl-i))(ρl − ρr))/Slr-i]^1/2, Slr-i по (46).
   (96) Psv = 1,2·(PlN + g·hlN·(ρa − ρl) + g·h0l·(ρa − ρr) + Pdl)/ρa, hlN — между уровнями нижнего и верхнего этажей части. */
function supLiftUG(p, o) {
  var g = SUP_G, n = Math.max(1, Math.round(p.NUG || 1)), hu = p.hUG, hd = p.hdl, rol = o.rol, ror = o.ror, roa = o.roa;
  var r = { err: [], warn: [] }, hn = -n * hu;
  if (!(hu > 0)) { r.err.push('Подземная часть шахты: задай высоту подземных этажей.'); return r; }
  if (!p.hallUG) r.warn.push('П. 4.2.5 МР — для шахт с выгороженными лифтовыми холлами на каждом подземном этаже. Без холлов формул в МР нет: утечки посчитаны только через двери шахты.');
  r.Slr = o.Sdl / Math.pow(p.nc * p.Fdl, 2) + (p.hallUG ? o.Sdr / Math.pow(p.m * p.Fdr, 2) : 0);
  r.Pl = 20 + g * (hn - (hn + 0.5 * hd)) * (rol - ror);                                                     /* (55) */
  var den = o.xil / Math.pow(p.nc * p.Fdl, 2) + (p.xid + 1) / Math.pow(p.m * p.Fdr, 2);
  var br = 20 - 0.5 * g * hd * (rol - ror) + o.Pw - g * (hn - 0.5 * hd) * (roa - rol);                       /* (56): ветер — как напечатано, без условия */
  if (!(br > 0)) { r.err.push('В формуле (56) под корнем ≤ 0 — проверь температуры и глубину.'); r.G1 = 0; } else r.G1 = Math.sqrt(2 * rol * br / den);
  r.share = p.ugShare >= 0 && p.ugShare <= 1 ? p.ugShare : 1;
  r.G1u = r.G1 * r.share;
  var rows = [], sum = 0;
  for (var i = 1; i <= n; i++) {
    var dPd = r.Pl + g * (hn - (-i * hu + 0.5 * hd)) * (rol - ror), dG = Math.sqrt(Math.max(dPd, 0) / r.Slr);   /* (57), (58) */
    sum += dG; rows.push({ i: -i, h: -i * hu, P: r.Pl, dPd: dPd, dG: dG });
  }
  r.rows = rows; r.leak = sum; r.Gl = r.G1u + sum;
  r.hl = n * hu;                                                                                            /* от пола −n до основного посадочного */
  var q = { net: p.netUG, duct: p.ductUG || p.duct };
  var oo = { err: [] }; r.duct = supNet(r.Gl, roa, o.ta, q, oo); r.err = r.err.concat(oo.err); if (oo.net) r.net = oo.net;
  r.h0 = p.h0UG > 0 || p.h0UG === 0 ? p.h0UG : p.h0;
  r.Lv = 3600 * r.Gl / roa;                                                                                 /* (95) */
  r.PsvW = r.Pl + g * r.hl * (roa - rol) + g * r.h0 * (roa - ror) + r.duct.P;
  r.Psv = 1.2 * r.PsvW / roa;                                                                               /* (96) */
  var bad = rows.filter(function (x) { return x.dPd < 20; }).length;
  if (bad) r.warn.push('Подземная часть шахты: перепад на закрытых дверях меньше 20 Па на ' + bad + ' эт.');
  if (rows.some(function (x) { return x.dPd > 150; })) r.warn.push('Подземная часть шахты: перепад на закрытых дверях больше 150 Па (СП 7 п. 7.16 б).');
  if (r.share < 1) r.warn.push('П. 4.2.6: расход через двери основного посадочного этажа поделён — нижней системе ' + Math.round(r.share * 100) + ' %, остальное — надземной.');
  return r;
}
