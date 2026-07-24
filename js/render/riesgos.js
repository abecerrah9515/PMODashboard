import { $, esc, empty } from "../util/dom.js";

export function renderRiesgos(ctx) {
  var allRisks = ctx.allRisks, nR = ctx.nR, ctrl = ctx.ctrl;

  $("risk-nofilter").innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
    '<div>En el archivo los riesgos no están vinculados a ninguna fase' +
    (nR && ctrl === nR ? ' y los ' + nR + ' están en estado <b>' + esc(allRisks[0].estado || "Controlado") + '</b>' : '') +
    ', así que esta sección no responde a los filtros.</div>';

  $("risk-note").innerHTML = nR + ' riesgos · ' + (nR && ctrl === nR
    ? 'todos en estado <b style="color:var(--good)">' + esc(allRisks[0].estado || "Controlado") + '</b>'
    : '<b>' + ctrl + '</b> controlados');

  function band(p) { return p <= 0.3 ? 0 : p < 0.7 ? 1 : 2; }
  var BANDS = ["Baja<br>≤30%", "Media<br>40–60%", "Alta<br>≥70%"];
  var ROWS = [["a", "Alto", 3], ["m", "Medio", 2], ["b", "Bajo", 1]];
  var mx = '<div></div>' + BANDS.map(function (b) { return '<div class="m-collab">' + b + '</div>'; }).join("");
  ROWS.forEach(function (row) {
    mx += '<div class="m-rowlab">Impacto<br>' + row[1] + '</div>';
    for (var b = 0; b < 3; b++) {
      var hits = allRisks.filter(function (r) { return r.imp === row[0] && band(r.prob) === b; });
      if (hits.length) {
        var tip = row[1] + ' · prob. ' + ["baja", "media", "alta"][b] + ' — ' + hits.map(function (r) { return "R" + r.id + " " + r.nom; }).join(" · ");
        mx += '<div class="m-cell m-lvl' + row[2] + '" title="' + esc(tip) + '">' + hits.length + '</div>';
      } else {
        mx += '<div class="m-cell m-empty">—</div>';
      }
    }
  });
  mx += '<div></div><div class="m-axis-x">Probabilidad de ocurrencia →</div>';
  $("risk-matrix").innerHTML = mx;

  $("risk-list").innerHTML = allRisks.length ? allRisks.map(function (r) {
    return '<div class="risk-row"><div class="risk-id">R' + r.id + '</div>' +
      '<div><div class="risk-name">' + esc(r.nom) + '</div>' +
      (r.mit ? '<div class="risk-mit"><b>Mitigación:</b> ' + esc(r.mit) + '</div>' : '') + '</div>' +
      '<div class="risk-tags"><span class="tag-imp ' + r.imp + '">' + esc(r.impLbl) + '</span>' +
      '<span class="tag-prob">Prob. ' + Math.round(r.prob * 100) + '%</span></div></div>';
  }).join("") : empty("Sin riesgos", "El archivo no tiene filas en la hoja Riesgos.");
}
