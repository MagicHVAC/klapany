/* Анимированный разрез клапана для раздела «Как работает». Фазы: n работа, f пожар, a после. */
var AN_FLOW = {
  NO: [['n', 'air', 'both'], ['f', 'smoke', 'left']],
  NZ: [['f', 'smoke', 'both'], ['a', 'smoke', 'both']],
  DD: [['n', 'air', 'both'], ['f', 'smoke', 'left'], ['a', 'smoke', 'both']]
};
/* Когда горит линия команды: НО и НЗ получают сигнал «Пожар», ДД — ещё и команду на открытие после */
var AN_SIG = { NO: 'f', NZ: 'f', DD: 'fa' };
/* Какой абзац HOW показывать под разрезом в каждой фазе */
var AN_KEY = { NO: { n: 'Работа', f: 'Пожар', a: 'Безопасный отказ' }, NZ: { n: 'Работа', f: 'Пожар', a: 'Без питания' }, DD: { n: 'Работа', f: 'Пожар', a: 'После' } };

function anatomySvg(h) {
  var t = h.t, o = ['<svg viewBox="0 0 360 210" role="img" aria-label="Разрез клапана: ' + h.h + '">'];
  o.push('<rect class="an-duct" x="8" y="96" width="344" height="64" rx="4"/>');
  o.push('<text class="zl" x="14" y="186">Воздуховод</text><text class="zl" x="346" y="186" text-anchor="end">к вентилятору</text>');
  AN_FLOW[t].forEach(function (f) {
    var right = [[200, 128], [352, 128]], left = [[8, 128], [160, 128]];
    o.push(particles({ p: left }, f[1], f[0]));
    if (f[2] === 'both') o.push(particles({ p: right }, f[1], f[0]));
  });
  /* линия команды от приёмно-контрольного прибора к приводу */
  o.push('<rect class="an-box" x="10" y="14" width="74" height="36" rx="6"/><text class="an-bt" x="47" y="37" text-anchor="middle">АПС</text>');
  o.push('<polyline class="an-wire" points="84,32 150,32"/><polyline class="an-sig ' + modeCls(AN_SIG[t]) + '" points="84,32 150,32"/>');
  /* привод */
  o.push('<rect class="an-box an-drv" x="150" y="10" width="60" height="46" rx="6"/><text class="an-bt" x="180" y="70" text-anchor="middle">привод</text>');
  o.push('<g class="gear" transform="translate(166 33)"><circle r="8"/><path d="M0-12V-8M0 8v4M-12 0h4M8 0h4M-8.5-8.5l2.8 2.8M5.7 5.7l2.8 2.8M-8.5 8.5l2.8-2.8M5.7-5.7l2.8-2.8"/></g>');
  if (t === 'NO') o.push('<path class="spring" d="M184 33l3-6 4 12 4-12 4 12 4-12 3 6"/>');
  else o.push('<rect class="an-mot" x="184" y="24" width="20" height="18" rx="3"/>');
  o.push('<line class="an-shaft" x1="180" y1="56" x2="180" y2="94"/>');
  /* корпус и заслонка — тем же классом, что в схемах */
  var v = valveSvg({ x: 180, y: 128, t: t, open: t === 'NZ' ? 'fa' : undefined });
  o.push('<g class="an-v" transform="translate(180 128) scale(2.2) translate(-180 -128)">' + v + '</g>');
  o.push('</svg>');
  return o.join('');
}

function howCard(h) {
  var c = valveSvg({ x: 0, y: 0, t: h.t, open: h.t === 'NZ' ? 'fa' : undefined }).match(/class="v ([^"]*)"/)[1];
  return '<article class="how c' + h.t + '"><div class="chead">' + tag(h.t) + '<h3>' + h.h + '</h3></div>' +
    '<div class="howgrid"><figure class="fig an ' + c + '"><div class="figsvg">' + anatomySvg(h) + '</div>' + phaseBar() +
    '<div class="steps">' + PHASES.map(function (p) { return '<p class="st-' + p[0] + '"><b>' + h.s[p[0]] + '.</b> ' + h.p.filter(function (x) { return x[0] === AN_KEY[h.t][p[0]]; }).map(function (x) { return x[1]; })[0] + '</p>'; }).join('') + '</div></figure>' +
    '<dl class="howdl">' + h.p.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl></div>' + refs(h.r) + '</article>';
}

function howTimeline() {
  return '<div class="tscroll"><table class="tline"><thead><tr><th>Клапан</th>' + PHASES.map(function (p) { return '<th class="tl-' + p[0] + '">' + p[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
    HOW.map(function (h) {
      return '<tr><th scope="row">' + tag(h.t) + ' ' + h.h + '</th>' + PHASES.map(function (p) {
        var open = vstate({ t: h.t, open: h.t === 'NZ' ? 'fa' : undefined }, p[0]);
        return '<td class="tl-' + p[0] + '"><span class="mk ' + (open ? 'm-yes' : 'm-ban') + '">' + (open ? 'открыт' : 'закрыт') + '</span></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
}
