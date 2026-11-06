/* 1.22.1: «живая» объёмная схема дымоудаления — заменяет p3smk из pdv3d.js (общие помощники p3pt, p3poly, p3txt, p3legend, p3vcol, p3wrap — там).
   Строится по расчёту: этажей — o.rows.length, ДПУ — o.Nmin, скорости — из сети; при расчёте компенсации (o.comp) — система ДП.
   Вид «как настоящая»: оцинкованные воздуховоды с объёмом и фланцами, клапаны с приводами, решётки ДПУ с жалюзи, крышный вентилятор,
   приточная установка компенсации с воздухозабором, стрелки движения дыма и воздуха. Пропорции условные, числа — из расчёта. */
var P3M = '<defs>' +
  '<linearGradient id="p3mT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset="1" stop-color="#c6cfd8"/></linearGradient>' +
  '<linearGradient id="p3mR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa6b2"/><stop offset=".5" stop-color="#c3ccd5"/><stop offset="1" stop-color="#7f8b98"/></linearGradient>' +
  '<linearGradient id="p3mF" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9e0e7"/><stop offset=".45" stop-color="#f1f4f7"/><stop offset="1" stop-color="#aab5c0"/></linearGradient>' +
  '<linearGradient id="p3cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b7885"/><stop offset=".35" stop-color="#dfe5eb"/><stop offset=".6" stop-color="#b3bdc7"/><stop offset="1" stop-color="#5d6975"/></linearGradient>' +
  '<linearGradient id="p3glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe3f5" stop-opacity=".35"/><stop offset="1" stop-color="#9fbfdc" stop-opacity=".18"/></linearGradient>' +
  '<radialGradient id="p3smoke"><stop offset="0" stop-color="#3d3f44" stop-opacity=".55"/><stop offset="1" stop-color="#3d3f44" stop-opacity="0"/></radialGradient>' +
  '<radialGradient id="p3glow"><stop offset="0" stop-color="#ff6a2b" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a2b" stop-opacity="0"/></radialGradient>' +
  '<marker id="p3aS" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#e2572b"/></marker>' +
  '<marker id="p3aC" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#2f7fd8"/></marker>' +
  '</defs><style>@keyframes p3d{to{stroke-dashoffset:-32}}.p3flow{animation:p3d 1.1s linear infinite}@media(prefers-reduced-motion:reduce){.p3flow{animation:none}}</style>';

