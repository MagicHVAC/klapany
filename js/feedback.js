/* 1.33.0, инженер 08.11.2026: «сделай обратную связь, чтоб мне приходило письмо с сайта; чтоб мою почту не видели».
   Своего сервера у сайта нет — приём формы через FormSubmit (formsubmit.co): сообщение уходит письмом автору.
   Адрес автора на страницах и в коде НЕ указывается нигде (ни в подвале, ни в подсказках, без mailto). Приём — по кодовому имени
   формы FormSubmit (FB_ID).
   Скрытое поле fbhp — ловушка для роботов. Страница и версия подставляются сами. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var FB_ID = '8ea1fa513bd3978c550f4374da796f4d';   /* кодовое имя формы FormSubmit (подтверждено автором 08.11.2026) — адреса в коде нет */
  function FB_URL() { return 'https://formsubmit.co/ajax/' + FB_ID; }
  var KIND = ['Ошибка в норме или ссылке', 'Ошибка в расчёте', 'Предложение, дополнение', 'Вопрос', 'Другое'];
  function where() {
    var pg = { 'index.html': 'Пожарная безопасность', 'vent.html': 'Воздухообмены', 'clim.html': 'Климатология' }[location.pathname.split('/').pop() || 'index.html'] || 'Пожарная безопасность';
    var h = decodeURIComponent(location.hash.slice(1));
    return pg + (h ? ' · ' + h : '');
  }
  var dlg = document.createElement('dialog');
  dlg.id = 'fbdlg'; dlg.className = 'fbdlg';
  dlg.innerHTML = '<form method="dialog" class="fbform"><h3>Написать автору</h3>' +
    '<label>Что<select id="fbk">' + KIND.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></label>' +
    '<label>Где<input id="fbw" type="text" autocomplete="off"></label>' +
    '<label>Сообщение<textarea id="fbm" rows="6" placeholder="Что не так или что добавить. Если ошибка в норме — пункт и редакция документа."></textarea></label>' +
    '<label>Как ответить — по желанию<input id="fbc" type="text" autocomplete="email" placeholder="почта, телефон или Telegram"></label>' +
    '<input type="text" id="fbhp" tabindex="-1" autocomplete="off" class="fbhp" aria-hidden="true">' +
    '<p class="fbnote" id="fbnote"></p>' +
    '<div class="fbbtns"><button type="button" class="eibtn on" id="fbpost">Отправить</button><button type="button" class="eibtn" id="fbclose">Закрыть</button></div></form>';
  document.body.appendChild(dlg);
  function note(s) { $('#fbnote').textContent = s; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.id === 'fbopen') { $('#fbw').value = where(); note(''); dlg.showModal(); $('#fbm').focus(); }
    else if (b.id === 'fbclose') dlg.close();
    else if (b.id === 'fbpost') {
      if (!$('#fbm').value.trim()) { note('Напиши сообщение.'); $('#fbm').focus(); return; }
      if ($('#fbhp').value) { dlg.close(); return; }
      b.disabled = true; note('Отправляю…');
      /* 1.33.1, инженер: «во входящем видна вся тематика и пометка сайта» — тема: [Справочник ОВиК] что · где — начало сообщения */
      var msg = $('#fbm').value.trim(), cont = $('#fbc').value.trim(), head = msg.replace(/\s+/g, ' ');
      if (head.length > 70) head = head.slice(0, 70).replace(/\s\S*$/, '') + '…';
      var data = { _subject: '[Справочник ОВиК] ' + $('#fbk').value + ' · ' + $('#fbw').value + ' — ' + head, _template: 'table',
        'Сайт': 'Справочник инженера ОВиК — magichvac.github.io/klapany', 'Что': $('#fbk').value, 'Где': $('#fbw').value, 'Сообщение': msg,
        'Как ответить': cont || 'не нужен', 'Версия': window.APP ? APP.ver + ' от ' + APP.date : '', 'Страница': location.href };
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cont)) data._replyto = cont;   /* «Ответить» в почте — сразу автору сообщения */
      fetch(FB_URL(), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          b.disabled = false;
          if (x.ok && String(x.j.success) === 'true') { note('Отправлено. Спасибо!'); $('#fbm').value = ''; }
          else note('Не отправилось — сервис приёма не ответил. Попробуй позже.');
        }, function () { b.disabled = false; note('Нет связи — проверь интернет и попробуй ещё раз.'); });
    }
  });
  var fc = $('.foot .fcontact');
  if (fc) fc.innerHTML = 'По вопросам и дополнениям обращаться к автору сайта: <button type="button" id="fbopen">Написать автору</button>';
})();
