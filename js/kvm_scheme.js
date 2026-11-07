/* 1.23.9: «Схема системы» — плоская принципиальная схема для листа Word (инженер: «на одном листе хорошо видная схема, на другом 3D»).
   Строго по расчёту (числа — из o.rows и сети по участкам), без додумок; условная, не чертёж. Чёрно-белая — под печать.
   Дымоудаление: шахта, клапаны по этажам (открыт — на этаже пожара), вентилятор, выброс; против этажа — G, P, v участка.
   Подпор (клетка, шахта, тамбур-шлюз): объём или канал по этажам, вентилятор, сеть от воздухозабора по участкам; против этажа — P и перепад на дверях. */
function schF(v, n) { return isFinite(v) ? dpuFmt(v, n === undefined ? 1 : n) : '—'; }
function schT(x, y, s, o) {
  o = o || {};
  return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + (o.fs || 11) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + (o.b ? ' font-weight="bold"' : '') + (o.c ? ' fill="' + o.c + '"' : '') + '>' + s + '</text>';
}
function schFan(x, y, lbl) {
  return '<circle cx="' + x + '" cy="' + y + '" r="16" fill="#fff" stroke="#000" stroke-width="1.6"/><path d="M' + (x - 9) + ' ' + (y + 7) + 'L' + (x + 9) + ' ' + y + 'L' + (x - 9) + ' ' + (y - 7) + 'Z" fill="none" stroke="#000" stroke-width="1.2"/>' +
    (lbl ? schT(x - 24, y - 4, lbl[0], { b: 1, fs: 12, a: 'end' }) + schT(x - 24, y + 11, lbl[1], { fs: 11, a: 'end' }) : '');
}
function schValve(x, y, open) { /* клапан: прямоугольник; закрыт — с диагональю */
  return '<rect x="' + (x - 9) + '" y="' + (y - 6) + '" width="18" height="12" fill="#fff" stroke="#000" stroke-width="1.3"/>' + (open ? '<path d="M' + (x - 9) + ' ' + y + 'H' + (x + 9) + '" stroke="#000" stroke-width="1"/>' : '<path d="M' + (x - 9) + ' ' + (y + 6) + 'L' + (x + 9) + ' ' + (y - 6) + '" stroke="#000" stroke-width="1"/>');
}
/* сеть по участкам — цепочка слева направо: воздухозабор → участки → вход в шахту */
function schNet(r, x0, x1, y, title) {
  if (!r || !r.rows || !r.rows.length) return '';
  var n = r.rows.length, w = (x1 - x0) / n, h = schT(x0, y - 30, title, { b: 1, fs: 11 });
  r.rows.forEach(function (s, i) {
    var a = x0 + i * w, b = a + w;
    h += '<path d="M' + a.toFixed(1) + ' ' + y + 'H' + b.toFixed(1) + '" stroke="#000" stroke-width="' + (s.crit ? 3 : 2) + '"/>' +
      '<path d="M' + b.toFixed(1) + ' ' + (y - 4) + 'V' + (y + 4) + '" stroke="#000" stroke-width="1"/>' +
      schT(a + w / 2, y - 7, 'уч. ' + s.i + (r.branched ? ' (от ' + (s.up || 'вент.') + ')' : ''), { a: 'middle', fs: 10, b: 1 }) +
      schT(a + w / 2, y + 15, (s.rect ? schF(s.a, 0) + '×' + schF(s.b, 0) : '⌀' + schF(s.a, 0)) + ', l ' + schF(s.len, 1), { a: 'middle', fs: 9.5 }) +
      schT(a + w / 2, y + 27, 'v ' + schF(s.v, 1) + ' · ΔP ' + schF(s.P, 1), { a: 'middle', fs: 9.5 });
  });
  return h + schT(x1 - 6, y + 41, 'ΔP сети ' + schF(r.P, 1) + ' Па' + (r.add ? ' (с надбавкой ' + schF(r.add, 0) + ' %)' : ''), { a: 'end', fs: 10, b: 1 });
}
function pdvScheme(mode, p, o) {
  if (!o || !isFinite(o.Lv) || !o.rows || !o.rows.length) return '';
  var W = 680, H = 960, top = 215, bot = 900, NY = 92, FY = 160, sx = 300, h = '', N = o.rows.length, fs = N > 30 ? 8.5 : N > 20 ? 9.5 : 10.5;
  var dy = (bot - top) / N, yOf = function (k) { return bot - (k + 0.5) * dy; };
  var kind = { smk: 'вытяжная противодымная вентиляция (ДВ)', stair: 'подпор воздуха в лестничную клетку (ДП)', lift: 'подпор воздуха в лифтовую шахту (ДП)', tamb: 'подпор воздуха в тамбур-шлюз / зону безопасности (ДП)' }[mode];
  h += schT(W / 2, 22, 'Схема системы ' + esc(p.system || '') + ' — ' + kind, { a: 'middle', b: 1, fs: 14 });
  h += schT(W / 2, 40, 'Условная схема по расчёту; числа — из таблиц расчёта. Не чертёж.', { a: 'middle', fs: 10, c: '#444' });
  /* перекрытия и подписи этажей */
  for (var k = 0; k <= N; k++) h += '<path d="M40 ' + (bot - k * dy).toFixed(1) + 'H' + (W - 20) + '" stroke="#bbb" stroke-width=".6"/>';
  var head = mode === 'smk' ? ['G, кг/с', 'P, Па', 'v, м/с'] : mode === 'tamb' ? ['P, Па', 'ΔPкл, Па', 'G, кг/с'] : mode === 'stair' ? ['P, Па', 'ΔPдв, Па', 'G, кг/с'] : ['P, Па', 'ΔPдв, Па', 'ΔG, кг/с'];
  var cx = [470, 545, 620];
  head.forEach(function (t, j) { h += schT(cx[j], top - 8, t, { a: 'middle', b: 1, fs: 10.5 }); });
  h += schT(44, top - 8, 'Этаж', { b: 1, fs: 10.5 });
  o.rows.forEach(function (r, k) {
    var y = yOf(k), lab = mode === 'tamb' ? r.n : r.i;
    h += schT(44, y + 4, String(lab) + (mode === 'smk' && r.open ? ' — пожар' : ''), { fs: fs, b: mode === 'smk' && r.open });
    var vals = mode === 'smk' ? [schF(r.G, 3), schF(r.P, 1), schF(r.ver && r.ver.v, 1)] :
      mode === 'tamb' ? [schF(r.P, 1), schF(r.dPk, 1), schF(r.G, 3)] :
      mode === 'stair' ? [schF(r.P, 1), schF(r.dPd, 1), schF(r.G, 3)] : [schF(r.P, 1), schF(r.dPd, 1), r.i === 1 ? schF(o.G1, 3) : schF(r.dG, 4)];
    vals.forEach(function (v, j) { h += schT(cx[j], y + 4, v, { a: 'middle', fs: fs }); });
  });
  var yTop = bot - N * dy;
  if (mode === 'smk') {
    h += '<rect x="' + (sx - 10) + '" y="' + (FY + 16) + '" width="20" height="' + (bot - FY - 16) + '" fill="none" stroke="#000" stroke-width="1.6"/>';
    o.rows.forEach(function (r, k) {
      var y = yOf(k); if (r.last) return;
      h += '<path d="M' + (sx - 10) + ' ' + y.toFixed(1) + 'H' + (sx - 120) + '" stroke="#000" stroke-width="1.6"/>' + schValve(sx - 70, y, r.open);
      if (r.open) h += schT(sx - 125, y - 9, 'дым ' + schF(o.G, 2) + ' кг/с', { a: 'end', fs: 10, b: 1 }) + '<path d="M' + (sx - 118) + ' ' + y.toFixed(1) + 'l10 -4v8z"/>';
    });
    h += schFan(sx, FY, ['Вентилятор ДВ: ' + schF(o.Lv, 0) + ' м³/ч', 'P ' + schF(o.Psv, 0) + ' Па, t ' + schF(o.tFan, 0) + ' °C']);
    if (o.netOut && o.netOut.rows.length) h += '<path d="M' + sx + ' ' + (FY - 16) + 'V' + NY + '" stroke="#000" stroke-width="2"/>' + schNet(o.netOut, sx, W - 30, NY, 'Сеть от вентилятора до выброса');
    else h += '<path d="M' + sx + ' ' + (FY - 16) + 'V' + (FY - 40) + '" stroke="#000" stroke-width="2"/>' + schT(sx + 8, FY - 44, p.endExhaust ? 'выброс на фасад' : 'выброс на кровлю', { fs: 10 });
  } else {
    var vol = mode === 'stair' ? 'лестничная клетка' : mode === 'lift' ? 'лифтовая шахта' : 'канал подпора';
    h += '<rect x="' + (sx - (mode === 'tamb' ? 10 : 40)) + '" y="' + yTop.toFixed(1) + '" width="' + (mode === 'tamb' ? 20 : 80) + '" height="' + (bot - yTop).toFixed(1) + '" fill="none" stroke="#000" stroke-width="1.6"/>';
    h += schT(sx, bot + 18, vol, { a: 'middle', fs: 10.5, b: 1 });
    o.rows.forEach(function (r, k) {
      var y = yOf(k);
      if (mode === 'tamb') h += '<path d="M' + (sx - 10) + ' ' + y.toFixed(1) + 'H' + (sx - 90) + '" stroke="#000" stroke-width="1.4"/>' + schValve(sx - 50, y, false);
      else h += '<path d="M' + (sx - 40) + ' ' + (y - 9).toFixed(1) + 'v18" stroke="#fff" stroke-width="3"/><path d="M' + (sx - 46) + ' ' + (y - 9).toFixed(1) + 'h12M' + (sx - 46) + ' ' + (y + 9).toFixed(1) + 'h12" stroke="#000" stroke-width="1"/>';
    });
    h += '<path d="M' + sx + ' ' + yTop.toFixed(1) + 'V' + (FY + 16) + '" stroke="#000" stroke-width="2"/>';
    h += schFan(sx, FY, ['Вентилятор ДП: ' + schF(o.Lv, 0) + ' м³/ч', 'P ' + schF(o.Psv, 0) + ' Па, наружный ' + schF(p.air && p.air.ta, 0) + ' °C']);
    if (o.net && o.net.rows.length) h += '<path d="M' + (W - 30) + ' ' + NY + 'V' + FY + 'H' + (sx + 16) + '" fill="none" stroke="#000" stroke-width="2"/>' + schT(60, NY + 54, '← воздухозабор', { fs: 9.5 }) + schNet(o.net, 60, W - 30, NY, 'Сеть от воздухозабора до ' + vol.replace('лестничная клетка', 'лестничной клетки').replace('лифтовая шахта', 'лифтовой шахты').replace('канал подпора', 'канала'));
  }
  h += schT(40, H - 22, mode === 'smk' ? 'Обозначения: ▭ с диагональю — клапан закрыт, без — открыт (этаж пожара); P — давление в шахте относительно этажа.' : mode === 'tamb' ? 'Обозначения: ▭ с диагональю — клапан закрыт; ΔPкл — перепад на клапане этажа.' : 'P — давление в объёме на уровне этажа, ΔPдв — перепад на закрытых дверях.', { fs: 9.5, c: '#333' });
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" font-family="Times New Roman, serif"><rect width="100%" height="100%" fill="#fff"/>' + h + '</svg>';
}