/* металлический параллелепипед: верх, правая (x+dx) и передняя (y+dy) грани */
function p3m(x, y, z, dx, dy, dz, s, ox, oy, tint) {
  var P = function (a, b, c) { return p3pt(a, b, c, s, ox, oy); };
  var top = [P(x, y, z + dz), P(x + dx, y, z + dz), P(x + dx, y + dy, z + dz), P(x, y + dy, z + dz)];
  var rgt = [P(x + dx, y, z), P(x + dx, y + dy, z), P(x + dx, y + dy, z + dz), P(x + dx, y, z + dz)];
  var frt = [P(x, y + dy, z), P(x + dx, y + dy, z), P(x + dx, y + dy, z + dz), P(x, y + dy, z + dz)];
  var st = ' stroke="#56616d" stroke-width=".6" stroke-linejoin="round"';
  var h = '<polygon points="' + p3poly(frt) + '" fill="url(#p3mF)"' + st + '/><polygon points="' + p3poly(rgt) + '" fill="url(#p3mR)"' + st + '/><polygon points="' + p3poly(top) + '" fill="url(#p3mT)"' + st + '/>';
  if (tint) h += '<polygon points="' + p3poly(frt) + '" fill="' + tint + '" fill-opacity=".14"/><polygon points="' + p3poly(rgt) + '" fill="' + tint + '" fill-opacity=".14"/>';
  return h;
}
/* плоский прямоугольник на передней грани (y = const): решётка, проём */
function p3face(x, y, z, dx, dz, s, ox, oy, fill, slats, slatAngle) {
  var P = function (a, c) { return p3pt(a, y, c, s, ox, oy); }, h = '<polygon points="' + p3poly([P(x, z), P(x + dx, z), P(x + dx, z + dz), P(x, z + dz)]) + '" fill="' + fill + '" stroke="#2b3138" stroke-width=".7"/>';
  for (var i = 1; i <= slats; i++) {
    var zz = z + dz * i / (slats + 1), a = P(x + dx * 0.06, zz), b = P(x + dx * 0.94, zz + (slatAngle || 0));
    h += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="#c8d0d8" stroke-width="1.1"/>';
  }
  return h;
}
/* плоский прямоугольник на правой грани (x = const) */
function p3faceX(x, y, z, dy, dz, s, ox, oy, fill, slats, open) {
  var P = function (b, c) { return p3pt(x, b, c, s, ox, oy); }, h = '<polygon points="' + p3poly([P(y, z), P(y + dy, z), P(y + dy, z + dz), P(y, z + dz)]) + '" fill="' + fill + '" stroke="#2b3138" stroke-width=".7"/>';
  for (var i = 1; i <= slats; i++) {
    var zz = z + dz * i / (slats + 1), a = P(y + dy * 0.08, zz + (open ? 0.12 : 0)), b = P(y + dy * 0.92, zz - (open ? 0.12 : 0));
    h += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + (open ? '#ffd2b8' : '#c8d0d8') + '" stroke-width="1.2"/>';
  }
  return h;
}
/* значок скорости: цветная плашка с числом */
function p3badge(x, y, v, t) {
  var w = 8 + (t.length * 6.2);
  return '<rect x="' + (x - 2).toFixed(1) + '" y="' + (y - 11).toFixed(1) + '" width="' + w.toFixed(1) + '" height="15" rx="4" fill="' + p3vcol(v) + '" stroke="#fff" stroke-width="1"/>' +
    '<text x="' + (x + 2).toFixed(1) + '" y="' + y.toFixed(1) + '" class="p3w">' + t + '</text>';
}
function p3line(pts, cls, mk, col) {
  return '<polyline points="' + p3poly(pts) + '" fill="none" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="9 7" class="' + cls + '" marker-end="url(#' + mk + ')"/>';
}
function p3lead(pt, dx, dy, t, t2) {
  var e = dx < 0 ? 'end' : null, x = pt[0] + dx + (dx < 0 ? -4 : 4);
  return '<line x1="' + pt[0].toFixed(1) + '" y1="' + pt[1].toFixed(1) + '" x2="' + (pt[0] + dx).toFixed(1) + '" y2="' + (pt[1] + dy).toFixed(1) + '" stroke="#1d2733" stroke-width=".7"/>' +
    '<circle cx="' + pt[0].toFixed(1) + '" cy="' + pt[1].toFixed(1) + '" r="2" fill="#1d2733"/>' + p3txt(x, pt[1] + dy + 4, t, 'p3t p3b', e) + (t2 ? p3txt(x, pt[1] + dy + 18, t2, 'p3t', e) : '');
}
/* крышный радиальный вентилятор: рама, корпус-цилиндр, колесо, колпак выброса */
function p3roofFan(c, s) {
  var r = s * 0.95, hh = s * 1.1, x = c[0], y = c[1], f = function (v) { return v.toFixed(1); };
  var h = '<ellipse cx="' + f(x) + '" cy="' + f(y + 2) + '" rx="' + f(r * 1.25) + '" ry="' + f(r * 0.62) + '" fill="#4a5561"/>' +
    '<rect x="' + f(x - r) + '" y="' + f(y - hh) + '" width="' + f(2 * r) + '" height="' + f(hh) + '" fill="url(#p3cyl)" stroke="#45505b" stroke-width=".7"/>' +
    '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(r) + '" ry="' + f(r * 0.5) + '" fill="none" stroke="#45505b" stroke-width=".7"/>' +
    '<ellipse cx="' + f(x) + '" cy="' + f(y - hh) + '" rx="' + f(r) + '" ry="' + f(r * 0.5) + '" fill="#2a323b" stroke="#45505b" stroke-width=".7"/>' +
    '<g class="p3spin" style="transform-origin:' + f(x) + 'px ' + f(y - hh) + 'px">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) {
      var q = a * Math.PI / 180; return '<line x1="' + f(x) + '" y1="' + f(y - hh) + '" x2="' + f(x + Math.cos(q) * r * 0.85) + '" y2="' + f(y - hh + Math.sin(q) * r * 0.42) + '" stroke="#cfd6dd" stroke-width="1.4"/>'; }).join('') + '</g>' +
    '<ellipse cx="' + f(x) + '" cy="' + f(y - hh) + '" rx="' + f(r * 0.2) + '" ry="' + f(r * 0.1) + '" fill="#e2572b"/>';
  /* струя выброса вверх */
  h += '<path d="M' + f(x - r * 0.5) + ' ' + f(y - hh - 4) + ' q' + f(-r * 0.2) + ' ' + f(-s * 1.2) + ' ' + f(r * 0.2) + ' ' + f(-s * 2) + ' M' + f(x + r * 0.5) + ' ' + f(y - hh - 4) + ' q' + f(r * 0.3) + ' ' + f(-s * 1.1) + ' ' + f(-r * 0.1) + ' ' + f(-s * 2.1) + '" fill="none" stroke="#7a7d84" stroke-width="2.2" stroke-linecap="round" stroke-opacity=".55" stroke-dasharray="9 7" class="p3flow"/>';
  return h;
}

