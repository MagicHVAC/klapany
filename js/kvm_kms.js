/* 1.23.0: сеть воздуховодов по участкам с набором элементов КМС — для расхода и давления всех систем ПДВ (ДП и ДВ).
   Потери участка: ΔP = R·l + Z, R = λ/Dэ·Pd, Z = Σξ·Pd, Pd = ρv²/2 (МР ВНИИПО п. 5.1, формулы (70)–(73)).
   λ — по Кольбруку (smkLam), как во всём «Расчёте ПДВ» (сверено с отчётами КВМ); МР дают Альтшуля (73) — разница в пределах долей процента.
   КМС: по МР п. 5.1 — «по справочным данным [8]» (Идельчик И.Е. Справочник по гидравлическим сопротивлениям, 1975),
   КМС противопожарного клапана — «по техническим данным предприятия-изготовителя». Своих чисел ξ сайт не подставляет:
   значение вводит инженер, сайт запоминает его для этого элемента (угол, форма) и предлагает в следующий раз.
   Шероховатость: сталь — k = 0,1 мм (МР п. 5.1, к формуле (73)); кирпич, бетон, прочее — вводит инженер, сайт запоминает.
   Надбавка на неучтённые потери, % — принимает инженер (по умолчанию 0). */
var KMS_MAT = [
  ['steel', 'Сталь (чёрная)', 0.1], ['galv', 'Сталь оцинкованная', 0.1], ['brick', 'Кирпичная шахта', NaN], ['conc', 'Бетонная шахта', NaN],
  ['block', 'Шахта из блоков, плит', NaN], ['flex', 'Гибкий воздуховод', NaN], ['other', 'Другой материал', NaN]];
var KMS_MAT_SRC = 'сталь — k = 0,1 мм по МР ВНИИПО п. 5.1 (к формуле (73)); прочие материалы — значение инженера';
/* [ключ, название, есть угол, подсказка источника] */
var KMS_T = [
  ['elb', 'Отвод (поворот)', true, 'Идельчик, разд. 6; угол и R/D — по проекту'],
  ['knee', 'Колено (поворот без закругления)', true, 'Идельчик, разд. 6'],
  ['teeS', 'Тройник — проход', false, 'Идельчик, разд. 7; ξ к скорости в участке'],
  ['teeB', 'Тройник — ответвление', false, 'Идельчик, разд. 7; ξ к скорости в участке'],
  ['cross', 'Крестовина', false, 'Идельчик, разд. 7'],
  ['conf', 'Переход — сужение (конфузор)', false, 'Идельчик, разд. 5'],
  ['diff', 'Переход — расширение (диффузор)', false, 'Идельчик, разд. 5'],
  ['suddE', 'Внезапное расширение', false, 'Идельчик, разд. 4'],
  ['suddC', 'Внезапное сужение', false, 'Идельчик, разд. 4'],
  ['inlet', 'Вход в канал (воздухозабор)', false, 'Идельчик, разд. 3'],
  ['outlet', 'Выход из канала (выброс)', false, 'Идельчик, разд. 11; динамическое давление на выходе — отдельным ξ = 1'],
  ['fdv', 'Клапан противопожарный', false, 'паспорт изготовителя (МР п. 5.1)'],
  ['valve', 'Клапан воздушный, обратный', false, 'паспорт изготовителя'],
  ['grille', 'Решётка', false, 'паспорт изготовителя'],
  ['louver', 'Жалюзийная решётка (наружная)', false, 'паспорт изготовителя'],
  ['umbr', 'Зонт, дефлектор, оголовок', false, 'Идельчик, разд. 11 или паспорт'],
  ['mesh', 'Сетка', false, 'Идельчик, разд. 8'],
  ['sil', 'Шумоглушитель', false, 'паспорт изготовителя'],
  ['flexI', 'Гибкая вставка', false, 'паспорт изготовителя'],
  ['node', 'Узел присоединения к шахте', false, 'Идельчик (МР п. 5.1)'],
  ['sum', 'Прочие КМС одним числом', false, 'сумма ξ, посчитанная отдельно'],
  ['other', 'Другой элемент', false, 'источник — указать в названии']];
