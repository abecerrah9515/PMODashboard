import { $, esc, empty } from "../util/dom.js";
import { fmtD, ymdOf, U } from "../util/dates.js";

export function renderGantt(ctx) {
  var fases = ctx.fases, TL = ctx.TL;
  var gf = fases.filter(function (f) { return f.s && f.e; });

  if (TL) {
    var grid = "", sc = "";
    TL.months.forEach(function (m) {
      sc += '<span class="gantt-mlbl" style="left:' + m.p + '%">' + m.lbl + '</span>';
      if (m.line) grid += '<i style="left:' + m.p + '%"></i>';
    });
    $("gantt-scale").innerHTML = sc;
    $("gantt-note").textContent = "Duración real de cada fase sobre el calendario del proyecto ("
      + fmtD(ymdOf(TL.t0)) + " → " + fmtD(ymdOf(TL.t1)) + ") · el relleno indica el avance alcanzado";
    $("gantt-body").innerHTML = gf.length ? gf.map(function (f) {
      var l = (U(f.s) - TL.t0) / TL.span * 100, w = (U(f.e) - U(f.s)) / TL.span * 100;
      var pct = Math.round(f.real * 100), done = f.real >= f.esp && f.esp > 0;
      var tip = f.nom + ' · ' + fmtD(f.s) + ' → ' + fmtD(f.e) + ' · ' + f.dias + ' días · avance ' + pct + '%';
      return '<div class="gantt-row"><div class="gantt-lbl">' + esc(f.nom) + '</div>' +
        '<div class="gantt-lane"><div class="gantt-grid">' + grid + '</div>' +
          '<div class="gantt-bar" style="left:' + l + '%;width:' + Math.max(w, 0.5) + '%" title="' + esc(tip) + '">' +
            '<span class="' + (done ? "done" : "wip") + '" style="width:' + Math.min(pct, 100) + '%"></span><b>' + f.dias + 'd</b></div>' +
        '</div></div>';
    }).join("") : empty("Sin fases que mostrar", "La línea de tiempo sigue los mismos filtros.");
  } else {
    $("gantt-scale").innerHTML = "";
    $("gantt-note").textContent = "";
    $("gantt-body").innerHTML = empty("Sin fechas", "Ninguna fase del archivo tiene fecha de inicio y fin.");
  }
}
