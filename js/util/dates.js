export const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function fmtD(a) {
  return a ? a[2] + " " + MES[a[1]] + " " + a[0] : "—";
}

const STOP = { de: 1, del: 1, la: 1, el: 1, los: 1, las: 1, y: 1, e: 1, a: 1, en: 1, por: 1, con: 1, para: 1, "-": 1, "–": 1, "—": 1 };

export function corto(f) {
  var w = f.nom.split(/\s+/).filter(Boolean), out = [], len = 0;
  for (var i = 0; i < w.length; i++) {
    if (out.length && len + w[i].length + 1 > 15) break;
    out.push(w[i]); len += w[i].length + 1;
  }
  while (out.length > 1 && STOP[out[out.length - 1].toLowerCase()]) out.pop();
  var s = out.join(" ");
  if (s.length > 15) s = s.slice(0, 14) + "…";
  else if (out.length < w.length) s += "…";
  return f.id + " · " + s;
}

export function U(a) { return Date.UTC(a[0], a[1], a[2]); }

export function ymdOf(ts) {
  var d = new Date(ts);
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
}

export function serialToYMD(v) {
  var d = new Date(Math.round((v - 25569) * 86400000));
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
}