var KMS_ANG = [15, 30, 45, 60, 75, 90, 120, 135, 150, 180];
function kmsT(k) { for (var i = 0; i < KMS_T.length; i++) if (KMS_T[i][0] === k) return KMS_T[i]; return KMS_T[KMS_T.length - 1]; }
function kmsMat(k) { for (var i = 0; i < KMS_MAT.length; i++) if (KMS_MAT[i][0] === k) return KMS_MAT[i]; return KMS_MAT[KMS_MAT.length - 1]; }

/* ---------- запоминание значений инженера ---------- */
var KMS_LIB = {};
try { KMS_LIB = JSON.parse(localStorage.getItem('klapany-kms-lib') || '{}') || {}; } catch (x) { KMS_LIB = {}; }
function kmsLibSave() { try { localStorage.setItem('klapany-kms-lib', JSON.stringify(KMS_LIB)); } catch (x) {} }
function kmsElKey(e, s) { return 'el|' + e.t + '|' + (kmsT(e.t)[2] ? (e.ang || 90) : '') + '|' + (s.rect ? 'r' : 'c'); }

/* ---------- данные по умолчанию ---------- */
function kmsSec(o) {
  var s = { nm: 'Участок 1', mat: 'galv', eps: '', rect: true, a: 800, b: 500, len: 10, els: [] };
  for (var k in o) s[k] = o[k];
  return s;
}
function kmsNetDef(d) { /* перенос старого «один воздуховод + Σξ» в сеть из 1 участка */
  d = d || {};
  var rect = d.D ? false : !!d.rect, a = d.D || d.a || 800, b = d.b || a;
  return { add: 0, secs: [kmsSec({ nm: 'От вентилятора до шахты', mat: 'galv', eps: isFinite(d.eps) && d.eps !== 0.1 ? d.eps : '', rect: rect, a: a, b: b, len: d.len || 0, els: [{ t: 'sum', xi: isFinite(d.xi) ? d.xi : 0, n: 1 }] })] };
}
/* сеть есть у каждой системы: подпор — p.net, дымоудаление — p.netOut (от вентилятора до выброса) */
function kmsCompDef(c) { /* перенос прежних полей компенсации: магистраль (+ ζ воздухозабора) и шахта */
  c = c || {};
  return { add: 0, secs: [
    kmsSec({ nm: 'Магистраль от воздухозабора', mat: 'galv', rect: true, a: c.mA || 800, b: c.mB || 500, len: isFinite(c.mL) ? c.mL : 10, els: [{ t: 'inlet', xi: isFinite(c.inZ) ? c.inZ : '', n: 1 }, { t: 'sum', xi: isFinite(c.mZ) ? c.mZ : 0, n: 1 }] }),
    kmsSec({ nm: 'Шахта до этажа пожара', mat: 'galv', rect: true, a: c.sA || 800, b: c.sB || 500, len: isFinite(c.sL) ? c.sL : 45, els: [{ t: 'sum', xi: isFinite(c.sZ) ? c.sZ : 0, n: 1 }] })] };
}
function kmsEnsure(mode, p) {
  if (mode === 'smk') { if (!p.netOut) p.netOut = { add: 0, secs: [] }; if (!p.compNet && p.comp) p.compNet = kmsCompDef(p.comp); return p.netOut; }
  if (!p.net) p.net = kmsNetDef(p.duct);
  return p.net;
}

/* ---------- расчёт ---------- */
function kmsEps(s) {
  var m = kmsMat(s.mat), e = s.eps === '' || s.eps == null ? NaN : +s.eps;
  if (isFinite(e) && e >= 0) return e;
  if (isFinite(m[2])) return m[2];
  var lib = KMS_LIB['eps|' + s.mat];
  return lib && isFinite(lib.v) ? lib.v : NaN;
}
/* G — кг/с (расход системы у вентилятора), ro — кг/м³, nu — м²/с.
   Разветвлённая сеть: у участка s.up — номер участка ближе к вентилятору (0 — сам вентилятор; пусто — предыдущий),
   s.q — доля расхода системы на участке, %. Давление сети — по самой нагруженной ветви (наибольшая сумма потерь от вентилятора до конца ветви).
   Элемент с живым сечением e.F (м²) и числом параллельно e.np: скорость в изделии v = G/(ρ·np·F), потери ξ·ρv²/2 — к этой скорости (как в паспортах клапанов и решёток). */
