/* 1.22.3: подпор в тамбур-шлюзы и зоны безопасности (МР ВНИИПО к СП 7.13130, раздел о тамбур-шлюзах; СП 7.13130 п. 7.14, 7.16, 7.17).
   Схема расчёта — как в отчётах инженера (сверено на 4: ПД10.2, ПД10.1, тамбур 0103.1, К25018 ПД5):
   — плотность притока ρsf: с подогревом 353/(tsf + 273,15), без — ρa; Sdsf = 5300/ρsf, Sdsl = 2600/ρsf;
   — давление в защищаемом помещении Psf = P+ − g·hd/2·(ρa − ρr) [+ 0,5·Kww·ρa·va² — переключатель «ветер на двери»];
   — расход: двери закрыты Gsf = n·Fd·(P+/Sdsf)^½ + m·Fdsl·(P+/Sdsl)^½; дверь открыта Gsf = vd·ρsf·Fd;
   — этаж пожара — нижний клапан, открыт: ΔPкл = ξкл·ρsf·vкл²/2; Pш = Psf + ΔPкл;
   — выше: утечка закрытого клапана Fкл·(ΔPкл ниже/Sкл)^½, через стенки (ρsf/3600)·Π·Δh·a·(ΔPкл ниже)^0,65 — сдвиг на этаж;
     Pш(k) = Pш(k−1) + λ·Δhкл(k)/Dэ·ρsf·v²/2 по полному расходу участка; ΔPкл(k) = Pш(k) − g·(hкл(k) − hэ пожара)·(ρr − ρsf);
   — вентилятор: Lv = 3600·Gs/ρa; Psv = Pш верх + PN + g·(h0s + hN)·(ρa − ρsf) + ΔPвв + ΔPtop, PN = g·hN·(ρa − ρsf) − Pw0.
   Слагаемое g·hN·(ρa − ρsf) входит и в PN, и отдельно — так в отчётах; при подогреве это даёт запас по давлению (в отчёте отмечено). */
