import { $, esc } from "./util/dom.js";
import { readXlsx } from "./xlsx/xlsx-reader.js";
import { buildModel } from "./model/build-model.js";
import { DEFAULT_DATA } from "./model/default-data.js";
import { state, setData } from "./state.js";
import { applyView, buildFilters, render } from "./render/index.js";

function msg(kind, title, lines) {
  var el = $("loadmsg");
  el.className = "loadmsg " + kind;
  el.innerHTML = "<b>" + title + "</b>" + (lines && lines.length
    ? "<ul><li>" + lines.join("</li><li>") + "</li></ul>" : "");
  if (kind === "ok") setTimeout(function () { el.className = "loadmsg"; }, 6000);
}

function loadData(d, warns) {
  setData(d);
  applyView();
  if (d) { buildFilters(); render(); }
  if (d && d !== DEFAULT_DATA) {
    msg("ok", "Datos cargados de “" + d.src + "”.", warns);
  } else {
    $("loadmsg").className = "loadmsg";
  }
}

$("loadBtn").addEventListener("click", function () { $("fileInput").click(); });
$("emptyLoadBtn").addEventListener("click", function () { $("fileInput").click(); });
$("emptyExample").addEventListener("click", function () { loadData(DEFAULT_DATA, []); });

$("fileInput").addEventListener("change", function (ev) {
  var file = ev.target.files && ev.target.files[0];
  if (!file) return;
  $("fileInput").value = "";
  if (!/\.xlsx$/i.test(file.name)) {
    msg("err", "Formato no soportado", ["Se esperaba un archivo <code>.xlsx</code>. Si tu archivo es <code>.xls</code> o <code>.csv</code>, guárdalo como .xlsx desde Excel."]);
    return;
  }
  if (typeof DecompressionStream === "undefined") {
    msg("err", "Navegador no compatible", ["Este lector necesita <code>DecompressionStream</code> (Chrome/Edge 80+, Firefox 113+, Safari 16.4+)."]);
    return;
  }
  msg("ok", "Leyendo “" + file.name + "”…", []);
  readXlsx(file).then(function (sheets) {
    var res = buildModel(sheets, file.name);
    if (res.errs && res.errs.length) {
      msg("err", "No se pudo usar “" + file.name + "”", res.errs.concat(
        ["Hojas encontradas: <code>" + Object.keys(sheets).join("</code>, <code>") + "</code>"],
        ["El tablero sigue mostrando los datos anteriores."]));
      return;
    }
    loadData(res.data, res.warns);
  }).catch(function (e) {
    msg("err", "Error al leer “" + file.name + "”", [esc(e && e.message ? e.message : String(e)),
      "El tablero sigue mostrando los datos anteriores."]);
  });
});

$("f-fase").addEventListener("click", function (ev) {
  var b = ev.target.closest("[data-f]"); if (!b) return;
  state.fase = b.dataset.f; render();
});
$("f-estado").addEventListener("click", function (ev) {
  var b = ev.target.closest("[data-e]"); if (!b) return;
  state.estado = b.dataset.e; render();
});
$("freset").addEventListener("click", function () { state.fase = "all"; state.estado = "all"; render(); });

$("srcbar").addEventListener("click", function (ev) {
  if (ev.target.closest("#clearBtn")) loadData(null, []);
});

$("themeBtn").addEventListener("click", function () {
  var root = document.documentElement, cur = root.getAttribute("data-theme");
  if (!cur) cur = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
});

applyView();