function p3smk(p, o) {
  var N = o.rows.length, fh = 1.3, bx = 12, by = 7, f = function (v, n) { return dpuFmt(v, n); };
  var s = Math.max(9, Math.min(24, 560 / (N * fh + (bx + by) * 0.5 + 7)));
  var W = 1040, H = Math.round((bx + by + 2) * 0.5 * s + (N * fh + 5) * s + 110), ox = 250 + (by + 1) * 0.866 * s, oy = H - (bx + by + 2) * 0.5 * s - 30;
  var P = function (a, b, c) { return p3pt(a, b, c, s, ox, oy); }, h = P3M, top = N * fh;
  /* площадка и здание: стекло, перекрытия, импосты */
  h += '<polygon points="' + p3poly([P(-1.5, -1.5, 0), P(bx + 2.5, -1.5, 0), P(bx + 2.5, by + 1.5, 0), P(-1.5, by + 1.5, 0)]) + '" fill="#e3e7eb" stroke="#cfd5db"/>';
  var back = [P(0, 0, 0), P(bx, 0, 0), P(bx, 0, top), P(0, 0, top)], left = [P(0, 0, 0), P(0, by, 0), P(0, by, top), P(0, 0, top)];
  h += '<polygon points="' + p3poly(back) + '" fill="#dfe8f1" fill-opacity=".5" stroke="#9fb0c2" stroke-width=".6"/><polygon points="' + p3poly(left) + '" fill="#d7e2ed" fill-opacity=".5" stroke="#9fb0c2" stroke-width=".6"/>';
  for (var i = 0; i <= N; i++) {
    var z = i * fh, fire = i === 0, slab = [P(0, 0, z), P(bx, 0, z), P(bx, by, z), P(0, by, z)];
    h += '<polygon points="' + p3poly(slab) + '" fill="' + (fire ? '#f6d5c9' : i === N ? '#b9c3cd' : '#d3dbe3') + '" fill-opacity="' + (i === N ? 0.9 : 0.62) + '" stroke="#8a9aab" stroke-width=".6"/>';
    if (i < N) { var lb = P(0, by, z + fh * 0.45); h += p3txt(lb[0] - 8, lb[1], (i + 1) + (fire ? ' — пожар' : ''), fire ? 'p3t p3b' : 'p3t', 'end'); }
  }
  /* шахта дымоудаления: стальной воздуховод с фланцами по этажам */
  var sx = bx - 2.2, sy = 1.0, sw = 0.85, zH = fh * 0.62;
  for (i = 0; i < N; i++) {
    var z0 = i === 0 ? zH : i * fh, z1 = (i + 1) * fh;
    h += p3m(sx, sy, z0, sw, sw, z1 - z0, s, ox, oy);
    h += p3m(sx - 0.06, sy - 0.06, z1 - 0.07, sw + 0.12, sw + 0.12, 0.07, s, ox, oy);
  }
  /* клапаны на этажах: стальной патрубок + корпус клапана + привод; на этаже пожара открыт */
  for (i = 0; i < N; i++) {
    var zc = i * fh + zH, open = i === 0, vx = sx - 0.55;
    if (!open) {
      h += p3m(vx, sy + 0.2, zc, 0.55, 0.45, 0.4, s, ox, oy);
      h += p3faceX(sx - 0.55, sy + 0.2, zc, 0.45, 0.4, s, ox, oy, '#3a4048', 2, false);
      h += '<rect x="' + (P(vx + 0.1, sy + 0.65, zc + 0.4)[0] - 3).toFixed(1) + '" y="' + (P(vx + 0.1, sy + 0.65, zc + 0.4)[1] - 5).toFixed(1) + '" width="6" height="5" rx="1" fill="#6c7682"/>';
    }
  }
  /* этаж пожара: горизонтальный воздуховод вдоль коридора с решётками ДПУ */
  var hx0 = 1.2, hy = 1.1, hd = 0.62, hz = zH, hh = 0.5, nd = Math.max(1, Math.min(o.Nmin || 1, 10));
  var smoke = P(bx * 0.45, by * 0.5, fh * 0.85);
  h += '<ellipse cx="' + smoke[0].toFixed(1) + '" cy="' + smoke[1].toFixed(1) + '" rx="' + (s * 6).toFixed(1) + '" ry="' + (s * 2.2).toFixed(1) + '" fill="url(#p3smoke)"/>';
  h += p3m(hx0, hy, hz, sx - 0.55 - hx0, hd, hh, s, ox, oy);
  for (var k = 0; k < nd; k++) {
    var gx = hx0 + 0.35 + k * ((sx - 1.4 - hx0) / Math.max(nd, 1));
    h += p3face(gx, hy + hd, hz + 0.06, Math.min(0.62, (sx - 1.4 - hx0) / nd * 0.75), hh - 0.12, s, ox, oy, '#2f353c', 3, 0);
  }
  /* открытый клапан этажа пожара: корпус, распахнутые лопатки, привод, подсветка */
  var vk = sx - 0.55, glow = P(vk + 0.3, sy + 0.4, hz + 0.25);
  h += '<ellipse cx="' + glow[0].toFixed(1) + '" cy="' + glow[1].toFixed(1) + '" rx="' + (s * 1.3).toFixed(1) + '" ry="' + (s * 0.8).toFixed(1) + '" fill="url(#p3glow)"/>';
  h += p3m(vk, hy - 0.04, hz - 0.04, 0.55, hd + 0.08, hh + 0.08, s, ox, oy, '#e2572b');
  h += p3faceX(vk + 0.55, hy - 0.04, hz - 0.04, hd + 0.08, hh + 0.08, s, ox, oy, '#4a2a22', 3, true);
  var act = P(vk + 0.15, hy + hd + 0.04, hz + hh + 0.04);
  h += '<rect x="' + (act[0] - 5).toFixed(1) + '" y="' + (act[1] - 8).toFixed(1) + '" width="10" height="8" rx="1.5" fill="#d8432e" stroke="#7a1f12" stroke-width=".6"/>';
  /* огонь */
  var fl = P(3.0, 4.6, 0.02);
  h += '<path d="M' + fl[0].toFixed(1) + ' ' + fl[1].toFixed(1) + ' q-12 -18 0 -40 q4 16 12 5 q6 18 -12 35z" fill="#e8562f"/><path d="M' + (fl[0] + 3).toFixed(1) + ' ' + fl[1].toFixed(1) + ' q-6 -10 1 -22 q3 9 7 4 q2 10 -8 18z" fill="#ffc23a"/>';
  /* потоки дыма: от ДПУ по коридору → в шахту → вверх к вентилятору */
  var sp = [P(hx0 + 0.3, hy + hd * 0.5, hz + hh + 0.25), P(sx - 0.6, hy + hd * 0.5, hz + hh + 0.25)];
  h += p3line(sp, 'p3flow', 'p3aS', '#e2572b');
  h += p3line([P(sx + sw * 0.5, sy + sw + 0.25, zH + 0.6), P(sx + sw * 0.5, sy + sw + 0.25, top - 0.4)], 'p3flow', 'p3aS', '#e2572b');
  /* вентилятор дымоудаления на кровле */
  h += p3m(sx - 0.25, sy - 0.25, top, sw + 0.5, sw + 0.5, 0.18, s, ox, oy);
  var fc = P(sx + sw * 0.5, sy + sw * 0.5, top + 0.18);
  h += p3roofFan(fc, s);
  /* подписи скоростей на этажах (справа от шахты) */
  var step = N > 18 ? 2 : 1;
  for (i = 0; i < N; i += step) { var b = P(sx + sw, sy + sw, i * fh + fh * 0.5); h += p3badge(b[0] + 8, b[1] + 4, o.rows[i].ver.v, f(o.rows[i].ver.v, 1)); }
  h += p3lead(P(sx + sw * 0.5, sy, top + 0.3 + 1.6), 60, -18, 'Вентилятор дымоудаления', f(o.Lv, 0) + ' м³/ч · ' + f(o.Psv, 0) + ' Па · ' + f(o.tFan, 0) + ' °C');
  h += p3lead(P(vk + 0.3, hy + hd, hz), 210, 70, 'Открытый клапан: ' + f(o.vkl, 1) + ' м/с', 'остальные клапаны закрыты, подсос через них');
  var vd = o.G / (353 / o.Tsm) / nd / ((p.dpuW / 1000) * (p.dpuB / 1000));
  h += p3lead(P(hx0 + 0.6, hy + hd, hz + 0.1), -60, 36, 'ДПУ ' + nd + ' шт. ' + f(p.dpuW, 0) + '×' + f(p.dpuB, 0) + ' мм · ' + f(vd, 1) + ' м/с', 'дым ' + f(o.G, 2) + ' кг/с, ' + f(o.Tsm - 273, 0) + ' °C');
  /* компенсация (ДП): приточная установка на кровле, шахта, НЗ клапан и решётка у пола этажа пожара */
  var c = o.comp, leg = [['#2fb67a', 'до 9 м/с'], ['#e7c13a', '9…11 м/с — рекомендовано'], ['#ee8a2f', '11…15 м/с'], ['#d8432e', 'больше 15 м/с']];
  if (c) {
    var cx = 1.0, cy = by - 1.6, cw = 0.8;
    for (i = 0; i < N; i++) { var c0 = i * fh + (i === 0 ? 0.15 : 0); h += p3m(cx, cy, c0, cw, cw, (i + 1) * fh - c0, s, ox, oy, '#2f7fd8'); h += p3m(cx - 0.06, cy - 0.06, (i + 1) * fh - 0.07, cw + 0.12, cw + 0.12, 0.07, s, ox, oy); }
    h += p3m(cx - 0.3, cy - 0.5, top, 2.6, 1.5, 0.95, s, ox, oy, '#2f7fd8');
    h += p3face(cx + 0.15, cy + 1.0, top + 0.12, 0.9, 0.7, s, ox, oy, '#39414b', 5, 0.03);
    h += p3faceX(cx + 2.3, cy - 0.35, top + 0.12, 1.1, 0.7, s, ox, oy, '#39414b', 5, false);
    h += p3m(cx + 0.9, cy + cw, 0.15, 0.55, 0.06, 0.45, s, ox, oy, '#2f7fd8');
    h += p3face(cx + 0.92, cy + cw + 0.06, 0.2, 0.5, 0.35, s, ox, oy, '#2f353c', 3, 0);
    h += p3line([P(cx + 2.9, cy, top + 0.5), P(cx + 2.35, cy, top + 0.5)], 'p3flow', 'p3aC', '#2f7fd8');
    h += p3line([P(cx + cw * 0.5, cy + cw + 0.25, top - 0.3), P(cx + cw * 0.5, cy + cw + 0.25, 0.8)], 'p3flow', 'p3aC', '#2f7fd8');
    h += p3line([P(cx + 1.2, cy + cw + 0.3, 0.4), P(cx + 3.6, cy + cw + 0.3, 0.4)], 'p3flow', 'p3aC', '#2f7fd8');
    h += p3lead(P(cx + 1.0, cy - 0.5, top + 0.95), -40, -30, 'Компенсация (ДП): ' + f(c.Lv, 0) + ' м³/ч · ' + f(c.Psv, 0) + ' Па', 'наружный воздух ' + f(p.tComp, 0) + ' °C');
    h += p3lead(P(cx + 1.15, cy + cw + 0.06, 0.4), -70, 105, 'НЗ клапан + решётка у пола', f(c.vkl, 1) + ' м/с в клапане · ' + f(c.vg, 1) + ' м/с в решётке');
    leg = leg.concat([['#2f7fd8', 'компенсация (приток)']]);
  }
  h += p3legend(leg.concat([['#e2572b', 'движение дыма']]), W - 230, 44, 'Скорость (МР ВНИИПО п. 5.1.1)');
  h += p3txt(16, H - 12, 'Дым ' + f(o.G, 2) + ' кг/с → у вентилятора ' + f(o.GN, 2) + ' кг/с (подсосы +' + f(o.Ga, 2) + ' кг/с). Этажей ' + N + ', ДПУ ' + nd + '. Схема условная, числа — из расчёта.');
  return p3wrap(W, H, h, 'Система вытяжной противодымной вентиляции ' + esc(p.system || ''));
}