function kmsUp(s, i) { var u = s.up === '' || s.up == null ? i : +s.up; return isFinite(u) && u >= 0 && u <= i ? u : i; }
function kmsNet(G, ro, nu, net, label) {
  var r = { rows: [], P0: 0, P: 0, add: +(net && net.add) || 0, err: [], v: 0, f: 0, Pd: 0, F: 0, De: 0, G: G, ro: ro, path: [], branched: false };
  if (!net || !net.secs || !net.secs.length) return r;
  var sum = [];
  net.secs.forEach(function (s, i) {
    var nm = (label ? label + ', ' : '') + (s.nm || ('участок ' + (i + 1)));
    var up = kmsUp(s, i), q = s.q === '' || s.q == null || !isFinite(+s.q) ? 100 : +s.q, Gs = G * q / 100;
    if (up !== i || q !== 100) r.branched = true;
    var a = s.a / 1000, b = (s.rect ? s.b : s.a) / 1000, F = s.rect ? a * b : Math.PI * a * a / 4, De = s.rect ? 2 * a * b / (a + b) : a;
    var eps = kmsEps(s);
    if (!(F > 0)) { r.err.push(nm + ': задай размеры сечения.'); sum.push(up ? sum[up - 1] || 0 : 0); return; }
    if (!isFinite(eps)) { r.err.push(nm + ': задай шероховатость k для «' + kmsMat(s.mat)[1] + '», мм — в МР дана только для стали (0,1 мм).'); eps = 0; }
    var v = Gs / ro / F, Pd = ro * v * v / 2, Re = v * De / nu, lam = smkLam(Re, eps / 1000, De), R = lam / De * Pd, Rl = R * (+s.len || 0);
    var xi = 0, Z = 0, els = [];
    (s.els || []).forEach(function (e) {
      var t = kmsT(e.t), n = isFinite(+e.n) && +e.n > 0 ? +e.n : 1, x = e.xi === '' || e.xi == null ? NaN : +e.xi;
      var Fe = +e.F > 0 ? +e.F : 0, np = +e.np >= 1 ? Math.round(+e.np) : 1;
      var title = (e.nm ? e.nm : t[1]) + (t[2] ? ' ' + (e.ang || 90) + '°' : '');
      if (!isFinite(x)) { r.err.push(nm + ': задай ξ для «' + title + '» (' + t[3] + ').'); x = 0; }
      var ve = Fe ? Gs / ro / (np * Fe) : v, Pde = ro * ve * ve / 2, ze = x * n * Pde;
      xi += Fe ? 0 : x * n; Z += ze;
      els.push({ title: title, xi: x, n: n, F: Fe, np: np, v: ve, Pd: Pde, Z: ze });
    });
    var P = Rl + Z, Pp = (up ? sum[up - 1] || 0 : 0) + P;
    sum.push(Pp);
    r.rows.push({ i: i + 1, up: up, q: q, Gs: Gs, nm: s.nm || ('Участок ' + (i + 1)), mat: kmsMat(s.mat)[1], eps: eps, rect: s.rect, a: s.a, b: s.b, len: +s.len || 0, F: F, De: De,
      L: Gs / ro * 3600, v: v, Pd: Pd, Re: Re, lam: lam, R: R, Rl: Rl, xi: xi, Z: Z, P: P, Pp: Pp, els: els });
    if (v > r.v) { r.v = v; r.f = lam; r.Pd = Pd; r.F = F; r.De = De; }
  });
  /* самая нагруженная ветвь */
  var k = -1; r.rows.forEach(function (x, j) { if (k < 0 || x.Pp > r.rows[k].Pp) k = j; });
  if (k >= 0) { r.P0 = r.rows[k].Pp; for (var x = r.rows[k]; x; x = x.up ? r.rows.filter(function (y) { return y.i === x.up; })[0] : null) { r.path.unshift(x.i); x.crit = true; } }
  r.dPadd = r.P0 * r.add / 100; r.P = r.P0 + r.dPadd;
  return r;
}

