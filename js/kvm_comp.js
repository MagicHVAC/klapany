/* 1.21.7: сеть компенсирующей подачи (ДП) к системе дымоудаления — расход и сопротивление, давление вентилятора.
   Расход — наибольший из допустимых: Ga = GШ/1,0 (диапазон GШ/(1,3…1,0), раздел «Компенсирующая подача» отчёта),
   плюс утечки через закрытые НЗ клапаны остальных этажей: Fкл·(P/Sкл)^1/2 — та же формула, что для закрытых клапанов дымоудаления.
   Потери: трение по Кольбруку (supDuct, kvm_sup.js) + местные ζ·ρv²/2. Плотность — при tн зимой (как у расхода компенсации).
   Допущение (в запас): разрежение в помещении от работы дымоудаления не вычитается из давления вентилятора.
   Значения по умолчанию — пример, их меняет проектировщик (ζ клапана и решётки — по паспорту изделий). */
function compDef() {
  return { on: true, inZ: 2, mA: 800, mB: 500, mL: 10, mZ: 1.5, sA: 800, sB: 500, sL: 45, sZ: 0.5, vA: 800, vB: 500, vZ: 0.5, gF: 0.6, gZ: 2, nCl: 14 };
}
var KV_COMP = ['Компенсирующая подача: сеть (ДП)', [
  ['comp.on', 'Считать сеть компенсации', [[true, 'да — механическая подача'], [false, 'нет']]],
  ['comp.vA', 'НЗ клапан a, мм'], ['comp.vB', 'НЗ клапан b, мм'], ['comp.vZ', 'ζ открытого НЗ клапана', '', 'по паспорту; сечение (a − 50)·(b − 50)'],
  ['comp.gF', 'Решётка в помещении: живое сечение, м²'], ['comp.gZ', 'ζ решётки', '', 'по паспорту'],
  ['comp.nCl', 'Закрытых НЗ клапанов на шахте, шт.', '', 'остальные этажи — утечки']]];

