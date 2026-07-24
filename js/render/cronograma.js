import { $, esc, empty } from "../util/dom.js";
import { fmtD } from "../util/dates.js";

export function renderCronograma(ctx) {
  var fases = ctx.fases;
  var avReal = ctx.avReal, avEsp = ctx.avEsp, gap = ctx.gap;

  $("cron-head").style.display = fases.length ? "" : "none";
  $("cron-body").innerHTML = fases.length ? fases.map(function (f) {
    var pct = Math.round(f.real * 100), espPct = Math.round(f.esp * 100), done = f.real >= f.esp && f.esp > 0;
    var dif = f.esp - f.real, difTxt = Math.abs(dif) < 0.0001 ? "0.0" : (dif > 0 ? "−" : "+") + (Math.abs(dif) * 100).toFixed(1);
    return '<div class="cron-row">' +
      '<div class="phase-name">' + esc(f.nom) + (f.sub ? '<em>' + esc(f.sub) + '</em>' : '') + '</div>' +
      '<div class="phase-dates">' + fmtD(f.s) + ' → ' + fmtD(f.e) + '<span>' + f.dias + ' días</span></div>' +
      '<div class="bar-track-cell"><div class="bar-track" title="Real ' + pct + '% · Meta ' + espPct + '%">' +
        '<div class="bar-fill ' + (done ? "done" : "wip") + '" style="width:' + Math.min(pct, 100) + '%"></div>' +
        '<i class="bar-exp" style="left:' + Math.min(espPct, 100) + '%"></i><span class="bar-val">' + pct + '%</span></div></div>' +
      '<div class="weight-pill">' + Math.round(f.peso * 100) + '%<span>peso</span></div>' +
      '<div class="diff ' + (Math.abs(dif) < 0.0001 ? "zero" : "neg") + '">' + difTxt + '</div>' +
      (f.com ? '<div class="cron-comment"><b>Comentario:</b> ' + esc(f.com) + '</div>' : '') +
    '</div>';
  }).join("") : empty("Ninguna fase coincide", "Ajusta los filtros de fase o estado.");

  $("cron-foot").style.display = fases.length ? "" : "none";
  $("cron-foot").innerHTML = fases.length
    ? '<div>Avance esperado <b>' + avEsp.toFixed(1) + '%</b></div><div>Avance real <b style="color:' + (gap <= 0.05 ? "var(--good)" : "var(--serious)") + '">' + avReal.toFixed(1) + '%</b></div>' : "";
}
