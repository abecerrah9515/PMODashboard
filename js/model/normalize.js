export function norm(s) {
  return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

export function txt(v) {
  if (v == null) return "";
  if (typeof v === "object" && v._d) return v._d[2] + "/" + (v._d[1] + 1) + "/" + v._d[0];
  return String(v).trim();
}

export function num(v) {
  var n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export function ymd(v) {
  return (v && typeof v === "object" && v._d) ? v._d : null;
}

export function estKey(s) {
  var n = norm(s);
  if (/finaliz|cerrad|complet|termin/.test(n)) return "fin";
  if (/proceso|curso|progreso|ejecucion/.test(n)) return "proc";
  if (/no inici|sin inici|pendiente|no comenz/.test(n)) return "no";
  return null;
}

export function impKey(s) {
  var n = norm(s);
  if (/alto|alta/.test(n)) return "a";
  if (/medio|media/.test(n)) return "m";
  if (/bajo|baja/.test(n)) return "b";
  return null;
}

export function splitSub(name) {
  name = (name || "").trim();
  if (name.slice(-1) === ")" && name.indexOf("(") > 0) {
    var i = name.lastIndexOf("(");
    return [name.slice(0, i).trim(), name.slice(i + 1, -1).trim()];
  }
  return [name, ""];
}

export const EST_LBL = { fin: "Finalizado", proc: "En proceso", no: "Sin iniciar" };
