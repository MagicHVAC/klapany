/* Объёмная (изометрическая) схема системы ПДВ по результатам расчёта — для экрана и для вставки в отчёт (PNG).
   Дымоудаление: здание этажами, шахта, этажные клапаны и воздуховоды, ДПУ, вентилятор; цвет — скорость (МР ВНИИПО п. 5.1.1: не больше 11 м/с, лучше 9–11).
   Подпор (лестница, лифт): клетка/шахта этажами, двери — цвет по перепаду давления (СП 7.13130 п. 7.16 б: 20…150 Па), вентилятор на кровле.
   Вход: pdv3d(mode, p, o) → SVG-строка; pdv3dPng(svg, cb) → data:image/png для отчёта. Не чертёж: пропорции условные, числа — из расчёта. */
var P3 = { cx: 0.866, sy: 0.5 };
function p3pt(x, y, z, s, ox, oy) { return [ox + (x - y) * P3.cx * s, oy + (x + y) * P3.sy * s - z * s]; }
function p3poly(pts) { return pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }
/* параллелепипед: 3 видимые грани (верх, правый бок, левый бок) */
function p3box(x, y, z, dx, dy, dz, col, s, ox, oy, op, stroke) {
  var P = function (a, b, c) { return p3pt(a, b, c, s, ox, oy); };
  var top = [P(x, y, z + dz), P(x + dx, y, z + dz), P(x + dx, y + dy, z + dz), P(x, y + dy, z + dz)];
  var rgt = [P(x + dx, y, z), P(x + dx, y + dy, z), P(x + dx, y + dy, z + dz), P(x + dx, y, z + dz)];
  var lft = [P(x, y + dy, z), P(x + dx, y + dy, z), P(x + dx, y + dy, z + dz), P(x, y + dy, z + dz)];
  var o = op == null ? 1 : op, st = stroke || 'rgba(0,0,0,.35)';
  return '<polygon points="' + p3poly(lft) + '" fill="' + p3shade(col, -0.18) + '" fill-opacity="' + o + '" stroke="' + st + '" stroke-width=".6"/>' +
    '<polygon points="' + p3poly(rgt) + '" fill="' + p3shade(col, -0.32) + '" fill-opacity="' + o + '" stroke="' + st + '" stroke-width=".6"/>' +
    '<polygon points="' + p3poly(top) + '" fill="' + col + '" fill-opacity="' + o + '" stroke="' + st + '" stroke-width=".6"/>';
}
function p3shade(hex, k) {
  var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, f = function (c) { return Math.max(0, Math.min(255, Math.round(c * (1 + k)))); };
  return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
}
/* цвет по скорости, м/с: ≤ 9 — зелёный, 9…11 — жёлтый (рекомендуемый диапазон), > 11 — оранжевый → красный */
function p3vcol(v) {
  if (!(v > 0)) return '#9aa3ad';
  if (v <= 9) return '#2fb67a';
  if (v <= 11) return '#e7c13a';
  if (v <= 15) return '#ee8a2f';
  return '#d8432e';
}
/* цвет по перепаду на двери, Па: < 20 — синий (мало), 20…150 — зелёный, > 150 — красный */
function p3pcol(dp) { return !(dp >= 20) ? '#4a86d8' : dp <= 150 ? '#2fb67a' : '#d8432e'; }
function p3txt(x, y, t, cls, anchor) { return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" class="' + (cls || 'p3t') + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + t + '</text>'; }
function p3legend(items, x, y, title) {
  var h = p3txt(x, y, title, 'p3t p3b');
  items.forEach(function (it, i) { h += '<rect x="' + x + '" y="' + (y + 8 + i * 17) + '" width="14" height="11" rx="2" fill="' + it[0] + '"/>' + p3txt(x + 20, y + 17 + i * 17, it[1]); });
  return h;
}
function p3fan(x, y, z, s, ox, oy, lab1, lab2) {
  var c = p3pt(x, y, z, s, ox, oy), h = p3box(x - 0.7, y - 0.7, z, 1.4, 1.4, 0.9, '#5b6b7d', s, ox, oy);
  var t = p3pt(x, y, z + 0.9, s, ox, oy);
  h += '<ellipse cx="' + t[0].toFixed(1) + '" cy="' + t[1].toFixed(1) + '" rx="' + (s * 0.55).toFixed(1) + '" ry="' + (s * 0.3).toFixed(1) + '" fill="#2b3440" stroke="#e8edf3" stroke-width=".8"/>' +
    '<g class="p3spin" style="transform-origin:' + t[0].toFixed(1) + 'px ' + t[1].toFixed(1) + 'px">' +
    [0, 120, 240].map(function (a) { var r = a * Math.PI / 180; return '<line x1="' + t[0].toFixed(1) + '" y1="' + t[1].toFixed(1) + '" x2="' + (t[0] + Math.cos(r) * s * 0.45).toFixed(1) + '" y2="' + (t[1] + Math.sin(r) * s * 0.24).toFixed(1) + '" stroke="#e8edf3" stroke-width="1.6"/>'; }).join('') + '</g>';
  h += p3txt(c[0] + s * 1.3, c[1] - s * 1.6, lab1, 'p3t p3b') + p3txt(c[0] + s * 1.3, c[1] - s * 1.6 + 15, lab2);
  return h;
}
function p3wrap(W, H, body, title) {
  return '<svg class="p3svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + title + '">' +
    '<style>.p3t{font:12px Arial,sans-serif;fill:#1d2733}.p3b{font-weight:700}.p3w{font:11px Arial,sans-serif;fill:#fff;font-weight:700}' +
    '@keyframes p3r{to{transform:rotate(360deg)}}.p3spin{animation:p3r 1.6s linear infinite}@media(prefers-reduced-motion:reduce){.p3spin{animation:none}}</style>' +
    '<rect width="' + W + '" height="' + H + '" fill="#f6f7f9"/>' + p3txt(16, 24, title, 'p3t p3b') + body + '</svg>';
}

/* ---------- дымоудаление ---------- */
function p3smk(p, o) {
  var N = o.rows.length, fh = 1.25, s = Math.max(12, Math.min(26, 520 / (N * fh + 14))), W = 820, H = Math.round(N * fh * s + 14 * s + 110), ox = 330, oy = H - 10 * s - 50;
  var bx = 9, by = 6, h = '', f = function (v, n) { return dpuFmt(v, n); };
  /* грунт и здание: полупрозрачные этажи */
  h += '<polygon points="' + p3poly([p3pt(-2, -2, 0, s, ox, oy), p3pt(bx + 3, -2, 0, s, ox, oy), p3pt(bx + 3, by + 2, 0, s, ox, oy), p3pt(-2, by + 2, 0, s, ox, oy)]) + '" fill="#dfe3e8"/>';
  h += p3box(0, 0, 0, bx, by, N * fh, '#dbe4ee', s, ox, oy, 0.16, 'rgba(60,80,100,.45)');
  for (var i = 0; i < N; i++) {
    var z = i * fh, fire = i === 0;
    h += p3box(0, 0, z, bx, by, 0.08, fire ? '#f3c9bd' : '#cfd8e3', s, ox, oy, 0.55);
    var lab = p3pt(0, by, z + 0.35, s, ox, oy);
    h += p3txt(lab[0] - 8, lab[1], (o.rows[i].i) + (fire ? ' — пожар' : ''), 'p3t', 'end');
  }
  /* шахта у торца здания: сегменты по этажам, цвет — скорость в вертикали */
  var sx = bx - 1.6, sy = 0.6;
  for (i = 0; i < N; i++) {
    var r = o.rows[i];
    h += p3box(sx, sy, i * fh, 0.9, 0.9, fh, p3vcol(r.ver.v), s, ox, oy, 0.95);
  }
  /* этаж пожара: огонь, дым, горизонтальный воздуховод, открытый клапан, ДПУ */
  var hv = o.rows[0].hor && o.rows[0].hor.v ? o.rows[0].hor.v : o.rows[0].ver.v;
  h += p3box(2.2, sy + 0.2, 0.55, sx - 2.2, 0.5, 0.35, p3vcol(hv), s, ox, oy, 0.95);
  h += p3box(sx - 0.25, sy + 0.1, 0.45, 0.25, 0.7, 0.55, p3vcol(o.vkl), s, ox, oy, 1, '#111');
  var nd = Math.max(1, Math.min(o.Nmin || 1, 4)), vd = o.G / (353 / o.Tsm) / nd / ((p.dpuW / 1000) * (p.dpuB / 1000));
  for (var k = 0; k < nd; k++) h += p3box(2.4 + k * ((sx - 3) / nd), sy + 0.25, 0.5, 0.5, 0.4, 0.06, p3vcol(vd), s, ox, oy, 1, '#111');
  var fl = p3pt(3.2, 3.5, 0.08, s, ox, oy);
  h += '<path d="M' + fl[0].toFixed(1) + ' ' + fl[1].toFixed(1) + ' q-9 -14 0 -30 q3 12 9 4 q4 14 -9 26z" fill="#e8562f"/><path d="M' + (fl[0] + 2).toFixed(1) + ' ' + fl[1].toFixed(1) + ' q-4 -8 1 -16 q2 7 5 3 q1 8 -6 13z" fill="#ffc23a"/>';
  h += '<ellipse cx="' + (fl[0] + 30).toFixed(1) + '" cy="' + (fl[1] - 40).toFixed(1) + '" rx="' + (s * 3.4).toFixed(1) + '" ry="' + (s * 0.7).toFixed(1) + '" fill="#5c5f66" fill-opacity=".28"/>';
  /* закрытые клапаны на других этажах — серые с подсосом */
  for (i = 1; i < N - 1; i++) h += p3box(sx - 0.18, sy + 0.25, i * fh + 0.45, 0.18, 0.4, 0.35, '#8e98a4', s, ox, oy, 1);
  /* вентилятор на кровле */
  h += p3fan(sx + 0.45, sy + 0.45, N * fh, s, ox, oy, 'Вентилятор: ' + f(o.Lv, 0) + ' м³/ч, ' + f(o.Psv, 0) + ' Па', 't = ' + f(o.tFan, 0) + ' °C, ' + f(o.GN, 2) + ' кг/с');
  /* подписи скоростей */
  var a1 = p3pt(sx - 0.2, sy, 0.75, s, ox, oy), a2 = p3pt(2.6, sy, 0.55, s, ox, oy), a3 = p3pt(sx + 0.9, sy, N * fh * 0.5, s, ox, oy);
  var lead = function (pt, dx, dy, t) { return '<line x1="' + pt[0].toFixed(1) + '" y1="' + pt[1].toFixed(1) + '" x2="' + (pt[0] + dx).toFixed(1) + '" y2="' + (pt[1] + dy).toFixed(1) + '" stroke="#1d2733" stroke-width=".7"/>' + p3txt(pt[0] + dx + (dx < 0 ? -4 : 4), pt[1] + dy + 4, t, 'p3t p3b', dx < 0 ? 'end' : null); };
  h += lead(a1, 150, 40, 'открытый клапан ' + f(o.vkl, 1) + ' м/с') + lead(a2, -120, 50, 'ДПУ ' + nd + ' шт. · ' + f(vd, 1) + ' м/с') +
    p3txt(a3[0] + 10, a3[1], 'шахта ' + f(o.rows[N - 1].ver.v, 1) + ' м/с', 'p3t p3b');
  h += p3legend([['#2fb67a', 'до 9 м/с'], ['#e7c13a', '9…11 м/с — рекомендовано'], ['#ee8a2f', '11…15 м/с'], ['#d8432e', 'больше 15 м/с'], ['#8e98a4', 'закрытый клапан']], W - 210, 44, 'Скорость (МР ВНИИПО п. 5.1.1)');
  h += p3txt(16, H - 14, 'Дым ' + f(o.G, 2) + ' кг/с при ' + f(o.Tsm - 273, 0) + ' °C → у вентилятора ' + f(o.GN, 2) + ' кг/с (подсосы +' + f(o.Ga, 2) + ' кг/с). Схема условная, числа — из расчёта.');
  return p3wrap(W, H, h, 'Система вытяжной противодымной вентиляции ' + esc(p.system || ''));
}

/* ---------- подпор: лестница и лифт ---------- */
function p3sup(p, o, lift) {
  var rows = o.rows.slice(), N = rows.length, fh = 1.25, s = Math.max(12, Math.min(26, 520 / (N * fh + 14))), W = 820, H = Math.round(N * fh * s + 14 * s + 110), ox = 330, oy = H - 10 * s - 50;
  var labs = '', bx = 9, by = 6, h = '', f = function (v, n) { return dpuFmt(v, n); }, cx = 3.2, cy = 1.4, cw = 2.6, cd = 2.2;
  h += '<polygon points="' + p3poly([p3pt(-2, -2, 0, s, ox, oy), p3pt(bx + 3, -2, 0, s, ox, oy), p3pt(bx + 3, by + 2, 0, s, ox, oy), p3pt(-2, by + 2, 0, s, ox, oy)]) + '" fill="#dfe3e8"/>';
  h += p3box(0, 0, 0, bx, by, N * fh, '#dbe4ee', s, ox, oy, 0.16, 'rgba(60,80,100,.45)');
  for (var i = 0; i < N; i++) {
    var r = rows[i], z = i * fh;
    h += p3box(0, 0, z, bx, by, 0.08, '#cfd8e3', s, ox, oy, 0.5);
    h += p3box(cx, cy, z + 0.08, cw, cd, fh - 0.08, lift ? '#b9c7d8' : '#c9d6e6', s, ox, oy, 0.55);
    var open = lift ? r.i === 1 : r.dPd === 20 && i === 0;
    var col = open ? '#d8432e' : p3pcol(r.dPd);
    h += p3box(cx + cw * 0.3, cy + cd, z + 0.1, cw * 0.4, 0.06, 0.62, col, s, ox, oy, 1, '#111');
    var d0 = p3pt(cx + cw * 0.5, cy + cd + 0.06, z + 0.4, s, ox, oy), d1 = p3pt(bx + 0.6, cy + cd + 0.06, z + 0.4, s, ox, oy);
    labs += '<line x1="' + d0[0].toFixed(1) + '" y1="' + d0[1].toFixed(1) + '" x2="' + d1[0].toFixed(1) + '" y2="' + d1[1].toFixed(1) + '" stroke="#1d2733" stroke-width=".5" stroke-dasharray="2 2"/>' +
      '<circle cx="' + d1[0].toFixed(1) + '" cy="' + d1[1].toFixed(1) + '" r="2" fill="' + col + '"/>' + p3txt(d1[0] + 6, d1[1] + 4, r.i + ' эт. · ' + (open ? (lift ? 'двери открыты' : 'дверь открыта') : f(r.dPd, 0) + ' Па'), 'p3t');
  }
  h += labs;
  var top = N * fh;
  h += p3box(cx + cw * 0.35, cy + cd * 0.35, top, 0.7, 0.7, 0.7, '#7d8da0', s, ox, oy, 1);
  h += p3fan(cx + cw * 0.7, cy + cd * 0.7, top + 0.7, s, ox, oy, 'Вентилятор: ' + f(o.Lv, 0) + ' м³/ч, ' + f(o.Psv, 0) + ' Па', 'наружный воздух ' + f(p.air.ta, 0) + ' °C');
  h += p3legend([['#4a86d8', 'меньше 20 Па'], ['#2fb67a', '20…150 Па — норма'], ['#d8432e', 'больше 150 Па / открыто']], W - 210, 44, 'Перепад на дверях (СП 7 п. 7.16 б)');
  h += p3txt(16, H - 14, (lift ? 'Шахта: ' + f(o.G1, 2) + ' кг/с через открытые двери 1-го этажа + утечки ' + f(o.leak, 2) + ' кг/с.' : 'Клетка: ' + f(o.Gs0, 2) + ' кг/с на этаже пожара → ' + f(o.Gs, 2) + ' кг/с вверху; перепад до ' + f(o.dpmax, 0) + ' Па.') + ' Схема условная, числа — из расчёта.');
  return p3wrap(W, H, h, (lift ? 'Подпор в лифтовую шахту ' : 'Подпор в лестничную клетку ') + esc(p.system || ''));
}

function pdv3d(mode, p, o) {
  if (!o || !isFinite(o.Lv) || !o.rows) return '';
  return mode === 'smk' ? p3smk(p, o) : p3sup(p, o, mode === 'lift');
}
/* PNG для отчёта: SVG → canvas → data:image/png */
function pdv3dPng(svg, cb) {
  var img = new Image(), url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('class="p3spin"', ''));
  img.onload = function () {
    var c = document.createElement('canvas'); c.width = img.width * 2; c.height = img.height * 2;
    var g = c.getContext('2d'); g.scale(2, 2); g.drawImage(img, 0, 0); cb(c.toDataURL('image/png'));
  };
  img.onerror = function () { cb(''); };
  img.src = url;
}