function tbDef() {
  return { kind: 'tamb', name: 'Зона безопасности МГН', system: 'ПД10', heat: true, openDoor: false, windDoor: false,
    air: { ta: -13, tr: 18, va: 0, kww: 0.8, kw0: -0.6 }, tsf: 20, N: 14, NUG: 0, h2: 3.9, hf: 3.15, hUG: 3,
    nd: 2, Fd: 1.8, hd: 2.1, vd: 1.5, Pplus: 20, mFdsl: 17.64, Fkl: 0.48, xikl: 1.5, Skl: 30300, hkl1: 3.9,
    sh: { a: 800, b: 300, eps: 0.1, tight: 0.097 }, Htop: 42.6, h0: 3, duct: { D: 600, len: 11, xi: 2 } };
}
function tbCalc(p) {
  var o = { err: [], warn: [], rows: [] }, g = 9.81, A = p.air;
  var Ta = A.ta + 273.15, ra = 353 / Ta, rr = 353 / (A.tr + 273.15), rsf = p.heat ? 353 / (p.tsf + 273.15) : ra, tF = p.heat ? p.tsf : A.ta;
  o.roa = ra; o.ror = rr; o.rsf = rsf;
  o.Pw = 0.5 * (A.kww + A.kw0) * ra * A.va * A.va; o.Pw0 = 0.5 * A.kw0 * ra * A.va * A.va;
  o.Sdsf = 5300 / rsf; o.Sdsl = 2600 / rsf;
  var a = p.sh.a / 1000, b = p.sh.b / 1000, F = a * b, De = 2 * a * b / (a + b), Pm = 2 * (a + b), eps = p.sh.eps / 1000;
  o.F = F; o.De = De;
  if (!(F > 0) || !(p.Fkl > 0)) { o.err.push('Задай сечение канала и клапана.'); return o; }
  o.Psf = p.Pplus - g * 0.5 * p.hd * (ra - rr) + (p.windDoor ? 0.5 * A.kww * ra * A.va * A.va : 0);
  o.Gsf = p.openDoor ? p.vd * rsf * p.Fd : p.nd * p.Fd * Math.sqrt(p.Pplus / o.Sdsf) + (p.mFdsl > 0 ? p.mFdsl * Math.sqrt(p.Pplus / o.Sdsl) : 0);
  o.Lsf = 3600 * o.Gsf / ra;
  /* этажи снизу вверх: подземные, затем надземные; отметки пола и клапанов — как в отчётах */
  var fl = [], j, k;
  for (j = p.NUG; j >= 1; j--) fl.push({ n: -j, he: -j * p.hUG, hk: p.hkl1 - p.h2 - (j - 1) * p.hUG });
  for (k = 1; k <= p.N; k++) fl.push({ n: k, he: k === 1 ? 0 : p.h2 + (k - 2) * p.hf, hk: p.hkl1 + (k - 1) * p.hf });
  for (k = 0; k < fl.length; k++) fl[k].dh = k < fl.length - 1 ? fl[k + 1].hk - fl[k].hk : p.hf;
  var he0 = fl[0].he, nu = supNu(tF), lam = function (v, e) { return smkLam(v * De / nu, e, De); };
  o.vkl = o.Gsf / rsf / p.Fkl; o.dPkl = p.xikl * rsf * o.vkl * o.vkl / 2;
  var r0 = { n: fl[0].n, dh: fl[0].dh, he: fl[0].he, hk: fl[0].hk, P: o.Psf + o.dPkl, dPk: o.dPkl, gW: 0, gK: 0 };
  r0.gW = (rsf / 3600) * Pm * r0.dh * p.sh.tight * Math.pow(Math.max(r0.dPk, 0), 0.65); r0.G = o.Gsf + r0.gW; r0.v = r0.G / rsf / F;
  o.rows.push(r0);
  for (k = 1; k < fl.length; k++) {
    var pr = o.rows[k - 1], r = { n: fl[k].n, dh: fl[k].dh, he: fl[k].he, hk: fl[k].hk };
    r.gK = p.Fkl * Math.sqrt(Math.max(pr.dPk, 0) / p.Skl);
    r.gW = (rsf / 3600) * Pm * r.dh * p.sh.tight * Math.pow(Math.max(pr.dPk, 0), 0.65);
    r.G = pr.G + r.gK + r.gW; r.v = r.G / rsf / F; r.lam = lam(r.v, eps);
    r.P = pr.P + r.lam * r.dh / De * rsf * r.v * r.v / 2;
    r.dPk = r.P - g * (r.hk - he0) * (rr - rsf);
    o.rows.push(r);
  }
  var top = o.rows[o.rows.length - 1];
  o.Gs = top.G; o.vsh = top.v;
  o.lamTop = lam(o.vsh, 0.0001); o.dPtop = o.lamTop * p.Htop / De * ra * o.vsh * o.vsh / 2;
  o.hN = top.hk - fl[0].hk + top.dh;
  var Fd = Math.PI * Math.pow(p.duct.D / 1000, 2) / 4; o.vvv = o.Gs / (ra * Fd);
  o.lamVV = smkLam(o.vvv * (p.duct.D / 1000) / supNu(A.ta), 0.0001, p.duct.D / 1000);
  o.dPvv = (o.lamVV * p.duct.len / (p.duct.D / 1000) + p.duct.xi) * ra * o.vvv * o.vvv / 2;
  o.dro = ra - rsf; o.PN = g * o.hN * o.dro - o.Pw0;
  o.Lv = 3600 * o.Gs / ra;
  o.Psv = top.P + o.PN + g * (p.h0 + o.hN) * o.dro + o.dPvv + o.dPtop;
  o.Q = p.heat ? o.Gs * 1.005 * (p.tsf - A.ta) : 0;
  o.dpmax = Math.max.apply(null, o.rows.map(function (x) { return x.dPk; }));
  if (o.vsh > 11) o.warn.push('Скорость в канале ' + o.vsh.toFixed(1).replace('.', ',') + ' м/с — больше 11 м/с (МР ВНИИПО п. 5.1.1).');
  if (p.heat && o.dro > 0) o.warn.push('При подогреве слагаемое g·hN·(ρa − ρsf) = ' + (g * o.hN * o.dro).toFixed(1).replace('.', ',') + ' Па учтено и в PN, и отдельно — давление вентилятора с запасом.');
  return o;
}
