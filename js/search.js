/* Полнотекстовый поиск по всему справочнику.
   Индекс строится из отрисованных разделов (всё, что видно на страницах) + таблицы СИТИС СПН-1.
   Запрос: слова в любом порядке, каждое — по началу слова с отбрасыванием окончаний; "фраза в кавычках" — точно.
   Фильтры: раздел и норма. */
var SIDX = null, SFILT = { p: '', n: '' };
var S_UNITS = '.card, .mini, .catc, .stc > p, .stc li, tbody tr, .issue, article.norm, .cnotes li, p.tnote, .deg, .bstep';
var S_LAT = { a: 'а', c: 'с', e: 'е', o: 'о', p: 'р', x: 'х', y: 'у', k: 'к', m: 'м', t: 'т', h: 'н', b: 'в' };

function sNorm(s) {
  return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[a-z](?=[а-я])|(?<=[а-я])[a-z]/g, function (ch) { return S_LAT[ch] || ch; })
    .replace(/[«»"“”„()\[\];:!?]/g, ' ').replace(/\s+/g, ' ').trim();
}
function sStem(w) {
  if (w.length <= 4 || /\d/.test(w)) return w;
  var m = w.match(/^(.*?)(иями|ями|ами|ого|его|ому|ему|ыми|ими|ых|их|ые|ие|ой|ей|ий|ый|ая|яя|ое|ее|ов|ев|ам|ям|ах|ях|ом|ем|ую|юю|ия|ии|ию|ть|а|я|ы|и|е|о|у|ю|ь)$/);
  return m && m[1].length >= 4 ? m[1] : w;
}
function sBuild() {
  var idx = [], box = document.createElement('div');
  ROUTES.forEach(function (rt) {
    var p = rt[0]; if (p === 'search' || !PAGES[p]) return;
    try { box.innerHTML = PAGES[p](); } catch (e) { return; }
    var head = rt[1], h2 = '';
    [].forEach.call(box.querySelectorAll('h1, h2, h3.sth, ' + S_UNITS), function (el) {
      if (/^H[123]$/.test(el.tagName)) {
        var ht = el.textContent.trim();
        if (el.tagName !== 'H1') h2 = ht;
        var nx = el.nextElementSibling, lead = nx && /^P$/.test(nx.tagName) ? ' — ' + nx.textContent.trim() : '';
        idx.push({ p: p, pn: head, h: el.tagName === 'H1' ? '' : ht, t: '', x: ht + lead, n: sNorm(ht + lead), id: '', hd: 1 });
        return;
      }
      if (el.parentElement && el.parentElement.closest(S_UNITS) && !el.matches('.stc li, .stc > p')) return;
      var t = el.textContent.replace(/\s+/g, ' ').trim();
      if (t.length < 8) return;
      var ttl = el.querySelector('h3, h4, summary, .chead h3'), card = el.closest('.stc'), ctx = card ? card.querySelector('.sthead').textContent.trim() : '';
      idx.push({ p: p, pn: head, h: h2, t: ttl ? ttl.textContent.trim() : ctx, x: t, n: sNorm(ctx + ' ' + t), id: el.id || '' });
    });
  });
  var spn = [[window.SPN_T1, 'Табл. 1 СПН-1'], [window.SPN_T2, 'Табл. 2 СПН-1'], [window.SPN_T3, 'Табл. 3 СПН-1'], [window.SPN_T4, 'Табл. 4 СПН-1'], [window.SPN_T5, 'Табл. 5 СПН-1']];
  spn.forEach(function (tb) {
    (tb[0] || []).forEach(function (r) {
      if (!r.id) return;
      var t = r.n + (r.an ? ' — ' + r.an : '') + (r.qr ? ', qр = ' + r.qr + ' МДж/м²' : '');
      idx.push({ p: 'load', pn: 'Пожарная нагрузка', h: tb[1], t: r.n, x: t, n: sNorm(t + ' ' + r.id), id: '' });
    });
  });
  box.innerHTML = '';
  return idx;
}
function sParse(q) {
  var ph = [], rest = sNorm(String(q).replace(/["«“„]([^"»”]+)["»”]/g, function (m, a) { ph.push(sNorm(a)); return ' '; }));
  var words = rest.split(' ').filter(function (w) { return w.length > 0; }).map(sStem);
  return { ph: ph.filter(function (v, i, a) { return v && a.indexOf(v) === i; }), w: words };
}
function sMatch(u, q) {
  for (var i = 0; i < q.ph.length; i++) if (u.n.indexOf(q.ph[i]) < 0) return false;
  for (var j = 0; j < q.w.length; j++) {
    var w = q.w[j], re = /[\d.,]/.test(w) ? null : new RegExp('(^|[^а-яa-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (re ? !re.test(u.n) : u.n.indexOf(w) < 0) return false;
  }
  return true;
}
function sMark(text, q) {
  var h = esc(text), terms = q.ph.concat(q.w).filter(function (t) { return t.length > 1; });
  if (!terms.length) return h;
  var src = terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/е/g, '[её]'); }).join('|');
  return h.replace(new RegExp('(' + src + ')', 'gi'), '<mark>$1</mark>');
}
function sSnip(u, q) {
  var x = u.x, terms = q.ph.concat(q.w), pos = -1, low = x.toLowerCase().replace(/ё/g, 'е');
  terms.forEach(function (t) { var k = low.indexOf(t); if (k >= 0 && (pos < 0 || k < pos)) pos = k; });
  if (x.length > 320) { var s = Math.max(0, pos - 80); x = (s ? '… ' : '') + x.slice(s, s + 320) + (s + 320 < u.x.length ? ' …' : ''); }
  return sMark(x, q);
}
function sNormsOf(u) { return Object.keys(NORMS).filter(function (k) { return u.x.indexOf(NORMS[k].s) >= 0; }); }

PAGES.search = function (raw) {
  if (!SIDX) SIDX = sBuild();
  var q = sParse(raw), all = SIDX.filter(function (u) { return sMatch(u, q); });
  var byP = {}, byN = {};
  all.forEach(function (u) { byP[u.p] = (byP[u.p] || 0) + 1; sNormsOf(u).forEach(function (k) { byN[k] = (byN[k] || 0) + 1; }); });
  if (SFILT.p && !byP[SFILT.p]) SFILT.p = '';
  if (SFILT.n && !byN[SFILT.n]) SFILT.n = '';
  var r = all.filter(function (u) { return (!SFILT.p || u.p === SFILT.p) && (!SFILT.n || sNormsOf(u).indexOf(SFILT.n) >= 0); });
  var chips = function (obj, kind, name) {
    var ks = Object.keys(obj); if (ks.length < 2 && !SFILT[kind]) return '';
    return '<nav class="chips sfil" aria-label="' + name + '"><button type="button" data-sf="' + kind + ':"' + (SFILT[kind] ? '' : ' class="on"') + '>' + name + ': все</button>' +
      ks.map(function (k) { return '<button type="button" data-sf="' + kind + ':' + k + '"' + (SFILT[kind] === k ? ' class="on"' : '') + '>' + (kind === 'p' ? ROUTES.filter(function (x) { return x[0] === k; })[0][1] : NORMS[k].s) + ' · ' + obj[k] + '</button>'; }).join('') + '</nav>';
  };
  var groups = {}, order = [];
  r.slice(0, 300).forEach(function (u) { var g = u.p + '|' + u.h; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(u); });
  var body = order.map(function (g) {
    var u0 = groups[g][0];
    return '<section class="sgrp"><h2><a href="#' + u0.p + '" data-go="' + u0.p + '" data-h="' + esc(u0.h) + '">' + esc(u0.pn) + (u0.h ? ' → ' + esc(u0.h) : '') + '</a></h2>' +
      groups[g].map(function (u) {
        return '<a class="shit" href="#' + (u.id || u.p) + '" data-go="' + u.p + '" data-h="' + esc(u.h) + '" data-id="' + esc(u.id) + '">' + (u.t && u.x.indexOf(u.t) !== 0 ? '<b>' + sMark(u.t, q) + '</b> ' : '') + sSnip(u, q) + '</a>';
      }).join('') + '</section>';
  }).join('');
  return '<h1>Поиск: ' + esc(raw) + '</h1><p class="lead">Найдено ' + r.length + (r.length !== all.length ? ' из ' + all.length : '') + '. Слова — в любом порядке и по началу слова; фраза — в кавычках.</p>' +
    chips(byP, 'p', 'Раздел') + chips(byN, 'n', 'Норма') + body +
    (all.length ? (r.length > 300 ? '<p class="tnote">Показаны первые 300 — уточни запрос или фильтр.</p>' : '') : '<p>Ничего не нашлось. Попробуй короче: начало слова, номер пункта (6.10), обозначение (EI 60, Н2).</p>');
};

document.addEventListener('click', function (e) {
  var f = e.target.closest && e.target.closest('[data-sf]');
  if (f) { var kv = f.dataset.sf.split(':'); SFILT[kv[0]] = kv[1]; show('search', $('#q').value.trim()); return; }
  var a = e.target.closest && e.target.closest('[data-go]');
  if (!a) return;
  e.preventDefault();
  var p = a.dataset.go, h = a.dataset.h, id = a.dataset.id;
  $('#q').value = ''; SFILT = { p: '', n: '' };
  if (id && sectionOf(id)) { location.hash = id; return; }
  history.replaceState(null, '', '#' + p); show(p); statPage && statPage();
  setTimeout(function () {
    var t = id ? document.getElementById(id) : null;
    if (!t && h) t = [].filter.call(document.querySelectorAll('h2, h3'), function (x) { return x.textContent.trim() === h; })[0];
    if (t) { t.scrollIntoView({ block: 'start' }); t.classList.add('sflash'); setTimeout(function () { t.classList.remove('sflash'); }, 1600); } else window.scrollTo(0, 0);
  }, 60);
}, true);