/* ---------- форма: редактор сети ---------- */
function kmsOpt(list, v) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); }
function kmsNum(v) { return v === '' || v == null || (typeof v === 'number' && !isFinite(v)) ? '' : String(v).replace(/"/g, '&quot;'); }
function kmsForm(mode, p) {
  var net = kmsEnsure(mode, p), key = mode === 'smk' ? 'netOut' : 'net';
  return kmsBox(key, mode === 'smk' ? 'Сеть от вентилятора до выброса (ДВ)' : 'Сеть от воздухозабора до шахты или канала (ДП)', net);
}
function kmsBox(key, title, net) { return '<h3 class="nh">' + title + '</h3><div class="kms" id="kms-' + key + '">' + kmsInner(net, key) + '</div>'; }
function kmsNote(key) {
  if (key === 'compNet') return 'Участки компенсирующей подачи от воздухозабора до НЗ клапана этажа пожара. Клапан и решётка в помещении — полями выше (к их скоростям).';
  return key === 'netOut' ? 'Участки за вентилятором до выброса. Нет участков — берётся «Сопротивление воздуховодов до выброса» числом (только при выбросе на фасад).' :
    'Участки от воздухозабора до входа в шахту (клетку, канал). Расход — подача вентилятора, плотность — по наружному воздуху зимой.';
}
function kmsInner(net, key) {
  var h = '<p class="sub">' + kmsNote(key) + ' ξ — по Идельчику (МР п. 5.1, ссылка [8]) или по паспорту изделия; введённое значение запоминается для этого элемента.</p>';
  net.secs.forEach(function (s, si) {
    var id = key + '|' + si, m = kmsMat(s.mat), epsAuto = isFinite(m[2]) ? m[2] : (KMS_LIB['eps|' + s.mat] || {}).v;
    h += '<div class="kmss"><div class="kmsh"><b>' + (si + 1) + '.</b>' +
      '<input class="kmsn" data-kn="' + id + '|nm" type="text" value="' + kmsNum(s.nm) + '" aria-label="Название участка">' +
      '<button type="button" class="eibtn kmsx" data-kdel="' + key + '|sec|' + si + '" title="Удалить участок">×</button></div>' +
      '<div class="trpick stpick">' +
      '<div class="stf"><label>Материал</label><select data-kn="' + id + '|mat">' + kmsOpt(KMS_MAT, s.mat) + '</select></div>' +
      '<div class="stf"><label>k — шероховатость, мм</label><input data-kn="' + id + '|eps" type="number" step="any" inputmode="decimal" value="' + kmsNum(s.eps) + '" placeholder="' + (isFinite(epsAuto) ? String(epsAuto).replace('.', ',') : 'задай') + '"></div>' +
      '<div class="stf"><label>Сечение</label><select data-kn="' + id + '|rect">' + kmsOpt([[true, 'прямоугольное'], [false, 'круглое']], s.rect) + '</select></div>' +
      '<div class="stf"><label>' + (s.rect ? 'a, мм' : 'D, мм') + '</label><input data-kn="' + id + '|a" type="number" step="any" value="' + kmsNum(s.a) + '"></div>' +
      (s.rect ? '<div class="stf"><label>b, мм</label><input data-kn="' + id + '|b" type="number" step="any" value="' + kmsNum(s.b) + '"></div>' : '') +
      '<div class="stf"><label>Длина l, м</label><input data-kn="' + id + '|len" type="number" step="any" value="' + kmsNum(s.len) + '"></div>' +
      '<div class="stf"><label>Идёт от</label><select data-kn="' + id + '|up">' + kmsOpt([[0, 'вентилятора']].concat(net.secs.slice(0, si).map(function (x, j) { return [j + 1, 'участка ' + (j + 1)]; })), kmsUp(s, si)) + '</select></div>' +
      '<div class="stf"><label>Доля расхода системы, %</label><input data-kn="' + id + '|q" type="number" step="any" value="' + kmsNum(s.q == null ? 100 : s.q) + '"><small class="dhint">ветвь — её доля; магистраль — 100</small></div></div>' +
      '<div class="tscroll"><table class="vei kmst"><thead><tr><th>Элемент КМС</th><th>Угол</th><th>ξ</th><th>шт.</th><th title="живое сечение одного изделия по паспорту; пусто — ξ к скорости в воздуховоде">Fж, м²</th><th title="сколько изделий стоит параллельно — расход делится между ними">параллельно</th><th>Источник ξ</th><th></th></tr></thead><tbody>' +
      (s.els || []).map(function (e, ei) {
        var t = kmsT(e.t), eid = key + '|' + si + '|' + ei;
        return '<tr><td><select data-ke="' + eid + '|t">' + kmsOpt(KMS_T, e.t) + '</select>' + (e.t === 'other' ? '<input data-ke="' + eid + '|nm" type="text" placeholder="название" value="' + kmsNum(e.nm) + '">' : '') + '</td>' +
          '<td>' + (t[2] ? '<select data-ke="' + eid + '|ang">' + kmsOpt(KMS_ANG.map(function (x) { return [x, x + '°']; }), e.ang || 90) + '</select>' : '—') + '</td>' +
          '<td><input data-ke="' + eid + '|xi" type="number" step="any" inputmode="decimal" value="' + kmsNum(e.xi) + '" placeholder="ξ"' + (e.xi === '' || e.xi == null ? ' class="kmsneed"' : '') + '></td>' +
          '<td><input data-ke="' + eid + '|n" type="number" step="1" min="1" value="' + kmsNum(e.n || 1) + '"></td>' +
          '<td><input data-ke="' + eid + '|F" type="number" step="any" placeholder="—" value="' + kmsNum(e.F) + '"></td>' +
          '<td><input data-ke="' + eid + '|np" type="number" step="1" min="1" value="' + kmsNum(e.np || 1) + '"></td>' +
          '<td class="kmssrc">' + t[3] + '</td><td><button type="button" class="eibtn kmsx" data-kdel="' + key + '|el|' + si + '|' + ei + '" title="Удалить элемент">×</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="dpbtns"><button type="button" class="eibtn" data-kadd="' + key + '|el|' + si + '">+ элемент КМС</button></div></div>';
  });
  h += '<div class="dpbtns"><button type="button" class="eibtn" data-kadd="' + key + '|sec">+ участок</button>' +
    '<div class="stf kmsadd"><label>Надбавка на неучтённые потери, %</label><input data-knet="' + key + '|add" type="number" step="any" value="' + kmsNum(net.add || 0) + '"><small class="dhint">принимает инженер</small></div></div>';
  return h;
}

/* ---------- климатология: город → температуры и ветер (СП 131.13330.2025) ---------- */
function kmsClimForm(mode, p) {
  if (!window.KV_CLIM) return '';
  var opts = KV_CLIM.rows.map(function (r) { return '<option value="' + esc(r[1] + ' — ' + r[0]) + '">'; }).join('');
  return '<h3 class="nh">Климат района строительства</h3><div class="trpick stpick">' +
    '<div class="stf"><label for="kms-city">Город (СП 131.13330.2025)</label><input id="kms-city" data-kclim="city" type="text" list="kms-cities" autocomplete="off" placeholder="начни вводить" value="' + kmsNum(p.city || '') + '"><datalist id="kms-cities">' + opts + '</datalist></div>' +
    (mode === 'smk' ? '<div class="stf"><label for="kms-summ">Лето для расчёта дыма</label><select id="kms-summ" data-kclim="summ">' + kmsOpt([['A', 'параметры А'], ['B', 'параметры Б']], p.climSumm || 'A') + '</select></div>' : '') +
    '<p class="tnote">' + kmsClimNote(mode, p) + '</p></div>';
}
function kmsClimNote(mode, p) {
  var r = kmsClimRow(p.city);
  if (!r) return 'Выбери город — температуры и ветер подставятся в поля ниже. По МР ВНИИПО п. 2.4 параметры наружного воздуха — по нормам; по СП 60.13330.2020 п. 5.13: А — вентиляция в тёплый период, Б — холодный период. Ветер — наибольшая из средних скоростей по румбам за январь (СП 131.13330).';
  return esc(r[1]) + ': зима (Б) ' + r[2] + ' °C; лето А ' + r[3] + ' °C' + (r[4] != null ? ', Б ' + r[4] + ' °C' : '') + '; ветер январь ' + (r[5] != null ? String(r[5]).replace('.', ',') + ' м/с' : '—') + '. Источник: ' + esc(KV_CLIM.src.split(';')[0]) + '.';
}
function kmsClimRow(s) {
  if (!s || !window.KV_CLIM) return null;
  var q = String(s).toLowerCase().trim();
  for (var i = 0; i < KV_CLIM.rows.length; i++) { var r = KV_CLIM.rows[i]; if ((r[1] + ' — ' + r[0]).toLowerCase() === q) return r; }
  for (i = 0; i < KV_CLIM.rows.length; i++) if (KV_CLIM.rows[i][1].toLowerCase() === q) return KV_CLIM.rows[i];
  return null;
}
function kmsClimApply(mode, p) {
  var r = kmsClimRow(p.city); if (!r) return false;
  if (mode === 'smk') { p.tOut = p.climSumm === 'B' && r[4] != null ? r[4] : r[3]; p.tComp = r[2]; if (r[5] != null) p.wind = r[5]; }
  else { p.air = p.air || {}; p.air.ta = r[2]; if (r[5] != null && !(mode === 'tamb' && p.air.va === 0)) p.air.va = r[5]; }
  return true;
}

/* ---------- отчёт: таблица участков ---------- */
function kmsRep(r, title) {
  if (!r || !r.rows.length) return '';
  var f = rf, h = '<p class="rep-p"><b>' + title + '</b>. ΔP = R·l + Z; R = λ/D<sub>э</sub>·P<sub>d</sub>; Z = Σξ·P<sub>d</sub>; P<sub>d</sub> = ρv²/2 (МР ВНИИПО п. 5.1). ρ = ' + f(r.ro, 3) + ' кг/м³; G = ' + f(r.G, 3) + ' кг/с; λ — по Кольбруку; шероховатость: ' + KMS_MAT_SRC + '.</p>';
  var br = r.branched;
  h += repT(['№'].concat(br ? ['От', 'Доля, %'] : []).concat(['Участок', 'Материал, k, мм', 'Сечение, мм', 'l, м', 'L, м³/ч', 'v, м/с', 'λ', 'R, Па/м', 'R·l, Па', 'Z, Па', 'ΔP, Па']).concat(br ? ['От вент., Па'] : []),
    r.rows.map(function (x) {
      return [x.i + (br && x.crit ? ' *' : '')].concat(br ? [x.up || 'вент.', f(x.q, 0)] : []).concat([esc(x.nm), x.mat + ', ' + f(x.eps, 2), x.rect ? f(x.a, 0) + '×' + f(x.b, 0) : '⌀' + f(x.a, 0), f(x.len, 1), f(x.L, 0), f(x.v, 2), f(x.lam, 4), f(x.R, 3), f(x.Rl, 2), f(x.Z, 2), f(x.P, 2)]).concat(br ? [f(x.Pp, 2)] : []);
    }), 'rep-net');
  h += repT(['Участок', 'Элемент КМС', 'ξ', 'шт.', 'F<sub>ж</sub> × параллельно, м²', 'v, м/с', 'P<sub>d</sub>, Па', 'Z, Па'], [].concat.apply([], r.rows.map(function (x) {
    return x.els.length ? x.els.map(function (e, j) { return [j ? '' : x.i + '. ' + esc(x.nm), esc(e.title), f(e.xi, 2), e.n, e.F ? f(e.F, 3) + ' × ' + e.np : 'по воздуховоду', f(e.v, 2), f(e.Pd, 2), f(e.Z, 2)]; }) : [[x.i + '. ' + esc(x.nm), 'нет местных сопротивлений', '', '', '', '', '', '0']];
  })));
  if (br) h += '<p class="rep-p">Сеть разветвлённая: давление — по самой нагруженной ветви (участки ' + r.path.join(' → ') + ', отмечены *).</p>';
  h += repF('Потери в сети', 'ΔP<sub>сети</sub> = ' + (br ? 'max по ветвям ' : '') + 'Σ(R·l + Z)' + (r.add ? '·(1 + ' + f(r.add, 0) + '/100)' : ''), f(r.P0, 2) + (r.add ? ' · ' + f(1 + r.add / 100, 2) : ''), f(r.P, 2) + ' Па');
  return h;
}

/* ---------- события ---------- */
function kmsNetOf(key) { return KV.p && KV.p[key]; }
function kmsRedraw(key) {
  var box = document.getElementById('kms-' + key), net = kmsNetOf(key);
  if (box && net) box.innerHTML = kmsInner(net, key);
  if (window.hintsAttach) hintsAttach();
}
document.addEventListener('input', function (e) {
  var t = e.target, d = t.dataset || {}, v = t.value, a, net, s, el;
  if (d.kn) {
    a = d.kn.split('|'); net = kmsNetOf(a[0]); if (!net) return; s = net.secs[+a[1]];
    if (a[2] === 'rect') s.rect = v === 'true';
    else if (a[2] === 'mat') { s.mat = v; s.eps = ''; }
    else if (a[2] === 'nm') s.nm = v;
    else if (a[2] === 'up') s.up = +v;
    else { s[a[2]] = v === '' ? '' : smkNum(v); if (a[2] === 'eps' && v !== '' && !isFinite(kmsMat(s.mat)[2])) { KMS_LIB['eps|' + s.mat] = { v: smkNum(v) }; kmsLibSave(); } }
    if (t.tagName === 'SELECT') kmsRedraw(a[0]);
    kvCalc(); return;
  }
  if (d.ke) {
    a = d.ke.split('|'); net = kmsNetOf(a[0]); if (!net) return; s = net.secs[+a[1]]; el = s.els[+a[2]];
    if (a[3] === 't' || a[3] === 'ang') {
      el[a[3]] = a[3] === 'ang' ? +v : v; if (el.t !== 'other') delete el.nm;
      var lib = KMS_LIB[kmsElKey(el, s)]; el.xi = lib && isFinite(lib.v) ? lib.v : '';
      kmsRedraw(a[0]);
    } else if (a[3] === 'nm') el.nm = v;
    else if (a[3] === 'xi') {
      el.xi = v === '' ? '' : smkNum(v); t.classList.toggle('kmsneed', v === '');
      if (v !== '' && el.t !== 'sum' && el.t !== 'other') { KMS_LIB[kmsElKey(el, s)] = { v: smkNum(v) }; kmsLibSave(); }
    } else if (a[3] === 'F') el.F = v === '' ? '' : smkNum(v);
    else if (a[3] === 'np') el.np = Math.max(1, Math.round(smkNum(v)) || 1);
    else el.n = smkNum(v) || 1;
    kvCalc(); return;
  }
  if (d.knet) { a = d.knet.split('|'); net = kmsNetOf(a[0]); if (net) { net.add = smkNum(v); kvCalc(); } return; }
  if (d.kclim && KV.p) {
    if (d.kclim === 'city') KV.p.city = v; else KV.p.climSumm = v;
    if (kmsClimApply(KV.mode, KV.p)) { var city = KV.p.city; $('#kv-form').innerHTML = kvForm(); if (window.hintsAttach) hintsAttach(); var c = $('#kms-city'); if (c && d.kclim === 'city') { c.focus(); c.value = city; } kvCalc(); }
  }
});
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-kadd],[data-kdel]'); if (!b || !KV.p) return;
  var a = (b.dataset.kadd || b.dataset.kdel).split('|'), net = kmsNetOf(a[0]); if (!net) return;
  if (b.dataset.kadd) {
    if (a[1] === 'sec') { var last = net.secs[net.secs.length - 1]; net.secs.push(last ? JSON.parse(JSON.stringify(last)) : kmsSec({})); net.secs[net.secs.length - 1].nm = 'Участок ' + net.secs.length; net.secs[net.secs.length - 1].up = ''; }
    else { var s = net.secs[+a[2]], el = { t: 'elb', ang: 90, n: 1, xi: '' }, lib = KMS_LIB[kmsElKey(el, s)]; if (lib) el.xi = lib.v; s.els.push(el); }
  } else {
    if (a[1] === 'sec') { /* номера «идёт от» у следующих участков сдвигаются; ветвь от удалённого — к его родителю */
      var di = +a[2], dUp = kmsUp(net.secs[di], di);
      net.secs.forEach(function (x, j) { if (j <= di) return; var u = kmsUp(x, j); x.up = u === di + 1 ? dUp : u > di + 1 ? u - 1 : u; });
      net.secs.splice(di, 1);
    } else net.secs[+a[2]].els.splice(+a[3], 1);
  }
  kmsRedraw(a[0]); kvCalc();
});
