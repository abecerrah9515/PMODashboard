import { $, esc } from "../util/dom.js";
import { MES, fmtD, corto, U } from "../util/dates.js";
import { norm, EST_LBL } from "../model/normalize.js";
import { state, getData, faseOk, estadoOk } from "../state.js";
import { renderKpis } from "./kpis.js";
import { renderCronograma } from "./cronograma.js";
import { renderGantt } from "./gantt.js";
import { renderEntregables } from "./entregables.js";
import { renderRiesgos } from "./riesgos.js";
import { renderTareas } from "./tareas.js";

function estadoDe(pct) { return pct >= 1 ? "fin" : pct > 0 ? "proc" : "no"; }

export function applyView() {
  var has = !!getData();
  $("emptyState").style.display = has ? "none" : "";
  $("filtersBar").style.display = has ? "" : "none";
  $("dashboardBody").style.display = has ? "" : "none";
  $("srcbar").style.display = has ? "" : "none";
  if (!has) $("tc-meta").innerHTML = "";
}

export function buildFilters() {
  var DATA = getData();
  var fa = ['<button class="fchip" type="button" data-f="all" aria-pressed="true">Todas</button>'];
  DATA.fases.forEach(function (f) {
    fa.push('<button class="fchip" type="button" data-f="' + f.id + '" aria-pressed="false" title="' + esc(f.nom) + '">' + esc(corto(f)) + '</button>');
  });
  $("f-fase").innerHTML = fa.join("");
  var es = ['<button class="fchip" type="button" data-e="all" aria-pressed="true">Todos</button>'];
  ["fin", "proc", "no"].forEach(function (k) {
    es.push('<button class="fchip" type="button" data-e="' + k + '" aria-pressed="false">' + EST_LBL[k] + '</button>');
  });
  $("f-estado").innerHTML = es.join("");
}

function syncChips() {
  [].forEach.call($("f-fase").children, function (b) { b.setAttribute("aria-pressed", b.dataset.f === state.fase); });
  [].forEach.call($("f-estado").children, function (b) { b.setAttribute("aria-pressed", b.dataset.e === state.estado); });
  $("freset").disabled = (state.fase === "all" && state.estado === "all");
}

function timeline(allFases) {
  var ds = allFases.filter(function (f) { return f.s && f.e; });
  if (!ds.length) return null;
  var t0 = Math.min.apply(null, ds.map(function (f) { return U(f.s); }));
  var t1 = Math.max.apply(null, ds.map(function (f) { return U(f.e); }));
  if (t1 <= t0) t1 = t0 + 86400000;
  var span = t1 - t0;
  var months = [], d = new Date(t0);
  var nMonths = Math.round(span / 86400000 / 30.4) + 1;
  var step = nMonths > 24 ? 3 : nMonths > 14 ? 2 : 1;
  var showYear = nMonths > 12;
  function lbl(dt) { return MES[dt.getUTCMonth()] + (showYear ? " " + String(dt.getUTCFullYear()).slice(2) : ""); }
  months.push({ p: 0, lbl: lbl(d), line: false });
  d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  var i = 0;
  while (d.getTime() < t1) {
    i++;
    if (i % step === 0) months.push({ p: (d.getTime() - t0) / span * 100, lbl: lbl(d), line: true });
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  }
  return { t0: t0, t1: t1, span: span, months: months };
}

export function render() {
  syncChips();
  var DATA = getData();
  var TL = timeline(DATA.fases);

  var fases = DATA.fases.filter(function (f) { return faseOk(f.id) && estadoOk(estadoDe(f.real)); });
  var dels = DATA.del.filter(function (d) { return faseOk(d.fase) && estadoOk(estadoDe(d.pct)); });
  var sols = DATA.sol.filter(function (s) { return faseOk(s.fase) && estadoOk(s.est); });
  var solsFase = DATA.sol.filter(function (s) { return faseOk(s.fase); });
  var nF = DATA.fases.length, nD = DATA.del.length, nR = DATA.risks.length, nS = DATA.sol.length;
  var scoped = state.fase !== "all" || state.estado !== "all";

  var peso = 0, real = 0, espW = 0;
  fases.forEach(function (f) { peso += f.peso; real += f.peso * f.real; espW += f.peso * f.esp; });
  var avReal = peso ? real / peso * 100 : 0;
  var avEsp = peso ? espW / peso * 100 : 0;
  var gap = avEsp - avReal;

  var rA = DATA.risks.filter(function (r) { return r.imp === "a"; }).length;
  var rM = DATA.risks.filter(function (r) { return r.imp === "m"; }).length;
  var rB = DATA.risks.filter(function (r) { return r.imp === "b"; }).length;
  var ctrl = DATA.risks.filter(function (r) { return /controlad/.test(norm(r.estado)); }).length;

  var ctx = {
    fases: fases, dels: dels, sols: sols, solsFase: solsFase,
    allFases: DATA.fases, allRisks: DATA.risks, allSol: DATA.sol,
    nF: nF, nD: nD, nR: nR, nS: nS,
    scoped: scoped, estadoFiltro: state.estado, TL: TL, src: DATA.src,
    peso: peso, avReal: avReal, avEsp: avEsp, gap: gap,
    rA: rA, rM: rM, rB: rB, ctrl: ctrl
  };

  /* --- meta del header --- */
  var allS = DATA.fases.filter(function (f) { return f.s; }).map(function (f) { return U(f.s); });
  var allE = DATA.fases.filter(function (f) { return f.e; }).map(function (f) { return U(f.e); });
  var horiz = "—";
  if (allS.length && allE.length) {
    var a = new Date(Math.min.apply(null, allS)), b = new Date(Math.max.apply(null, allE));
    horiz = MES[a.getUTCMonth()] + " " + a.getUTCFullYear() + " – " + MES[b.getUTCMonth()] + " " + b.getUTCFullYear();
  }
  $("tc-meta").innerHTML = "Horizonte del proyecto<b>" + horiz + "</b>" +
    nF + " fases · " + nD + " entregables · " + nR + " riesgos · " + nS + " tareas";

  renderKpis(ctx);
  renderCronograma(ctx);
  renderGantt(ctx);
  renderEntregables(ctx);
  renderRiesgos(ctx);
  renderTareas(ctx);

  var plural = function (v, sing, pl) { return '<b>' + v + '</b> ' + (v === 1 ? sing : pl); };
  $("fcount").innerHTML = scoped
    ? 'Mostrando ' + plural(fases.length, "fase", "fases") + ' · ' + plural(dels.length, "entregable", "entregables") +
      ' · ' + plural(sols.length, "tarea", "tareas")
    : 'Vista completa · <b>' + nF + '</b> fases · <b>' + nD + '</b> entregables · <b>' + nS + '</b> tareas';

  /* --- barra de origen + footer --- */
  $("srcbar").innerHTML =
    '<span class="tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>' +
    esc(DATA.src) + '</span>' +
    '<span class="sep">·</span><span>' + nF + ' fases · ' + nD + ' entregables · ' + nR + ' riesgos · ' + nS + ' tareas</span>' +
    '<span class="sep">·</span><button class="lnk" id="clearBtn" type="button">Quitar datos</button>';

  $("footer").innerHTML = 'Tablero de Control · Plataforma Analítica · datos: ' + esc(DATA.src) + '<br>' +
    'Marca VITAL aplicada según su Manual de Marca (ene. 2021) · Atribución Softtek según Brandkeeper 2025, pág. 24 (caso B).';
}
