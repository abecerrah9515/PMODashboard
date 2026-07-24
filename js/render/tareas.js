import { $, esc, empty } from "../util/dom.js";
import { fmtD, U, MES } from "../util/dates.js";
import { EST_LBL } from "../model/normalize.js";

export function renderTareas(ctx) {
  var sols = ctx.sols, solsFase = ctx.solsFase, nS = ctx.nS;
  var allSol = ctx.allSol, allFases = ctx.allFases;
  var estadoFiltro = ctx.estadoFiltro;

  $("sol-note").textContent = sols.length + (sols.length === 1 ? " tarea" : " tareas") + " de " + nS;
  var n = solsFase.length;
  var dFin = solsFase.filter(function (s) { return s.est === "fin"; }).length;
  var dProc = solsFase.filter(function (s) { return s.est === "proc"; }).length;
  var dNo = solsFase.filter(function (s) { return s.est === "no"; }).length;

  if (!n) {
    var fs = {}; allSol.forEach(function (s) { fs[s.fase] = 1; });
    var lst = Object.keys(fs).map(function (id) {
      var f = allFases.filter(function (x) { return x.id === +id; })[0];
      return f ? f.id + " · " + f.nom : id;
    });
    $("donut-wrap").innerHTML = empty("Sin tareas en esta fase",
      lst.length ? "En el archivo las tareas están asociadas a: " + lst.join(", ") + "." : "");
    $("sol-insight").innerHTML = "";
  } else {
    var p1 = dFin / n * 100, p2 = p1 + dProc / n * 100;
    var grad = 'conic-gradient(var(--good) 0 ' + p1 + '%, var(--brand) ' + p1 + '% ' + p2 + '%, var(--warn) ' + p2 + '% 100%)';
    function li(k, lbl, val, color) {
      var cls = estadoFiltro === "all" ? "" : (estadoFiltro === k ? " sel" : " dim");
      return '<div class="legend-item' + cls + '"><span class="dot" style="background:' + color + '"></span>' +
        '<span class="name">' + lbl + '</span><b>' + val + '</b></div>';
    }
    $("donut-wrap").innerHTML =
      '<div class="donut" style="background:' + grad + '" role="img" aria-label="' + dFin + ' finalizadas, ' + dProc + ' en proceso, ' + dNo + ' sin iniciar">' +
        '<div class="donut-center"><b>' + n + '</b><small>total</small></div></div>' +
      '<div class="legend">' + li("fin", "Finalizadas", dFin, "var(--good)") +
        li("proc", "En proceso", dProc, "var(--brand)") + li("no", "Sin iniciar", dNo, "var(--warn)") + '</div>';

    var sinCierre = solsFase.filter(function (s) { return !s.cierre; }).length;
    var fechas = solsFase.filter(function (s) { return s.fecha; }).map(function (s) { return U(s.fecha); });
    var rango = "";
    if (fechas.length) {
      var f0 = new Date(Math.min.apply(null, fechas)), f1 = new Date(Math.max.apply(null, fechas));
      rango = " Se crearon entre el " + f0.getUTCDate() + " de " + MES[f0.getUTCMonth()].toLowerCase() +
        " de " + f0.getUTCFullYear() + " y el " + f1.getUTCDate() + " de " + MES[f1.getUTCMonth()].toLowerCase() +
        " de " + f1.getUTCFullYear() + ".";
    }
    $("sol-insight").innerHTML =
      '<div class="sol-close"><span>Tasa de cierre</span><b>' + dFin + ' de ' + n + ' · ' + Math.round(dFin / n * 100) + '%</b></div>' +
      '<div class="sol-meter" title="' + dFin + ' de ' + n + ' finalizadas"><span style="width:' + (dFin / n * 100) + '%"></span></div>' +
      (sinCierre ? '<div class="sol-flag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' +
        '<div><b>' + (sinCierre === n ? "Sin fechas de cierre." : sinCierre + " sin fecha de cierre.") + '</b>' +
        esc(rango) + ' ' + (sinCierre === n ? "Ninguna registra fecha de cierre en el archivo — incluidas las marcadas como finalizadas."
                                        : sinCierre + " de " + n + " no registran fecha de cierre.") + '</div></div>' : '');
  }

  $("sol-detail-note").textContent = sols.length ? "Fecha de creación y estado" : "";
  $("sol-list").innerHTML = sols.length ? sols.map(function (s) {
    return '<div class="sol-row"><div class="sol-id">' + s.id + '</div>' +
      '<div class="sol-name">' + esc(s.nom) + '<em>Creada: ' + fmtD(s.fecha) + '</em></div>' +
      '<span class="st st-' + s.est + '" title="' + esc(s.estLbl) + '">' + esc(s.estLbl || EST_LBL[s.est]) + '</span></div>';
  }).join("") : empty("Sin tareas", "Ninguna tarea coincide con la fase y el estado seleccionados.");
}
