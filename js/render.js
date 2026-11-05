/* Рисование схем SVG из описания SC. Анимацию задаёт CSS по html[data-mode] */
function modeCls(f) { return ['n', 'f', 'a'].filter(function (m) { return f.indexOf(m) >= 0; }).map(function (m) { return 'on-' + m; }).join(' '); }
function pts(p) { return p.map(function (q) { return q.join(','); }).join(' '); }
var VNAME = { NO: 'НО', NZ: 'НЗ', DD: 'ДД' };

function plen(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
function dpath(p) { return 'M' + p.map(function (q) { return q.join(' '); }).join('L'); }
/* Частицы потока: воздух — точки, дым — клубы. Видимость по фазе задаёт CSS. */
function particles(d, k, f) {
  var L = plen(d.p), smoke = k === 'smoke', sp = smoke ? 55 : 75, gap = smoke ? 46 : 38;
  var n = Math.max(2, Math.round(L / gap)), dur = (L / sp).toFixed(2), o = ['<g class="pt pt-' + k + ' ' + modeCls(f) + '">'];
  for (var i = 0; i < n; i++) {
    var b = (-dur * i / n).toFixed(2);
    o.push(smoke
      ? '<circle r="' + (4 + (i % 3)) + '"><animateMotion dur="' + dur + 's" begin="' + b + 's" repeatCount="indefinite" path="' + dpath(d.p) + '"/><animate attributeName="opacity" values=".2;.85;.5" dur="' + dur + 's" begin="' + b + 's" repeatCount="indefinite"/></circle>'
      : '<circle r="2.6"><animateMotion dur="' + dur + 's" begin="' + b + 's" repeatCount="indefinite" path="' + dpath(d.p) + '"/></circle>');
  }
  return o.join('') + '</g>';
}
function vstate(v, m) {
  if (v.t === 'NO') return m === 'n';
  if (v.t === 'DD') return m !== 'f';
  return (v.open === undefined ? 'fa' : v.open).indexOf(m) >= 0;
}
function valveSvg(v) {
  var closed = v.t === 'NO' ? 'c-f c-a' : v.t === 'DD' ? 'c-f' : '';
  if (v.t === 'NZ') {
    var o = v.open === undefined ? 'fa' : v.open;
    closed = ['n', 'f', 'a'].filter(function (m) { return o.indexOf(m) < 0; }).map(function (m) { return 'c-' + m; }).join(' ');
  }
  var st = { n: vstate(v, 'n'), f: vstate(v, 'f'), a: vstate(v, 'a') };
  if (st.f !== st.n) closed += ' ch-f';
  if (st.a !== st.f) closed += ' ch-a';
  if (st.n !== st.a) closed += ' ch-n';
  var lx = v.lx === undefined ? 0 : v.lx, ly = v.ly === undefined ? (v.r ? 5 : 30) : v.ly;
  return '<g class="v v' + v.t + ' ' + closed + '" transform="translate(' + v.x + ' ' + v.y + ')">' +
    '<circle class="ring" r="16"/><g transform="rotate(' + (v.r || 0) + ')"><rect class="vb" x="-10" y="-14" width="20" height="28" rx="4"/><rect class="blade" x="-8" y="-1.5" width="16" height="3" rx="1.5"/></g>' +
    '<text class="vt" x="' + lx + '" y="' + ly + '" text-anchor="middle">' + VNAME[v.t] + '</text></g>';
}

function fanSvg(f) {
  return '<g transform="translate(' + f.x + ' ' + f.y + ')"><circle class="fanb" r="15"/><g class="fan ' + modeCls(f.f) + '"><path d="M0-11 3-2-3-2Z M11 0 2 3 2-3Z M0 11-3 2 3 2Z M-11 0-2-3-2 3Z"/></g></g>';
}

function drawScheme(id) {
  var s = SC[id];
  if (!s) return '';
  var W = 480, H = s.h, o = [];
  o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + s.cap + '">');
  (s.z || []).forEach(function (z) {
    o.push('<rect class="z ' + (z.c === 'hot' ? 'z-hot' : z.c === 'shaft' ? 'z-shaft' : z.c === 'tech' ? 'z-tech' : '') + '" x="' + z.x + '" y="' + z.y + '" width="' + z.w + '" height="' + z.h + '" rx="8"/>');
    if (z.l) o.push('<text class="zl" x="' + (z.x + 10) + '" y="' + (z.y + 19) + '">' + z.l + '</text>');
  });
  (s.w || []).forEach(function (w) {
    o.push('<line class="wl" x1="' + w.a[0] + '" y1="' + w.a[1] + '" x2="' + w.b[0] + '" y2="' + w.b[1] + '"/>');
    if (w.l) o.push('<text class="wt" x="' + (w.a[0] + 8) + '" y="' + (w.b[1] - 8) + '">' + w.l + '</text>');
  });
  (s.d || []).forEach(function (d) {
    var k = d.k || 'air', f = d.f === undefined ? 'n' : d.f;
    if (d.fp) o.push('<polyline class="dfp" points="' + pts(d.p) + '"/>');
    o.push('<polyline class="dbase d-' + k + '" points="' + pts(d.p) + '"/>');
    if (f) o.push('<polyline class="dflow fl-' + k + ' ' + modeCls(f) + '" points="' + pts(d.p) + '"/>', particles(d, k, f));
  });
  (s.fan || []).forEach(function (f) { o.push(fanSvg(f)); });
  (s.v || []).forEach(function (v) { o.push(valveSvg(v)); });
  if (s.fire) {
    o.push('<g class="flame on-f ' + (s.three ? '' : 'on-a') + '" transform="translate(' + s.fire[0] + ' ' + s.fire[1] + ')"><circle class="glow" r="34"/><g class="puffs"><circle cx="-6" r="7"/><circle cx="5" r="9"/><circle cx="0" r="6"/></g><g class="fl1"><path d="M0-22C9-11 12-5 12 3 12 11 6 15 0 15-6 15-12 11-12 3-12-3-8-7-5-12-4-7-3-5 0-4 2-9 2-15 0-22Z"/></g><g class="fl2"><path d="M0-5C4 0 6 3 6 7 6 11 3 13 0 13-3 13-6 11-6 7-6 3-3 0 0-5Z"/></g></g>');
  }
  (s.dim || []).forEach(function (d) {
    var mx = (d.a[0] + d.b[0]) / 2, my = (d.a[1] + d.b[1]) / 2;
    o.push('<g class="dim"><line x1="' + d.a[0] + '" y1="' + d.a[1] + '" x2="' + d.b[0] + '" y2="' + d.b[1] + '"/><circle cx="' + d.a[0] + '" cy="' + d.a[1] + '" r="2.5"/><circle cx="' + d.b[0] + '" cy="' + d.b[1] + '" r="2.5"/>' +
      '<text x="' + (d.v ? mx + 8 : mx) + '" y="' + (d.v ? my + 4 : my - 7) + '" text-anchor="' + (d.v ? 'start' : 'middle') + '">' + d.t + '</text></g>');
  });
  (s.tx || []).forEach(function (t) {
    o.push('<text class="tx ' + (t.c === 'fp' ? 'tx-fp' : '') + '" x="' + t.x + '" y="' + t.y + '" text-anchor="' + (t.a || 'start') + '">' + t.t + '</text>');
  });
  o.push('</svg>');
  return o.join('');
}

var PHASES = [['n', 'Работа'], ['f', 'Пожар'], ['a', 'После']];
function phaseBar() {
  return '<div class="phase" role="group" aria-label="Фаза">' + PHASES.map(function (p, i) {
    return '<button type="button" data-m="' + p[0] + '" class="ph-' + p[0] + '"><b>' + (i + 1) + '</b>' + p[1] + '</button>';
  }).join('') + '<i class="prog"></i></div>';
}
function steps(id) {
  var t = STEPS[id];
  return t ? '<div class="steps">' + PHASES.map(function (p) { return '<p class="st-' + p[0] + '">' + t[p[0]] + '</p>'; }).join('') + '</div>' : '';
}
function figure(id) {
  return '<figure class="fig"><div class="figsvg">' + drawScheme(id) + '</div>' + phaseBar() + steps(id) + '<figcaption>' + SC[id].cap + '</figcaption></figure>';
}
