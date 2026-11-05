/* Счётчик посещений через Umami Cloud: без cookie, без личных данных.
   Пока STATS_ID пустой, ничего не загружается и никуда не отправляется.
   Что видно в кабинете Umami:
   - посещения и просмотры, длительность визита (считает сам Umami);
   - какие разделы и случаи открывают: адреса /klapany/no, /klapany/no-floor и т. д.;
   - событие «session»: секунд на сайте и диапазон, отправляется при уходе со страницы;
   - событие «search»: что искали в поиске. */
var STATS_ID = '';

var STAT = { t0: Date.now(), last: '' };
function statOn() { return !!(STATS_ID && window.umami && location.protocol === 'https:'); }
function statPage() {
  if (!statOn()) return;
  var h = location.hash.slice(1) || 'home';
  if (h === STAT.last) return;
  STAT.last = h;
  umami.track(function (p) { p.url = '/klapany/' + (h === 'home' ? '' : h); p.title = document.title + ' · ' + h; return p; });
}
function statRange(s) { return s < 60 ? 'до 1 мин' : s < 300 ? '1–5 мин' : s < 900 ? '5–15 мин' : 'больше 15 мин'; }

(function () {
  if (!STATS_ID || location.protocol !== 'https:') return;
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://cloud.umami.is/script.js';
  s.setAttribute('data-website-id', STATS_ID);
  s.setAttribute('data-auto-track', 'false');
  s.setAttribute('data-domains', 'magichvac.github.io');
  s.onload = statPage;
  document.head.appendChild(s);
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.querySelector('.foot');
    if (f) f.insertAdjacentHTML('afterbegin', '<span class="muted">Посещения считаются без cookie и личных данных (Umami). </span>');
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'hidden' || !statOn()) return;
    var sec = Math.round((Date.now() - STAT.t0) / 1000);
    umami.track('session', { sec: sec, range: statRange(sec), page: STAT.last });
  });

  var qt = null;
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'q') return;
    clearTimeout(qt);
    var v = e.target.value.trim();
    if (v.length >= 3) qt = setTimeout(function () { if (statOn()) umami.track('search', { q: v.slice(0, 60) }); }, 1500);
  });
})();
