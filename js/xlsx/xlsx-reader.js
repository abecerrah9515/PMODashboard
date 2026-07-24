import { dec, unzip } from "./unzip.js";
import { serialToYMD } from "../util/dates.js";

function xml(bytes) {
  var d = new DOMParser().parseFromString(dec(bytes), "application/xml");
  if (d.getElementsByTagName("parsererror").length) throw new Error("XML interno ilegible.");
  return d;
}

function parseShared(bytes) {
  if (!bytes) return [];
  var sis = xml(bytes).getElementsByTagName("si"), out = [];
  for (var i = 0; i < sis.length; i++) {
    var ts = sis[i].getElementsByTagName("t"), s = "";
    for (var j = 0; j < ts.length; j++) {
      if (ts[j].parentNode.nodeName === "rPh") continue;
      s += ts[j].textContent;
    }
    out.push(s);
  }
  return out;
}

function parseStyles(bytes) {
  if (!bytes) return [];
  var d = xml(bytes);
  var builtin = { 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1, 21: 1, 22: 1, 45: 1, 46: 1, 47: 1 };
  var custom = {};
  var nf = d.getElementsByTagName("numFmt");
  for (var i = 0; i < nf.length; i++) {
    var code = (nf[i].getAttribute("formatCode") || "")
      .replace(/\[[^\]]*\]/g, "").replace(/"[^"]*"/g, "");
    custom[+nf[i].getAttribute("numFmtId")] = /[dmyh]/i.test(code);
  }
  var cx = d.getElementsByTagName("cellXfs")[0];
  var xfs = cx ? cx.getElementsByTagName("xf") : [];
  var isDate = [];
  for (var k = 0; k < xfs.length; k++) {
    var id = +(xfs[k].getAttribute("numFmtId") || 0);
    isDate[k] = !!(builtin[id] || custom[id]);
  }
  return isDate;
}

function colIdx(ref) {
  var n = 0;
  for (var i = 0; i < ref.length; i++) {
    var c = ref.charCodeAt(i);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

function cellVal(c, shared, isDate) {
  var t = c.getAttribute("t");
  if (t === "inlineStr") {
    var ts = c.getElementsByTagName("t"), s = "";
    for (var i = 0; i < ts.length; i++) s += ts[i].textContent;
    return s;
  }
  var v = c.getElementsByTagName("v")[0];
  if (!v) return null;
  var raw = v.textContent;
  if (t === "s") { var x = shared[+raw]; return x == null ? "" : x; }
  if (t === "b") return raw === "1";
  if (t === "str" || t === "e") return raw;
  var num = parseFloat(raw);
  if (isNaN(num)) return raw;
  var st = c.getAttribute("s");
  if (st != null && isDate[+st] && num > 0) return { _d: serialToYMD(num) };
  return num;
}

function parseSheet(bytes, shared, isDate) {
  var rowEls = xml(bytes).getElementsByTagName("row"), rows = [];
  for (var i = 0; i < rowEls.length; i++) {
    var cells = rowEls[i].getElementsByTagName("c"), arr = [];
    for (var j = 0; j < cells.length; j++) {
      var ref = cells[j].getAttribute("r");
      arr[ref ? colIdx(ref) : j] = cellVal(cells[j], shared, isDate);
    }
    rows.push(arr);
  }
  return rows;
}

export function readXlsx(file) {
  return file.arrayBuffer().then(unzip).then(function (files) {
    if (!files["xl/workbook.xml"]) throw new Error("No parece un libro de Excel (falta xl/workbook.xml).");
    var shared = parseShared(files["xl/sharedStrings.xml"]);
    var isDate = parseStyles(files["xl/styles.xml"]);
    var rels = {};
    if (files["xl/_rels/workbook.xml.rels"]) {
      var rs = xml(files["xl/_rels/workbook.xml.rels"]).getElementsByTagName("Relationship");
      for (var i = 0; i < rs.length; i++) {
        rels[rs[i].getAttribute("Id")] = rs[i].getAttribute("Target").replace(/^\/?xl\//, "");
      }
    }
    var shs = xml(files["xl/workbook.xml"]).getElementsByTagName("sheet"), out = {};
    for (var k = 0; k < shs.length; k++) {
      var nm = shs[k].getAttribute("name");
      var rid = shs[k].getAttribute("r:id") || shs[k].getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
      var tgt = rels[rid] || ("worksheets/sheet" + (k + 1) + ".xml");
      var bytes = files["xl/" + tgt] || files["xl/worksheets/sheet" + (k + 1) + ".xml"];
      if (bytes) out[nm] = parseSheet(bytes, shared, isDate);
    }
    return out;
  });
}
