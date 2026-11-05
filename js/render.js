/* Рисование схем SVG из описания SC. Анимацию задаёт CSS по html[data-mode] */
function modeCls(f) { return ['n', 'f', 'a'].filter(function (m) { return f.indexOf(m) >= 0; }).map(function (m) { return 'on-' + m; }).join(' '); }
function pts(p) { return p.map(function (q) { return q.join(','); }).join(' '); }
var VNAME = { NO: 'НО', NZ: 'НЗ', DD: 'ДД' };

function valveSvg(v) {
  var closed = v.t === 'NO' ? 'c-f c-a' : v.t === 'DD' ? 'c-f' : '';
  if (v.t === 'NZ') {
    var o = v.open === undefined ? 'fa' : v.open;
    closed = ['n', 'f', 'a'].filter(function (m) { return o.indexOf(m) < 0; }).map(function (m) { return 'c-' + m; }).join(' ');
  }
  var lx = v.lx === undefined ? 0 : v.lx, ly = v.ly === undefined ? (v.r ? 5 : 30) : v.ly;
  return '<g class="v v' + v.t + ' ' + closed + '" transform="translate(' + v.x + ' ' + v.y + ')">' +
    '<g transform="rotate(' + (v.r || 0) + ')"><rect class="vb" x="-10" y="-14" width="20" height="28" rx="4"/><rect class="blade" x="-8" y="-1.5" width="16" height="3" rx="1.5"/></g>' +
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
    if (f) o.push('<polyline class="dflow fl-' + k + ' ' + modeCls(f) + '" points="' + pts(d.p) + '"/>');
  });
  (s.fan || []).forEach(function (f) { o.push(fanSvg(f)); });
  (s.v || []).forEach(function (v) { o.push(valveSvg(v)); });
  if (s.fire) {
    o.push('<g class="flame on-f ' + (s.three ? '' : 'on-a') + '" transform="translate(' + s.fire[0] + ' ' + s.fire[1] + ')"><g class="fl1"><path d="M0-22C9-11 12-5 12 3 12 11 6 15 0 15-6 15-12 11-12 3-12-3-8-7-5-12-4-7-3-5 0-4 2-9 2-15 0-22Z"/></g><g class="fl2"><path d="M0-5C4 0 6 3 6 7 6 11 3 13 0 13-3 13-6 11-6 7-6 3-3 0 0-5Z"/></g></g>');
  }
  (s.tx || []).forEach(function (t) {
    o.push('<text class="tx ' + (t.c === 'fp' ? 'tx-fp' : '') + '" x="' + t.x + '" y="' + t.y + '" text-anchor="' + (t.a || 'start') + '">' + t.t + '</text>');
  });
  o.push('</svg>');
  return o.join('');
}

function figure(id) {
  return '<figure class="fig"><div class="figsvg">' + drawScheme(id) + '</div><figcaption>' + SC[id].cap + '</figcaption></figure>';
}
