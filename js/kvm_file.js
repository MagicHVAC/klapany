/* 1.23.3: сохранить расчёт ПДВ в файл и открыть его снова (инженер: «кнопку сохранить расчёт, чтоб можно было загрузить»).
   Файл .pdv — текст JSON: текущая система (вид + все исходные данные, сеть, состав КМС) и проект «все системы».
   Ничего не уходит в сеть: файл пишется и читается на компьютере пользователя. */
var KVF_FMT = 'ovik-pdv';
function kvfBtns() {
  return '<button type="button" class="eibtn kvf-save" title="Файл .pdv на диск: эта система и проект «все системы»">Сохранить расчёт</button>' +
    '<button type="button" class="eibtn kvf-open" title="Открыть сохранённый файл .pdv">Открыть расчёт</button>';
}
function kvfName() {
  var s = KV.p && (KV.p.system || KV.p.name) || 'ПДВ';
  return String(s).replace(/[^0-9A-Za-zА-Яа-яЁё., -]/g, '_').slice(0, 60) + '_' + new Date().toISOString().slice(0, 10) + '.pdv';
}
function kvfSave() {
  if (!KV.p) return;
  var data = { format: KVF_FMT, v: 1, app: APP.ver, saved: new Date().toISOString(), cur: { mode: KV.mode, p: KV.p, pid: KV.pid || null }, proj: window.KVP || [] };
  var blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = kvfName(); document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function kvfOpen() {
  var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.pdv,.json,application/json';
  inp.onchange = function () {
    var f = inp.files && inp.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var d; try { d = JSON.parse(rd.result); } catch (x) { alert('Файл не читается: это не сохранённый расчёт ПДВ.'); return; }
      if (!d || d.format !== KVF_FMT || !d.cur || !d.cur.p || !KV_F[d.cur.mode] && d.cur.mode !== 'tamb') { alert('Это не файл расчёта ПДВ этого справочника.'); return; }
      if (Array.isArray(d.proj) && d.proj.length) {
        if (!window.KVP || !KVP.length || confirm('В файле проект из ' + d.proj.length + ' систем. Заменить им текущий проект (' + KVP.length + ' систем)?')) { KVP = d.proj; if (window.kvpSave) kvpSave(); }
      }
      KV.mode = d.cur.mode; KV.p = d.cur.p; KV.pid = d.cur.pid && window.kvpFind && kvpFind(d.cur.pid) ? d.cur.pid : null; KV.file = f.name;
      try { localStorage.setItem('klapany-kv-mode', KV.mode); } catch (x) {}
      show('pdv');
    };
    rd.readAsText(f, 'utf-8');
  };
  document.body.appendChild(inp); inp.click(); setTimeout(function () { inp.remove(); }, 60000);
}
document.addEventListener('click', function (e) {
  var c = e.target.classList; if (!c) return;
  if (c.contains('kvf-save')) kvfSave(); else if (c.contains('kvf-open')) kvfOpen();
});
