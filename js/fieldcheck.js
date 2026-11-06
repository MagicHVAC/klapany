/* Подсветка ошибок в полях форм расчётов: красное — расчёт невозможен или нарушена норма, жёлтое — проверь.
   Сообщение выводится под полем вместо подсказки. Используют dpu.js, farea.js, aupt.js, stairs.js. */
function fcClear(prefix) {
  [].forEach.call(document.querySelectorAll('.stf.bad, .stf.warnf'), function (f) {
    var inp = f.querySelector('input, select'); if (!inp || inp.id.indexOf(prefix) !== 0) return;
    f.classList.remove('bad', 'warnf'); var m = f.querySelector('.ferr'); if (m) m.remove();
  });
}
function fcMark(id, level, msg) {
  var inp = document.getElementById(id); if (!inp) return;
  var f = inp.closest('.stf'); if (!f) return;
  if (f.classList.contains('bad') && level !== 'bad') return;
  f.classList.remove('bad', 'warnf'); f.classList.add(level === 'bad' ? 'bad' : 'warnf');
  var m = f.querySelector('.ferr'); if (!m) { m = document.createElement('small'); m.className = 'ferr'; f.appendChild(m); }
  m.textContent = msg;
}
/* проверка обязательных чисел: список [id, подпись, min, max, строго больше min] */
function fcNums(list, out) {
  list.forEach(function (x) {
    var e = document.getElementById(x[0]); if (!e || e.closest('[hidden]')) return;
    var s = String(e.value).replace(',', '.').trim(), v = parseFloat(s);
    if (s === '' || !isFinite(v)) { out.push([x[0], 'bad', 'Введи число']); return; }
    if (x[4] ? v <= x[2] : v < x[2]) out.push([x[0], 'bad', (x[4] ? 'Должно быть больше ' : 'Не меньше ') + String(x[2]).replace('.', ',')]);
    else if (x[3] !== undefined && x[3] !== null && v > x[3]) out.push([x[0], 'bad', 'Не больше ' + String(x[3]).replace('.', ',')]);
  });
  return out;
}
function fcApply(prefix, marks) {
  fcClear(prefix);
  (marks || []).forEach(function (m) { fcMark(m[0], m[1], m[2]); });
  return (marks || []).some(function (m) { return m[1] === 'bad'; });
}
