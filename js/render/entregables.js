import { $, esc, empty } from "../util/dom.js";

export function renderEntregables(ctx) {
  var dels = ctx.dels, nD = ctx.nD;

  $("del-note").innerHTML = dels.length
    ? dels.length + ' de ' + nD + ' entregables · verde ≥ 90% · ámbar 70–89% · rojo &lt; 70%'
    : 'Sin entregables para este filtro';

  function colorFor(p) { return p >= 0.90 ? "var(--good)" : p >= 0.70 ? "var(--warn)" : "var(--crit)"; }
  function delRow(d) {
    var pct = Math.round(d.pct * 100);
    return '<div class="del-row" title="' + esc(d.nom) + ' — ' + pct + '%">' +
      '<div class="del-name">' + esc(d.nom) + (d.rol ? '<em>' + esc(d.rol) + '</em>' : '') + '</div>' +
      '<div class="del-track"><span style="width:' + Math.min(pct, 100) + '%;background:' + colorFor(d.pct) + '"></span></div>' +
      '<div class="del-pct" style="color:' + colorFor(d.pct) + '">' + pct + '%</div></div>';
  }

  if (!dels.length) {
    $("del-list").innerHTML = empty("Sin entregables", "Ningún entregable coincide con la fase y el estado seleccionados.");
  } else {
    var groups = [];
    dels.forEach(function (d) { if (groups.indexOf(d.entrega) < 0) groups.push(d.entrega); });
    groups.sort();
    $("del-list").innerHTML = groups.map(function (g) {
      var rows = dels.filter(function (d) { return d.entrega === g; });
      return '<div class="del-group-lbl">' + esc(g) + ' <span class="ln"></span></div>' + rows.map(delRow).join("");
    }).join("");
  }
}
