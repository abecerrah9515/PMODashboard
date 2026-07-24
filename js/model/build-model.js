import { norm, txt, num, ymd, estKey, impKey, splitSub } from "./normalize.js";

export function buildModel(sheets, fname) {
  var errs = [], warns = [];

  function findSheet(aliases) {
    for (var i = 0; i < aliases.length; i++)
      for (var k in sheets) if (norm(k) === norm(aliases[i])) return sheets[k];
    return null;
  }
  function hdrs(rows) {
    var h = {}, r0 = rows[0] || [];
    for (var i = 0; i < r0.length; i++) {
      var v = txt(r0[i]);
      if (v) h[norm(v)] = i;
    }
    return h;
  }
  function C(h, aliases) {
    for (var i = 0; i < aliases.length; i++) { var k = norm(aliases[i]); if (k in h) return h[k]; }
    return -1;
  }
  function need(h, aliases, sheetName, missing) {
    var i = C(h, aliases);
    if (i < 0) missing.push('"' + aliases[0] + '" en la hoja ' + sheetName);
    return i;
  }
  function body(rows) {
    return rows.slice(1).filter(function (r) { return r && r.some(function (v) { return v != null && txt(v) !== ""; }); });
  }
  var G = function (r, i) { return i >= 0 ? r[i] : null; };

  var missing = [];
  var shCron = findSheet(["Cronograma"]);
  var shEnt = findSheet(["Entregables"]);
  var shRie = findSheet(["Riesgos"]);
  var shSol = findSheet(["Solicitudes", "Tareas"]);
  if (!shCron) errs.push("Falta la hoja <code>Cronograma</code>");
  if (!shEnt) errs.push("Falta la hoja <code>Entregables</code>");
  if (!shRie) errs.push("Falta la hoja <code>Riesgos</code>");
  if (!shSol) errs.push("Falta la hoja <code>Solicitudes</code> (o <code>Tareas</code>)");
  if (errs.length) return { errs: errs, warns: warns };

  // ---- Cronograma ----
  var h = hdrs(shCron);
  var cId = need(h, ["Id Fase"], "Cronograma", missing);
  var cNo = need(h, ["Fase"], "Cronograma", missing);
  var cIn = need(h, ["Fecha Inicio"], "Cronograma", missing);
  var cFi = need(h, ["Fecha Fin"], "Cronograma", missing);
  var cPe = need(h, ["Peso"], "Cronograma", missing);
  var cRe = need(h, ["Avance Real"], "Cronograma", missing);
  var cEs = C(h, ["Avance Esperado"]), cDi = C(h, ["Dias Totales", "Días Totales"]), cCo = C(h, ["Comentario"]);
  var fases = [];
  body(shCron).forEach(function (r) {
    var id = num(G(r, cId)); if (id == null) return;
    var ns = splitSub(txt(G(r, cNo)));
    var s = ymd(G(r, cIn)), e = ymd(G(r, cFi));
    if (!s || !e) { warns.push("La fase " + id + " no tiene fechas válidas y se omite de la línea de tiempo."); }
    var dias = num(G(r, cDi));
    if (dias == null && s && e) dias = Math.round((Date.UTC(e[0], e[1], e[2]) - Date.UTC(s[0], s[1], s[2])) / 86400000);
    fases.push({
      id: id, nom: ns[0], sub: ns[1], s: s, e: e, dias: dias || 0,
      esp: cEs >= 0 ? (num(G(r, cEs)) || 0) : 1,
      real: num(G(r, cRe)) || 0, peso: num(G(r, cPe)) || 0, com: txt(G(r, cCo))
    });
  });

  // ---- Entregables ----
  h = hdrs(shEnt);
  var eId = need(h, ["Id Entregable"], "Entregables", missing);
  var eNo = C(h, ["Nombre Corto"]);
  var eEn = need(h, ["Entregable"], "Entregables", missing);
  var eFa = need(h, ["Id Fase"], "Entregables", missing);
  var eAv = need(h, ["Avance"], "Entregables", missing);
  var eEg = C(h, ["Entrega"]), eRo = C(h, ["Rol Responsable"]), eAp = C(h, ["Apoyo"]);
  var dels = [];
  body(shEnt).forEach(function (r) {
    var id = num(G(r, eId)); if (id == null) return;
    var rol = txt(G(r, eRo)), apo = txt(G(r, eAp));
    dels.push({
      id: id, nom: txt(G(r, eNo)) || txt(G(r, eEn)),
      rol: rol + (apo ? " · apoyo " + apo : ""), pct: num(G(r, eAv)) || 0,
      entrega: txt(G(r, eEg)) || "Sin hito", fase: num(G(r, eFa)) || 0
    });
  });

  // ---- Riesgos ----
  h = hdrs(shRie);
  var rId = need(h, ["Id Riesgo"], "Riesgos", missing);
  var rNo = need(h, ["Riesgo"], "Riesgos", missing);
  var rIm = need(h, ["Impacto"], "Riesgos", missing);
  var rPr = need(h, ["Probabilidad Ocurrencia"], "Riesgos", missing);
  var rOp = C(h, ["Oportunidad"]), rEs = C(h, ["Estado"]);
  var risks = [], impBad = {};
  body(shRie).forEach(function (r) {
    var id = num(G(r, rId)); if (id == null) return;
    var lbl = txt(G(r, rIm)), k = impKey(lbl);
    if (!k) { impBad[lbl || "(vacío)"] = 1; k = "m"; }
    risks.push({
      id: id, nom: txt(G(r, rNo)), mit: txt(G(r, rOp)), imp: k, impLbl: lbl || "—",
      prob: num(G(r, rPr)) || 0, estado: txt(G(r, rEs))
    });
  });
  var bad = Object.keys(impBad);
  if (bad.length) warns.push("Impacto no reconocido (tratado como Medio): " + bad.join(", ") + ".");

  // ---- Tareas ----
  h = hdrs(shSol);
  var sId = need(h, ["Id Solicitud", "Id Tarea"], "Solicitudes", missing);
  var sNo = need(h, ["Solicitud", "Tarea"], "Solicitudes", missing);
  var sEs = need(h, ["Estado"], "Solicitudes", missing);
  var sFa = C(h, ["Id Fase"]), sFe = C(h, ["Fecha Solicitud", "Fecha"]), sCi = C(h, ["Fecha Cierre"]);
  var sol = [], estBad = {};
  body(shSol).forEach(function (r) {
    var id = num(G(r, sId)); if (id == null) return;
    var lbl = txt(G(r, sEs)), k = estKey(lbl);
    if (!k) { estBad[lbl || "(vacío)"] = 1; k = "proc"; }
    sol.push({
      id: id, nom: txt(G(r, sNo)), fecha: ymd(G(r, sFe)), cierre: ymd(G(r, sCi)),
      est: k, estLbl: lbl || "—", fase: num(G(r, sFa)) || 0
    });
  });
  var badE = Object.keys(estBad);
  if (badE.length) warns.push("Estado no reconocido (tratado como En proceso): " + badE.join(", ") + ".");

  if (missing.length) {
    errs.push("Faltan columnas obligatorias: " + missing.join(", "));
    return { errs: errs, warns: warns };
  }
  if (!fases.length) errs.push("La hoja <code>Cronograma</code> no tiene filas de datos.");
  if (errs.length) return { errs: errs, warns: warns };

  return { data: { fases: fases, del: dels, risks: risks, sol: sol, src: fname }, warns: warns, errs: [] };
}