function compCalc(p, o) {
  var c = p.comp; if (!c || !c.on || !isFinite(o.GaMax)) return;
  var ro = o.roComp, t = p.tComp, Fkl = Math.max(c.vA - 50, 1) * Math.max(c.vB - 50, 1) / 1e6, Skl = p.Skl > 0 ? p.Skl : smkSklT(t);
  var r = { ro: ro, Ga: o.Gac, Fkl: Fkl, gLeak: 0, Skl: Skl }, G = o.Gac;
  for (var i = 0; i < 4; i++) {
    r.G = G;
    if (p.compNet && p.compNet.secs && window.kmsNet) { /* 1.23.0: участки с КМС (kvm_kms.js) вместо «магистраль + шахта + ζ входа» */
      r.net = kmsNet(G, ro, supNu(t), p.compNet, 'Компенсация');
      r.mag = { P: r.net.P, Pd: r.net.Pd, v: r.net.v, f: r.net.f, dPf: 0 }; r.sh = { P: 0, v: r.net.v, f: r.net.f, dPf: 0 }; r.dPin = 0;
    } else {
      r.mag = supDuct(G, ro, t, { a: c.mA, b: c.mB, rect: true, len: c.mL, eps: 0.1, xi: c.mZ });
      r.sh = supDuct(G, ro, t, { a: c.sA, b: c.sB, rect: true, len: c.sL, eps: 0.1, xi: c.sZ });
      r.dPin = c.inZ * r.mag.Pd;
    }
    r.vkl = o.Gac / ro / Fkl; r.dPkl = c.vZ * ro * r.vkl * r.vkl / 2;
    r.vg = c.gF > 0 ? o.Gac / ro / c.gF : 0; r.dPg = c.gZ * ro * r.vg * r.vg / 2;
    r.Pcl = r.dPkl + r.dPg; /* давление в шахте у этажа пожара относительно помещений */
    r.gLeak = c.nCl * Fkl * Math.sqrt(Math.max(r.Pcl, 0) / Skl);
    G = o.Gac + r.gLeak;
  }
  r.Psv = r.dPin + r.mag.P + r.sh.P + r.dPkl + r.dPg;
  if (r.net) o.err = o.err.concat(r.net.err);
  r.Lv = 3600 * r.G / ro; r.La = 3600 * o.Gac / ro;
  o.comp = r;
  if (r.sh.v > 15) o.warn.push('Компенсация: скорость в шахте ' + r.sh.v.toFixed(1).replace('.', ',') + ' м/с — проверь сечение и шум.');
  if (r.vg > 6) o.warn.push('Компенсация: скорость в решётке ' + r.vg.toFixed(1).replace('.', ',') + ' м/с — проверь по паспорту решётки (потери и шум).');
}
function repComp(p, o) {
  var r = o.comp, c = p.comp, f = function (v, n) { return dpuFmt(v, n === undefined ? 2 : n); };
  var d = function (x, a, b, L, z) { return a + ' × ' + b + ' мм, L = ' + f(L, 1) + ' м, Σζ = ' + f(z, 2) + ': v = ' + f(x.v, 2) + ' м/с, λ = ' + f(x.f, 4) + ', R = ' + f(x.dPf, 3) + ' Па/м'; };
  return '<h3 class="rep-h">Сеть компенсирующей подачи</h3>' +
    '<p class="rep-p">Расход принят наибольшим: G<sub>a</sub> = G<sub>Ш</sub>/1,0. Потери: трение по Кольбруку и местные сопротивления ζ·ρ·v²/2, ρ при t<sub>н</sub> = ' + f(p.tComp, 0) + ' °C. Разрежение в помещении от дымоудаления в запас не учтено.</p>' +
    repF('Плотность воздуха', 'ρ<sub>a</sub> = 353/(t<sub>н</sub> + 273)', '353 / (' + f(p.tComp, 0) + ' + 273)', f(r.ro, 3) + ' кг/м³') +
    repF('Открытый НЗ клапан на этаже пожара', 'ΔP<sub>кл</sub> = ζ<sub>кл</sub>·ρ<sub>a</sub>·V<sub>кл</sub>²/2, F<sub>кл</sub> = (a − 50)·(b − 50)', 'F<sub>кл</sub> = ' + f(r.Fkl, 4) + ' м²; V<sub>кл</sub> = ' + f(r.vkl, 2) + ' м/с; ' + f(c.vZ, 2) + ' · ' + f(r.ro, 3) + ' · ' + f(r.vkl, 2) + '² / 2', f(r.dPkl, 2) + ' Па') +
    repF('Решётка в помещении', 'ΔP<sub>р</sub> = ζ<sub>р</sub>·ρ<sub>a</sub>·V<sub>р</sub>²/2', 'V<sub>р</sub> = ' + f(r.vg, 2) + ' м/с; ' + f(c.gZ, 2) + ' · ' + f(r.ro, 3) + ' · ' + f(r.vg, 2) + '² / 2', f(r.dPg, 2) + ' Па') +
    repF('Утечки через закрытые НЗ клапаны', 'ΔG = n·F<sub>кл</sub>·(P/S<sub>кл</sub>)<sup>1/2</sup>, P = ΔP<sub>кл</sub> + ΔP<sub>р</sub>', f(c.nCl, 0) + ' · ' + f(r.Fkl, 4) + ' · (' + f(r.Pcl, 2) + ' / ' + f(p.Skl, 0) + ')<sup>1/2</sup>', f(r.gLeak, 4) + ' кг/с') +
    repF('Расход вентилятора', 'G<sub>v</sub> = G<sub>a</sub> + ΔG; L<sub>v</sub> = 3600·G<sub>v</sub>/ρ<sub>a</sub>', f(r.Ga, 3) + ' + ' + f(r.gLeak, 4), f(r.G, 3) + ' кг/с; ' + f(r.Lv, 0) + ' м³/ч') +
    (r.net ? kmsRep(r.net, 'Сеть компенсирующей подачи от воздухозабора до клапана') +
      repF('Давление вентилятора', 'P<sub>v</sub> = ΔP<sub>сети</sub> + ΔP<sub>кл</sub> + ΔP<sub>р</sub>', f(r.mag.P, 2) + ' + ' + f(r.dPkl, 2) + ' + ' + f(r.dPg, 2), f(r.Psv, 2) + ' Па') :
    repF('Воздухозабор', 'ΔP<sub>вх</sub> = ζ<sub>вх</sub>·P<sub>d маг</sub>', f(c.inZ, 2) + ' · ' + f(r.mag.Pd, 2), f(r.dPin, 2) + ' Па') +
    repF('Магистраль', 'ΔP = R·L + Σζ·P<sub>d</sub>', d(r.mag, c.mA, c.mB, c.mL, c.mZ), f(r.mag.P, 2) + ' Па') +
    repF('Шахта', 'ΔP = R·L + Σζ·P<sub>d</sub>', d(r.sh, c.sA, c.sB, c.sL, c.sZ), f(r.sh.P, 2) + ' Па') +
    repF('Давление вентилятора', 'P<sub>v</sub> = ΔP<sub>вх</sub> + ΔP<sub>маг</sub> + ΔP<sub>ш</sub> + ΔP<sub>кл</sub> + ΔP<sub>р</sub>', f(r.dPin, 2) + ' + ' + f(r.mag.P, 2) + ' + ' + f(r.sh.P, 2) + ' + ' + f(r.dPkl, 2) + ' + ' + f(r.dPg, 2), f(r.Psv, 2) + ' Па'));
}
