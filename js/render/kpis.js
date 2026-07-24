import { $ } from "../util/dom.js";

export function renderKpis(ctx) {
  var fases = ctx.fases, dels = ctx.dels, sols = ctx.sols;
  var nF = ctx.nF, scoped = ctx.scoped;
  var nR = ctx.allRisks.length;
  var avReal = ctx.avReal, avEsp = ctx.avEsp, gap = ctx.gap, peso = ctx.peso;
  var rA = ctx.rA, rM = ctx.rM, rB = ctx.rB, ctrl = ctx.ctrl;

  var delAvg = dels.length ? dels.reduce(function (a, d) { return a + d.pct; }, 0) / dels.length * 100 : 0;
  var del100 = dels.filter(function (d) { return d.pct >= 1; }).length;
  var delRisk = dels.filter(function (d) { return d.pct < 0.7; }).length;
  var cFin = sols.filter(function (s) { return s.est === "fin"; }).length;
  var cProc = sols.filter(function (s) { return s.est === "proc"; }).length;
  var cNo = sols.filter(function (s) { return s.est === "no"; }).length;

  $("kpis").innerHTML =
    '<div class="kpi hero"><div class="kpi-label">Avance ' + (scoped ? "de la selección" : "general del proyecto") + '</div>' +
      (fases.length
        ? '<div class="kpi-value">' + avReal.toFixed(1) + '<small>% real</small></div>' +
          '<div class="kpi-delta" style="color:' + (gap <= 0.05 ? "var(--good)" : "var(--serious)") + '">' +
            '<span class="dot" style="background:currentColor"></span>' +
            (gap <= 0.05 ? "En meta (" + avEsp.toFixed(0) + "%)" : "−" + gap.toFixed(1) + " pts vs. " + avEsp.toFixed(0) + "% esperado") + '</div>' +
          '<div class="spacer"></div>' +
          '<div class="meter" title="Real ' + avReal.toFixed(1) + '% · Esperado ' + avEsp.toFixed(1) + '%"><span style="width:' + Math.min(avReal, 100) + '%"></span><i class="exp" style="left:' + Math.min(avEsp, 100) + '%"></i></div>' +
          '<div class="kpi-sub">Ponderado por peso · ' + fases.length + ' de ' + nF + ' fases (' + Math.round(peso * 100) + '% del peso total)</div>'
        : '<div class="kpi-value" style="color:var(--muted)">—</div><div class="spacer"></div><div class="kpi-sub">Ninguna fase coincide con el filtro</div>') +
    '</div>' +
    '<div class="kpi small"><div class="kpi-label">Entregables</div><div class="kpi-value">' + dels.length + '</div>' +
      '<div class="kpi-sub">' + (dels.length ? 'Avance promedio <b>' + delAvg.toFixed(1) + '%</b>' : 'Sin entregables en la selección') + '</div>' +
      '<div class="spacer"></div><div class="chips-row">' +
        (del100 ? '<span class="chip chip-good">' + del100 + ' al 100%</span>' : '') +
        (delRisk ? '<span class="chip chip-crit">' + delRisk + ' en riesgo</span>' : '') +
      '</div></div>' +
    '<div class="kpi small"><div class="kpi-label">Riesgos</div><div class="kpi-value">' + nR + '</div>' +
      '<div class="kpi-sub">' + (nR && ctrl === nR ? '<b style="color:var(--good)">100% controlados</b>'
           : '<b>' + ctrl + '</b> de ' + nR + ' controlados') + '</div><div class="spacer"></div>' +
      '<div class="chips-row">' +
        (rA ? '<span class="chip chip-crit">' + rA + ' alto</span>' : '') +
        (rM ? '<span class="chip chip-warn">' + rM + ' medio</span>' : '') +
        (rB ? '<span class="chip chip-good">' + rB + ' bajo</span>' : '') +
      '</div></div>' +
    '<div class="kpi small"><div class="kpi-label">Tareas</div><div class="kpi-value">' + sols.length + '</div>' +
      '<div class="kpi-sub"><b>' + cProc + '</b> en proceso · <b>' + cNo + '</b> sin iniciar</div><div class="spacer"></div>' +
      '<div class="chips-row">' + (cFin ? '<span class="chip chip-good">' + cFin + ' finalizadas</span>' : '') + '</div></div>';
}
