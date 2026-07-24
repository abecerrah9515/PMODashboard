# Modularización del Tablero de Control — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestructurar `dashboard.html` (archivo único, ~1650 líneas) en archivos separados por responsabilidad única (CSS/JS/HTML/assets), sin build ni dependencias, manteniendo el tablero funcionalmente idéntico.

**Architecture:** ES Modules nativos (`import`/`export`) organizados en capas (`util` → `xlsx` → `model` → `state` → `render/*` → `main.js`), 3 archivos CSS enlazados con `<link>`, logos SVG como assets externos, `index.html` como shell delgado. Ver spec completa en `docs/superpowers/specs/2026-07-24-dashboard-modularization-design.md`.

**Tech Stack:** HTML5, CSS3, JavaScript ES2017+ (ES Modules), sin frameworks, sin bundler, sin dependencias npm en producción. Node.js (ya instalado, v22.23.1) usado solo como herramienta de verificación local (`node --check`) y para desarrollo (`npx serve`).

## Global Constraints

- Cero paso de build, cero bundler, cero dependencias externas o CDN.
- Compatibilidad mínima: Chrome/Edge 80+, Firefox 113+, Safari 16.4+.
- Destino de publicación: Azure Static Web Apps. No se crea `server.js`.
- Paridad funcional total con `dashboard.html` actual, **excepto** un cambio documentado y aceptado: en local, el proyecto ya no se abre con doble clic (ES Modules bloqueados por CORS sobre `file://`); en su lugar se usa `npx serve .`. La publicación en Static Web Apps no se ve afectada.
- Sin pruebas automatizadas en esta ronda. La verificación de cada paso de código es `node --check <archivo>` (sintaxis) más, al final, una verificación manual funcional completa (Tarea 18).
- **`dashboard.html` permanece intacto en el repo como referencia hasta la Tarea 19** (limpieza final), para poder comparar comportamiento en cualquier momento.
- **Nunca ejecutes `git commit` sin antes preguntarle explícitamente al usuario y esperar su confirmación — sin excepción, incluso si esta plantilla de tarea lista "Commit" como paso.** Cuando el usuario confirme, el mensaje de commit **no debe incluir ningún trailer `Co-Authored-By` ni ninguna mención de IA/Claude** — escríbelo como si el desarrollador lo hubiera hecho directamente.
- Cada paso de "Commit" en este plan significa: `git add` de los archivos de esa tarea, luego preguntar al usuario si desea commitear ahora (puede agrupar varias tareas en un commit si el usuario lo prefiere), y solo ejecutar `git commit` tras su confirmación explícita.

---

### Task 1: Scaffold del proyecto (package.json)

**Files:**
- Create: `package.json`

**Interfaces:**
- Produces: entorno donde `node --check archivo.js` interpreta `import`/`export` sin errores de sintaxis (Node ≥ 20.10 ya detecta sintaxis ESM automáticamente, pero declarar `"type": "module"` deja la intención explícita para cualquier herramienta o desarrollador).

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "pmo-dashboard",
  "private": true,
  "type": "module",
  "description": "Tablero de Control PMO — sitio estático, sin build, sin dependencias en producción."
}
```

- [ ] **Step 2: Verificar que es JSON válido**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

Pide confirmación al usuario antes de commitear (ver Global Constraints). Si confirma:

```bash
git add package.json
git commit -m "Agrega package.json minimo para verificacion local (sin dependencias)"
```

---

### Task 2: Extraer el CSS en 3 archivos

**Files:**
- Create: `css/theme.css`
- Create: `css/shell.css`
- Create: `css/dashboard.css`

**Interfaces:**
- Consumes: `dashboard.html` líneas 4–312 (bloque `<style>`, sin las etiquetas `<style>`/`</style>`).
- Produces: 3 archivos `.css` que, enlazados en ese mismo orden, generan exactamente la misma cascada que el `<style>` original (se extraen por rango de líneas contiguo, sin reordenar reglas).

División exacta por líneas de `dashboard.html`:
- `css/theme.css` ← líneas 4 a 40 (variables `:root`, tema oscuro por `prefers-color-scheme` y por `[data-theme="dark"]`).
- `css/shell.css` ← líneas 42 a 137 (reset, `.tc`/`.tc-wrap`, barra de marca, barra de título, botones de header, barra de origen/mensajes, filtros, encabezados de sección, `.card`, `.empty`).
- `css/dashboard.css` ← líneas 138 a 312 (KPIs, cronograma, Gantt, entregables, matriz de riesgos, tareas/donut, estado vacío, footer, media queries responsive).

- [ ] **Step 1: Extraer los 3 archivos con un script de Node (evita transcripción manual de ~310 líneas de CSS)**

Run:

```bash
node -e "
const fs = require('fs');
const lines = fs.readFileSync('dashboard.html', 'utf8').split(/\r?\n/);
function extract(fromLine, toLine, outPath) {
  const body = lines.slice(fromLine - 1, toLine).join('\n') + '\n';
  fs.writeFileSync(outPath, body);
}
extract(4, 40, 'css/theme.css');
extract(42, 137, 'css/shell.css');
extract(138, 312, 'css/dashboard.css');
console.log('OK');
"
```

Expected: `OK`, y se crean los 3 archivos.

- [ ] **Step 2: Verificar que no se perdió ni duplicó ninguna línea**

Run: `node -e "const fs=require('fs'); const a=fs.readFileSync('css/theme.css','utf8').split(/\r?\n/).length-1; const b=fs.readFileSync('css/shell.css','utf8').split(/\r?\n/).length-1; const c=fs.readFileSync('css/dashboard.css','utf8').split(/\r?\n/).length-1; console.log(a,b,c, a+b+c)"`
Expected: `37 96 175 308` (37+96+175 = 308 líneas). Nota: `sed -n '4,312p' dashboard.html | wc -l` da 309 — la diferencia de 1 línea es la línea 41, una línea en blanco entre el bloque de tema (termina en 40) y el reset (empieza en 42), que se omite a propósito y no pertenece a ninguna regla CSS. Esto ya fue verificado al escribir este plan: ninguna regla se pierde ni se duplica. Si el total no da exactamente 308, ahí sí hay un problema real — revisa los rangos.

- [ ] **Step 3: Verificar visualmente que cada archivo empieza y termina donde debe**

Run: `node -e "const fs=require('fs'); console.log('theme.css primera linea:', fs.readFileSync('css/theme.css','utf8').split(/\r?\n/)[0]); console.log('dashboard.css ultima linea no vacia:', fs.readFileSync('css/dashboard.css','utf8').trim().split(/\r?\n/).pop())"`
Expected: `theme.css primera linea: :root {` y `dashboard.css ultima linea no vacia: @media (prefers-reduced-motion: reduce) { * { transition:none !important; } }`

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add css/theme.css css/shell.css css/dashboard.css
git commit -m "Extrae el CSS embebido en 3 archivos por responsabilidad"
```

---

### Task 3: Extraer los logos SVG a `assets/`

**Files:**
- Create: `assets/vital-logo.svg`
- Create: `assets/softtek-logo.svg`

**Interfaces:**
- Consumes: `dashboard.html` línea 318 (todo el `<svg>...</svg>` del logo VITAL, envuelto en `<div class="vital-logo">...</div>`) y línea 321 (todo el `<svg>...</svg>` del logo Softtek, envuelto en `<span class="stk">...</span>`).
- Produces: dos archivos `.svg` autocontenidos, referenciables vía `<img src="assets/vital-logo.svg">` (los `fill` de los `<path>` son colores fijos, no usan `currentColor`, así que un `<img>` los renderiza igual que el `<svg>` inline).

- [ ] **Step 1: Extraer ambos SVGs con un script de Node (evita transcribir ~3000 caracteres de paths a mano)**

Run:

```bash
node -e "
const fs = require('fs');
const lines = fs.readFileSync('dashboard.html', 'utf8').split(/\r?\n/);

function extractSvg(lineNumber, outPath) {
  const line = lines[lineNumber - 1];
  const start = line.indexOf('<svg');
  const end = line.indexOf('</svg>') + '</svg>'.length;
  if (start < 0 || end < 0) throw new Error('No se encontro <svg>...</svg> en la linea ' + lineNumber);
  const svg = line.slice(start, end);
  fs.writeFileSync(outPath, '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' + svg + '\n');
}

extractSvg(318, 'assets/vital-logo.svg');
extractSvg(321, 'assets/softtek-logo.svg');
console.log('OK');
"
```

Expected: `OK`, y se crean los 2 archivos.

- [ ] **Step 2: Verificar que son XML válido**

Run: `node -e "const {DOMParser}=require('util'); " 2>/dev/null; node -e "const fs=require('fs'); const s=fs.readFileSync('assets/vital-logo.svg','utf8'); if(!s.includes('<svg') || !s.includes('</svg>')) throw new Error('vital-logo.svg incompleto'); const s2=fs.readFileSync('assets/softtek-logo.svg','utf8'); if(!s2.includes('<svg') || !s2.includes('</svg>')) throw new Error('softtek-logo.svg incompleto'); console.log('OK', s.length, s2.length)"`
Expected: `OK` seguido de dos números grandes (longitud en caracteres de cada archivo; deben ser > 3000 dado el volumen de paths).

- [ ] **Step 3: Verificación visual en navegador**

Abre `assets/vital-logo.svg` y `assets/softtek-logo.svg` directamente en una pestaña del navegador (doble clic funciona para archivos `.svg` sueltos, no hay módulos JS involucrados). Confirma que se ve el logo VITAL (rojo/azul) y el logo Softtek (azul marino/verde) correctamente, sin distorsión.

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add assets/vital-logo.svg assets/softtek-logo.svg
git commit -m "Extrae los logos SVG embebidos a assets/"
```

---

### Task 4: `util/dom.js` y `util/dates.js`

**Files:**
- Create: `js/util/dom.js`
- Create: `js/util/dates.js`

**Interfaces:**
- Produces:
  - `dom.js`: `$(id)`, `esc(s)`, `empty(title, subtitle)`
  - `dates.js`: `MES` (array), `fmtD(ymdArray)`, `corto(faseObj)`, `U(ymdArray)`, `ymdOf(timestamp)`, `serialToYMD(excelSerial)`

- [ ] **Step 1: Crear `js/util/dom.js`**

```javascript
export function $(id) { return document.getElementById(id); }

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function empty(t, s) {
  return '<div class="empty"><b>' + esc(t) + '</b>' + esc(s) + '</div>';
}
```

- [ ] **Step 2: Crear `js/util/dates.js`**

```javascript
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
```

- [ ] **Step 3: Verificar sintaxis**

Run: `node --check js/util/dom.js && node --check js/util/dates.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/util/dom.js js/util/dates.js
git commit -m "Agrega utilidades de DOM y fechas (js/util)"
```

---

### Task 5: `model/normalize.js`

**Files:**
- Create: `js/model/normalize.js`

**Interfaces:**
- Produces: `norm(s)`, `txt(v)`, `num(v)`, `ymd(v)`, `estKey(s)`, `impKey(s)`, `splitSub(name)`, `EST_LBL` (objeto `{fin, proc, no}`)

- [ ] **Step 1: Crear `js/model/normalize.js`**

```javascript
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
```

> **Punto delicado de este archivo:** la línea de `norm()` usa un literal de regex con caracteres Unicode combinantes escritos directamente (rango de marcas diacríticas combinantes, U+0300 a U+036F), copiado tal cual del original (`dashboard.html` línea 1086) — es intencional, no un error de tipeo, y es exactamente lo que ya corre en producción hoy. Crea este archivo con la herramienta **Write** directamente (no lo hagas pasar por `bash -e`/heredocs con comillas anidadas: se probó al escribir este plan y una capa extra de escapado de comillas corrompe silenciosamente el `\s+` de la última línea, convirtiéndolo en `s+` — un bug real, ya detectado y evitado aquí). El bloque de código del Step 1 tal como está, pegado con Write, es correcto y ya fue verificado funcionalmente (ver Step 3).

- [ ] **Step 2: Verificar sintaxis**

Run: `node --check js/model/normalize.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Verificar el comportamiento del regex Unicode (el único punto delicado de este archivo)**

Run: `node --input-type=module -e "import { norm, estKey, impKey } from './js/model/normalize.js'; console.log(norm('  Días Totales  ')); console.log(estKey('Finalizado')); console.log(estKey('En Proceso')); console.log(impKey('Alta'));"`
Expected:
```
dias totales
fin
proc
a
```

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/model/normalize.js
git commit -m "Agrega normalizacion de texto/fechas/estados (js/model/normalize.js)"
```

---

### Task 6: `model/default-data.js`

**Files:**
- Create: `js/model/default-data.js`

**Interfaces:**
- Consumes: `dashboard.html` líneas 476–920 (el objeto `DEFAULT_DATA` completo, datos de ejemplo ficticios/anonimizados).
- Produces: `DEFAULT_DATA` (export const, mismo objeto exacto).

- [ ] **Step 1: Extraer el objeto con un script de Node (evita transcribir ~450 líneas de datos a mano)**

Run:

```bash
node -e "
const fs = require('fs');
const lines = fs.readFileSync('dashboard.html', 'utf8').split(/\r?\n/);
// Cuerpo del objeto: lineas 477 a 919 (entre 'var DEFAULT_DATA = {' en la 476 y '};' en la 920)
const body = lines.slice(476, 919).join('\n');
const out = 'export const DEFAULT_DATA = {\n' + body + '\n};\n';
fs.writeFileSync('js/model/default-data.js', out);
console.log('OK');
"
```

Expected: `OK`

- [ ] **Step 2: Verificar sintaxis**

Run: `node --check js/model/default-data.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Verificar que el objeto tiene las colecciones esperadas y el mismo conteo de elementos que el original**

Run: `node --input-type=module -e "import { DEFAULT_DATA as D } from './js/model/default-data.js'; console.log(Object.keys(D)); console.log('fases:', D.fases.length, 'del:', D.del.length, 'risks:', D.risks.length, 'sol:', D.sol.length);"`
Expected (verificado contra el `dashboard.html` actual al escribir este plan — deben coincidir exactamente):
```
[ 'fases', 'del', 'risks', 'sol', 'src' ]
fases: 6 del: 13 risks: 9 sol: 9
```

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/model/default-data.js
git commit -m "Extrae los datos de ejemplo a js/model/default-data.js"
```

---

### Task 7: `xlsx/unzip.js` y `xlsx/xlsx-reader.js`

**Files:**
- Create: `js/xlsx/unzip.js`
- Create: `js/xlsx/xlsx-reader.js`

**Interfaces:**
- Consumes: `js/util/dates.js` → `serialToYMD` (usado por `xlsx-reader.js`).
- Produces:
  - `unzip.js`: `dec(bytes)`, `unzip(arrayBuffer)` (promesa que resuelve a `{nombreArchivoZip: Uint8Array}`)
  - `xlsx-reader.js`: `readXlsx(file)` (promesa que resuelve a `{nombreHoja: filas[][]}`, cada fila es un array de valores de celda; fechas vienen como `{_d: [anio, mes0, dia]}`)

- [ ] **Step 1: Crear `js/xlsx/unzip.js`**

```javascript
export function dec(b) { return new TextDecoder("utf-8").decode(b); }

function inflateRaw(bytes) {
  var ds = new DecompressionStream("deflate-raw");
  var st = new Blob([bytes]).stream().pipeThrough(ds);
  return new Response(st).arrayBuffer().then(function (b) { return new Uint8Array(b); });
}

export function unzip(buf) {
  var dv = new DataView(buf), u8 = new Uint8Array(buf);
  var eocd = -1, min = Math.max(0, u8.length - 65558);
  for (var i = u8.length - 22; i >= min; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("El archivo no es un .xlsx válido (no se encontró la estructura ZIP).");
  var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true);
  var jobs = [], names = [];
  for (var n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    var method = dv.getUint16(p + 10, true);
    var csize = dv.getUint32(p + 20, true);
    var nlen = dv.getUint16(p + 28, true);
    var xlen = dv.getUint16(p + 30, true);
    var clen = dv.getUint16(p + 32, true);
    var lho = dv.getUint32(p + 42, true);
    var name = dec(u8.subarray(p + 46, p + 46 + nlen));
    var lnlen = dv.getUint16(lho + 26, true), lxlen = dv.getUint16(lho + 28, true);
    var start = lho + 30 + lnlen + lxlen;
    var raw = u8.subarray(start, start + csize);
    names.push(name);
    jobs.push(method === 0 ? Promise.resolve(raw) : inflateRaw(raw));
    p += 46 + nlen + xlen + clen;
  }
  return Promise.all(jobs).then(function (vals) {
    var out = {};
    names.forEach(function (nm, i) { out[nm] = vals[i]; });
    return out;
  });
}
```

- [ ] **Step 2: Crear `js/xlsx/xlsx-reader.js`**

```javascript
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
```

- [ ] **Step 3: Verificar sintaxis**

Run: `node --check js/xlsx/unzip.js && node --check js/xlsx/xlsx-reader.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/xlsx/unzip.js js/xlsx/xlsx-reader.js
git commit -m "Agrega el lector de xlsx (js/xlsx): parseo ZIP + XML sin librerias externas"
```

---

### Task 8: `model/build-model.js`

**Files:**
- Create: `js/model/build-model.js`

**Interfaces:**
- Consumes: `js/model/normalize.js` → `norm, txt, num, ymd, estKey, impKey, splitSub`
- Produces: `buildModel(sheets, fname)` → `{errs: string[], warns: string[]}` si falla, o `{data: {fases, del, risks, sol, src}, warns: string[], errs: []}` si tiene éxito.

- [ ] **Step 1: Crear `js/model/build-model.js`**

```javascript
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
```

- [ ] **Step 2: Verificar sintaxis**

Run: `node --check js/model/build-model.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Prueba manual rápida contra los datos de ejemplo**

Run:
```bash
node --input-type=module -e "
import { buildModel } from './js/model/build-model.js';
const sheets = {
  Cronograma: [['Id Fase','Fase','Fecha Inicio','Fecha Fin','Peso','Avance Real','Avance Esperado'], [1,'Prueba',{_d:[2024,0,1]},{_d:[2024,0,31]},1,0.5,1]],
  Entregables: [['Id Entregable','Entregable','Id Fase','Avance'], [1,'Doc de prueba',1,0.5]],
  Riesgos: [['Id Riesgo','Riesgo','Impacto','Probabilidad Ocurrencia'], [1,'Riesgo de prueba','Alto',0.5]],
  Solicitudes: [['Id Solicitud','Solicitud','Estado'], [1,'Tarea de prueba','En proceso']]
};
const res = buildModel(sheets, 'prueba.xlsx');
console.log(JSON.stringify(res, null, 2));
"
```
Expected: un objeto con `data.fases[0].nom === "Prueba"`, `data.risks[0].imp === "a"`, `data.sol[0].est === "proc"`, y `errs: []`.

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/model/build-model.js
git commit -m "Agrega buildModel: filas crudas de xlsx al modelo del dominio"
```

---

### Task 9: `state.js`

**Files:**
- Create: `js/state.js`

**Interfaces:**
- Produces: `state` (objeto mutable `{fase, estado}`), `getData()`, `setData(d)` (reemplaza el dato activo y resetea filtros a `"all"`), `faseOk(id)`, `estadoOk(clave)`.

- [ ] **Step 1: Crear `js/state.js`**

```javascript
export const state = { fase: "all", estado: "all" };

let DATA = null;

export function getData() { return DATA; }

export function setData(d) {
  DATA = d;
  state.fase = "all";
  state.estado = "all";
}

export function faseOk(f) { return state.fase === "all" || f === +state.fase; }

export function estadoOk(e) { return state.estado === "all" || e === state.estado; }
```

- [ ] **Step 2: Verificar sintaxis**

Run: `node --check js/state.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Prueba manual de comportamiento**

Run:
```bash
node --input-type=module -e "
import { state, getData, setData, faseOk, estadoOk } from './js/state.js';
console.log('inicial:', getData(), state.fase, state.estado);
setData({ src: 'x.xlsx' });
console.log('tras setData:', getData(), state.fase, state.estado);
state.fase = '3';
console.log('faseOk(3):', faseOk(3), 'faseOk(4):', faseOk(4));
console.log('estadoOk(\"all\" activo):', estadoOk('fin'));
"
```
Expected:
```
inicial: null all all
tras setData: { src: 'x.xlsx' } all all
faseOk(3): true faseOk(4): false
estadoOk("all" activo): true
```

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/state.js
git commit -m "Agrega state.js: dato activo y filtros de fase/estado"
```

---

### Task 10: `render/kpis.js` y `render/cronograma.js`

**Files:**
- Create: `js/render/kpis.js`
- Create: `js/render/cronograma.js`

**Interfaces:**
- Consumes: `js/util/dom.js` (`$`, `esc`, `empty`), `js/util/dates.js` (`fmtD`). Ambos reciben un objeto `ctx` construido por `js/render/index.js` (Tarea 13) con esta forma (documentada aquí para que las tareas 10–13 usen exactamente los mismos nombres):

```
ctx = {
  fases, dels, sols, solsFase,      // arrays YA filtrados por fase/estado
  allFases, allRisks, allSol,       // arrays SIN filtrar (para secciones que no dependen de filtros)
  nF, nD, nR, nS,                   // totales sin filtrar
  scoped,                           // boolean: hay algún filtro activo
  estadoFiltro,                     // state.estado actual (string)
  TL,                               // { t0, t1, span, months } o null
  src,                              // DATA.src
  peso, avReal, avEsp, gap,         // agregados de cronograma (ya calculados sobre `fases`)
  rA, rM, rB, ctrl                  // agregados de riesgos (ya calculados sobre `allRisks`)
}
```

- Produces: `renderKpis(ctx)`, `renderCronograma(ctx)` — ambas escriben directamente en el DOM (ids `#kpis`, `#cron-head`, `#cron-body`, `#cron-foot`) y no retornan nada.

- [ ] **Step 1: Crear `js/render/kpis.js`**

```javascript
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
```

- [ ] **Step 2: Crear `js/render/cronograma.js`**

```javascript
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
```

- [ ] **Step 3: Verificar sintaxis**

Run: `node --check js/render/kpis.js && node --check js/render/cronograma.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/render/kpis.js js/render/cronograma.js
git commit -m "Agrega renderizado de KPIs y cronograma (js/render)"
```

---

### Task 11: `render/gantt.js` y `render/entregables.js`

**Files:**
- Create: `js/render/gantt.js`
- Create: `js/render/entregables.js`

**Interfaces:**
- Consumes: mismo `ctx` de la Tarea 10; `gantt.js` además usa `js/util/dates.js` (`fmtD`, `ymdOf`, `U`).
- Produces: `renderGantt(ctx)`, `renderEntregables(ctx)`.

- [ ] **Step 1: Crear `js/render/gantt.js`**

```javascript
import { $, esc, empty } from "../util/dom.js";
import { fmtD, ymdOf, U } from "../util/dates.js";

export function renderGantt(ctx) {
  var fases = ctx.fases, TL = ctx.TL;
  var gf = fases.filter(function (f) { return f.s && f.e; });

  if (TL) {
    var grid = "", sc = "";
    TL.months.forEach(function (m) {
      sc += '<span class="gantt-mlbl" style="left:' + m.p + '%">' + m.lbl + '</span>';
      if (m.line) grid += '<i style="left:' + m.p + '%"></i>';
    });
    $("gantt-scale").innerHTML = sc;
    $("gantt-note").textContent = "Duración real de cada fase sobre el calendario del proyecto ("
      + fmtD(ymdOf(TL.t0)) + " → " + fmtD(ymdOf(TL.t1)) + ") · el relleno indica el avance alcanzado";
    $("gantt-body").innerHTML = gf.length ? gf.map(function (f) {
      var l = (U(f.s) - TL.t0) / TL.span * 100, w = (U(f.e) - U(f.s)) / TL.span * 100;
      var pct = Math.round(f.real * 100), done = f.real >= f.esp && f.esp > 0;
      var tip = f.nom + ' · ' + fmtD(f.s) + ' → ' + fmtD(f.e) + ' · ' + f.dias + ' días · avance ' + pct + '%';
      return '<div class="gantt-row"><div class="gantt-lbl">' + esc(f.nom) + '</div>' +
        '<div class="gantt-lane"><div class="gantt-grid">' + grid + '</div>' +
          '<div class="gantt-bar" style="left:' + l + '%;width:' + Math.max(w, 0.5) + '%" title="' + esc(tip) + '">' +
            '<span class="' + (done ? "done" : "wip") + '" style="width:' + Math.min(pct, 100) + '%"></span><b>' + f.dias + 'd</b></div>' +
        '</div></div>';
    }).join("") : empty("Sin fases que mostrar", "La línea de tiempo sigue los mismos filtros.");
  } else {
    $("gantt-scale").innerHTML = "";
    $("gantt-note").textContent = "";
    $("gantt-body").innerHTML = empty("Sin fechas", "Ninguna fase del archivo tiene fecha de inicio y fin.");
  }
}
```

- [ ] **Step 2: Crear `js/render/entregables.js`**

```javascript
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
```

- [ ] **Step 3: Verificar sintaxis**

Run: `node --check js/render/gantt.js && node --check js/render/entregables.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/render/gantt.js js/render/entregables.js
git commit -m "Agrega renderizado de Gantt y entregables (js/render)"
```

---

### Task 12: `render/riesgos.js` y `render/tareas.js`

**Files:**
- Create: `js/render/riesgos.js`
- Create: `js/render/tareas.js`

**Interfaces:**
- Consumes: mismo `ctx` de la Tarea 10; `tareas.js` además usa `js/util/dates.js` (`fmtD`, `U`, `MES`) y `js/model/normalize.js` (`EST_LBL`).
- Produces: `renderRiesgos(ctx)`, `renderTareas(ctx)`.

- [ ] **Step 1: Crear `js/render/riesgos.js`**

```javascript
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
```

- [ ] **Step 2: Crear `js/render/tareas.js`**

```javascript
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
```

- [ ] **Step 3: Verificar sintaxis**

Run: `node --check js/render/riesgos.js && node --check js/render/tareas.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add js/render/riesgos.js js/render/tareas.js
git commit -m "Agrega renderizado de riesgos y tareas (js/render)"
```

---

### Task 13: `render/index.js` (orquestador)

**Files:**
- Create: `js/render/index.js`

**Interfaces:**
- Consumes: `js/util/dom.js` (`$`, `esc`), `js/util/dates.js` (`MES`, `fmtD`, `corto`, `U`), `js/model/normalize.js` (`norm`, `EST_LBL`), `js/state.js` (`state`, `getData`, `faseOk`, `estadoOk`), y las 6 funciones de render de las Tareas 10–12 (`renderKpis`, `renderCronograma`, `renderGantt`, `renderEntregables`, `renderRiesgos`, `renderTareas`).
- Produces: `applyView()`, `buildFilters()`, `render()` — las 3 funciones que `main.js` (Tarea 14) invoca para reaccionar a cambios de datos/filtros.

- [ ] **Step 1: Crear `js/render/index.js`**

```javascript
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
```

> Nota de diseño (mejora puntual acordada en la spec): a diferencia del original, aquí **no** se hace `$("clearBtn").addEventListener(...)` dentro de `render()`. Ese enganche se mueve a `main.js` (Tarea 14) como delegación de eventos sobre `#srcbar`, consistente con cómo ya se manejan los chips de filtro.

- [ ] **Step 2: Verificar sintaxis**

Run: `node --check js/render/index.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Commit** (pedir confirmación al usuario primero)

```bash
git add js/render/index.js
git commit -m "Agrega el orquestador de render (js/render/index.js)"
```

---

### Task 14: `main.js`

**Files:**
- Create: `js/main.js`

**Interfaces:**
- Consumes: `js/util/dom.js` (`$`, `esc`), `js/xlsx/xlsx-reader.js` (`readXlsx`), `js/model/build-model.js` (`buildModel`), `js/model/default-data.js` (`DEFAULT_DATA`), `js/state.js` (`state`, `setData`), `js/render/index.js` (`applyView`, `buildFilters`, `render`).
- Produces: ningún export — es el punto de entrada que engancha todos los event listeners del DOM y arranca la aplicación (`applyView()` al final).

- [ ] **Step 1: Crear `js/main.js`**

```javascript
import { $, esc } from "./util/dom.js";
import { readXlsx } from "./xlsx/xlsx-reader.js";
import { buildModel } from "./model/build-model.js";
import { DEFAULT_DATA } from "./model/default-data.js";
import { state, setData } from "./state.js";
import { applyView, buildFilters, render } from "./render/index.js";

function msg(kind, title, lines) {
  var el = $("loadmsg");
  el.className = "loadmsg " + kind;
  el.innerHTML = "<b>" + title + "</b>" + (lines && lines.length
    ? "<ul><li>" + lines.join("</li><li>") + "</li></ul>" : "");
  if (kind === "ok") setTimeout(function () { el.className = "loadmsg"; }, 6000);
}

function loadData(d, warns) {
  setData(d);
  applyView();
  if (d) { buildFilters(); render(); }
  if (d && d !== DEFAULT_DATA) {
    msg("ok", "Datos cargados de “" + d.src + "”.", warns);
  } else {
    $("loadmsg").className = "loadmsg";
  }
}

$("loadBtn").addEventListener("click", function () { $("fileInput").click(); });
$("emptyLoadBtn").addEventListener("click", function () { $("fileInput").click(); });
$("emptyExample").addEventListener("click", function () { loadData(DEFAULT_DATA, []); });

$("fileInput").addEventListener("change", function (ev) {
  var file = ev.target.files && ev.target.files[0];
  if (!file) return;
  $("fileInput").value = "";
  if (!/\.xlsx$/i.test(file.name)) {
    msg("err", "Formato no soportado", ["Se esperaba un archivo <code>.xlsx</code>. Si tu archivo es <code>.xls</code> o <code>.csv</code>, guárdalo como .xlsx desde Excel."]);
    return;
  }
  if (typeof DecompressionStream === "undefined") {
    msg("err", "Navegador no compatible", ["Este lector necesita <code>DecompressionStream</code> (Chrome/Edge 80+, Firefox 113+, Safari 16.4+)."]);
    return;
  }
  msg("ok", "Leyendo “" + file.name + "”…", []);
  readXlsx(file).then(function (sheets) {
    var res = buildModel(sheets, file.name);
    if (res.errs && res.errs.length) {
      msg("err", "No se pudo usar “" + file.name + "”", res.errs.concat(
        ["Hojas encontradas: <code>" + Object.keys(sheets).join("</code>, <code>") + "</code>"],
        ["El tablero sigue mostrando los datos anteriores."]));
      return;
    }
    loadData(res.data, res.warns);
  }).catch(function (e) {
    msg("err", "Error al leer “" + file.name + "”", [esc(e && e.message ? e.message : String(e)),
      "El tablero sigue mostrando los datos anteriores."]);
  });
});

$("f-fase").addEventListener("click", function (ev) {
  var b = ev.target.closest("[data-f]"); if (!b) return;
  state.fase = b.dataset.f; render();
});
$("f-estado").addEventListener("click", function (ev) {
  var b = ev.target.closest("[data-e]"); if (!b) return;
  state.estado = b.dataset.e; render();
});
$("freset").addEventListener("click", function () { state.fase = "all"; state.estado = "all"; render(); });

$("srcbar").addEventListener("click", function (ev) {
  if (ev.target.closest("#clearBtn")) loadData(null, []);
});

$("themeBtn").addEventListener("click", function () {
  var root = document.documentElement, cur = root.getAttribute("data-theme");
  if (!cur) cur = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
});

applyView();
```

> Nota: se elimina el hack `window.__tc` del original (exponía `readXlsx`/`buildModel`/`setData` como globals para poder probarlos manualmente desde la consola). Ya no hace falta: con módulos ES reales, cualquier función se puede importar y probar directamente (ver Tareas 5–9, que ya usan `node --input-type=module -e "import {...} from './js/...'"` para esto mismo).

- [ ] **Step 2: Verificar sintaxis**

Run: `node --check js/main.js && echo OK`
Expected: `OK`

- [ ] **Step 3: Commit** (pedir confirmación al usuario primero)

```bash
git add js/main.js
git commit -m "Agrega main.js: wiring de eventos y arranque de la app"
```

---

### Task 15: `index.html`

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `css/theme.css`, `css/shell.css`, `css/dashboard.css`, `assets/vital-logo.svg`, `assets/softtek-logo.svg`, `js/main.js`.
- Produces: el documento HTML completo que reemplaza a `dashboard.html` como página servida.

- [ ] **Step 1: Crear `index.html`**

Mismo cuerpo HTML que `dashboard.html` líneas 315–470, con estos cambios:
- Las etiquetas `<style>...</style>` (líneas 3–313) se reemplazan por 3 `<link rel="stylesheet">`.
- La línea 318 (`<div class="vital-logo"><svg>...</svg></div>`) se reemplaza por `<div class="vital-logo"><img src="assets/vital-logo.svg" alt="VITAL Supermayorista"></div>`.
- La línea 321 (`<span class="stk"><svg>...</svg></span>`) se reemplaza por `<span class="stk"><img src="assets/softtek-logo.svg" alt="Softtek"></span>`.
- El bloque `<script>...</script>` (líneas 472–1651) se reemplaza por `<script type="module" src="js/main.js"></script>`.
- Se mantiene la ausencia de `<!DOCTYPE html>`/`<html>`/`<head>`/`<body>` explícitos, igual que el original, para no arriesgar ningún cambio de comportamiento de renderizado (parseo tolerante del navegador, igual que hoy).

```html
<meta charset="utf-8">
<title>Tablero de Control · VITAL Supermayorista</title>
<link rel="stylesheet" href="css/theme.css">
<link rel="stylesheet" href="css/shell.css">
<link rel="stylesheet" href="css/dashboard.css">

<div class="tc">
  <div class="brandbar">
    <div class="tc-wrap">
      <div class="vital-logo"><img src="assets/vital-logo.svg" alt="VITAL Supermayorista"></div>
      <div class="powered">
        <span class="lbl">Powered by</span>
        <span class="stk"><img src="assets/softtek-logo.svg" alt="Softtek"></span>
      </div>
    </div>
  </div>

  <header class="titlebar">
    <div class="tc-wrap">
      <div>
        <div class="tc-eyebrow">VITAL Supermayorista · Plataforma Analítica</div>
        <div class="tc-title">Tablero de Control del Proyecto</div>
        <div class="tc-sub">Seguimiento integral de cronograma, entregables, riesgos y tareas.</div>
      </div>
      <div class="tc-hright">
        <div class="tc-actions">
          <button class="hbtn primary" id="loadBtn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
            Cargar Excel
          </button>
          <input type="file" id="fileInput" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr">
          <button class="hbtn theme-btn" id="themeBtn" type="button" aria-label="Cambiar tema">
            <svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            <span class="lbl-light">Modo oscuro</span><span class="lbl-dark">Modo claro</span>
          </button>
        </div>
        <div class="tc-meta" id="tc-meta"></div>
      </div>
    </div>
  </header>

  <div class="tc-wrap">
    <div class="srcbar" id="srcbar"></div>
    <div class="loadmsg" id="loadmsg" role="status" aria-live="polite"></div>
  </div>

  <div class="filters" id="filtersBar">
    <div class="tc-wrap">
      <div class="filters-in">
        <div class="fgroup">
          <span class="flabel">Fase</span>
          <div id="f-fase" style="display:flex;gap:7px;flex-wrap:wrap;"></div>
        </div>
        <div class="fdiv"></div>
        <div class="fgroup">
          <span class="flabel">Estado</span>
          <div id="f-estado" style="display:flex;gap:7px;flex-wrap:wrap;"></div>
        </div>
        <div class="fclear">
          <span class="fcount" id="fcount"></span>
          <button class="freset" id="freset" type="button">Limpiar filtros</button>
        </div>
      </div>
    </div>
  </div>

  <div class="estate" id="emptyState">
    <div class="estate-card">
      <div class="estate-ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2M8 17h2M14 13h2M14 17h2"/></svg>
      </div>
      <h2>Aún no hay datos cargados</h2>
      <p>Carga un archivo Excel con el formato del proyecto (hojas <b>Cronograma</b>, <b>Solicitudes</b>, <b>Riesgos</b> y <b>Entregables</b>) para ver el tablero.</p>
      <button class="hbtn" id="emptyLoadBtn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
        Cargar Excel
      </button>
      <span class="example">o <button id="emptyExample" type="button">ver el tablero con datos de ejemplo</button></span>
      <div class="hint">El archivo se procesa en tu navegador; no se sube a ningún servidor. También puedes usar el botón <code>Cargar Excel</code> de la esquina superior.</div>
    </div>
  </div>

  <div class="tc-wrap" id="dashboardBody">
    <div class="kpis" id="kpis"></div>

    <section>
      <div class="tc-sechead">
        <span class="tc-secnum">1</span>
        <span class="tc-sectitle">Cronograma · avance por fase</span>
        <span class="tc-secnote">Barra = avance real · línea <b>meta</b> = esperado</span>
      </div>
      <div class="card">
        <div class="cron-head" id="cron-head">
          <div>Fase</div><div>Fechas</div><div>Avance real vs. meta</div><div class="r">Peso</div><div class="r">Dif.</div>
        </div>
        <div id="cron-body"></div>
        <div class="cron-foot" id="cron-foot"></div>
      </div>

      <div class="card" style="margin-top:20px;">
        <h3>Línea de tiempo de las fases</h3>
        <p class="cardnote" id="gantt-note"></p>
        <div class="gantt-months">
          <div></div>
          <div class="gantt-scale" id="gantt-scale"></div>
        </div>
        <div id="gantt-body"></div>
        <div class="gantt-legend">
          <span><i class="gantt-key" style="background:var(--good)"></i> Fase completada (100%)</span>
          <span><i class="gantt-key" style="background:var(--brand)"></i> Avance real</span>
          <span><i class="gantt-key" style="background:var(--track);box-shadow:inset 0 0 0 1px var(--hair-strong)"></i> Pendiente</span>
        </div>
      </div>
    </section>

    <div class="grid-2" style="margin-top:34px;">
      <section style="margin-top:0;">
        <div class="tc-sechead"><span class="tc-secnum">2</span><span class="tc-sectitle">Entregables</span></div>
        <div class="card">
          <h3>Avance por entregable · rol responsable</h3>
          <p class="cardnote" id="del-note"></p>
          <div id="del-list"></div>
        </div>
      </section>

      <section style="margin-top:0;">
        <div class="tc-sechead"><span class="tc-secnum">3</span><span class="tc-sectitle">Riesgos</span></div>
        <div class="card">
          <div class="nofilter" id="risk-nofilter"></div>
          <h3>Matriz impacto × probabilidad</h3>
          <p class="cardnote" id="risk-note"></p>
          <div class="matrix" id="risk-matrix"></div>
          <h3 style="margin-top:22px;">Detalle de riesgos y mitigación</h3>
          <div id="risk-list" style="margin-top:12px;"></div>
        </div>
      </section>
    </div>

    <section>
      <div class="tc-sechead">
        <span class="tc-secnum">4</span><span class="tc-sectitle">Tareas</span>
        <span class="tc-secnote" id="sol-note"></span>
      </div>
      <div class="grid-2">
        <div class="card">
          <h3>Estado de las tareas</h3>
          <p class="cardnote">Distribución por estado de la fase seleccionada</p>
          <div class="donut-wrap" id="donut-wrap"></div>
          <div class="sol-insight" id="sol-insight"></div>
        </div>
        <div class="card">
          <h3>Detalle de tareas</h3>
          <p class="cardnote" id="sol-detail-note"></p>
          <div id="sol-list"></div>
        </div>
      </div>
    </section>

    <div class="footer" id="footer"></div>
  </div>
</div>
<script type="module" src="js/main.js"></script>
```

- [ ] **Step 2: Verificar que todos los ids referenciados por los módulos JS existen en el HTML**

Run: `node -e "
const html = require('fs').readFileSync('index.html', 'utf8');
const ids = ['loadBtn','fileInput','themeBtn','tc-meta','srcbar','loadmsg','filtersBar','f-fase','f-estado','fcount','freset','emptyState','emptyLoadBtn','emptyExample','dashboardBody','kpis','cron-head','cron-body','cron-foot','gantt-note','gantt-scale','gantt-body','del-note','del-list','risk-nofilter','risk-note','risk-matrix','risk-list','sol-note','donut-wrap','sol-insight','sol-detail-note','sol-list','footer'];
const missing = ids.filter(id => !html.includes('id=\"'+id+'\"'));
console.log(missing.length ? 'FALTAN: ' + missing.join(', ') : 'OK, todos los ids presentes');
"`
Expected: `OK, todos los ids presentes`

- [ ] **Step 3: Commit** (pedir confirmación al usuario primero)

```bash
git add index.html
git commit -m "Agrega index.html: shell delgado que enlaza css/js externos"
```

---

### Task 16: `staticwebapp.config.json` en la raíz + reubicar el archivo de ejemplo

**Files:**
- Create: `staticwebapp.config.json` (raíz)
- Move: `deploy/ejemplo-datos.xlsx` → `ejemplo-datos.xlsx` (raíz)

**Interfaces:**
- Produces: raíz del repo autocontenida y publicable tal cual en Azure Static Web Apps (sin necesitar la carpeta `deploy/`).

- [ ] **Step 1: Copiar `staticwebapp.config.json` a la raíz**

```bash
node -e "
const fs = require('fs');
fs.copyFileSync('deploy/staticwebapp.config.json', 'staticwebapp.config.json');
console.log('OK');
"
```

Expected: `OK`. Contenido esperado en `staticwebapp.config.json` (verifícalo con Read, debe ser idéntico a `deploy/staticwebapp.config.json`):

```json
{
  "$schema": "https://json.schemastore.org/staticwebapp.config.json",
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "mimeTypes": {
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "SAMEORIGIN"
  },
  "routes": [
    {
      "route": "/",
      "rewrite": "/index.html"
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html"
    }
  }
}
```

- [ ] **Step 2: Mover el archivo de datos de ejemplo a la raíz**

```bash
git mv deploy/ejemplo-datos.xlsx ejemplo-datos.xlsx
```

- [ ] **Step 3: Verificar que el JSON copiado es válido**

Run: `node -e "JSON.parse(require('fs').readFileSync('staticwebapp.config.json','utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero)

```bash
git add staticwebapp.config.json
git commit -m "Mueve staticwebapp.config.json y el excel de ejemplo a la raiz"
```

---

### Task 17: Reescribir `README.md`

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: documentación actualizada con la estructura de carpetas, la responsabilidad de cada archivo, instrucciones de desarrollo local (`npx serve .`) y de publicación (Azure Static Web Apps apuntando a la raíz).

- [ ] **Step 1: Reescribir `README.md` completo**

```markdown
# PMO Dashboard — Tablero de Control

Tablero de control de proyecto (cronograma, entregables, riesgos y tareas) en un
sitio web estático, autónomo, sin servidor ni dependencias externas. Permite
**cargar un archivo Excel** para visualizar otros datos con el mismo formato.

## Estructura del proyecto

```
/
├── index.html                    ← shell: markup + enlaces a CSS/JS
├── staticwebapp.config.json      ← configuración de Azure Static Web Apps
├── ejemplo-datos.xlsx            ← archivo de muestra para probar "Cargar Excel"
├── assets/
│   ├── vital-logo.svg            ← logo VITAL
│   └── softtek-logo.svg          ← logo Softtek
├── css/
│   ├── theme.css                 ← variables de marca, tema claro/oscuro
│   ├── shell.css                 ← barra de marca, título, filtros, estado vacío, footer
│   └── dashboard.css             ← KPIs, cronograma, Gantt, entregables, riesgos, tareas
└── js/
    ├── main.js                   ← punto de entrada: eventos del DOM y arranque
    ├── util/
    │   ├── dom.js                 ← helpers de DOM/escape (`$`, `esc`, `empty`)
    │   └── dates.js               ← utilidades de fecha (`MES`, `fmtD`, `U`, `ymdOf`, `corto`, `serialToYMD`)
    ├── xlsx/
    │   ├── unzip.js               ← parseo de la estructura ZIP + descompresión
    │   └── xlsx-reader.js         ← de bytes de `.xlsx` a filas crudas por hoja
    ├── model/
    │   ├── normalize.js           ← normalización de texto/fechas/estados en español
    │   ├── build-model.js         ← filas crudas → modelo del dominio (fases, entregables, riesgos, tareas)
    │   └── default-data.js        ← datos de ejemplo (ficticios)
    ├── state.js                   ← dato activo y filtros de fase/estado
    └── render/
        ├── index.js                ← orquestador: aplica filtros, calcula la línea de tiempo, delega a cada sección
        ├── kpis.js                 ← tarjetas KPI
        ├── cronograma.js           ← tabla de fases
        ├── gantt.js                ← línea de tiempo / diagrama de Gantt
        ├── entregables.js          ← lista de entregables por hito
        ├── riesgos.js               ← matriz impacto × probabilidad + detalle
        └── tareas.js                ← donut + detalle de tareas
```

### Responsabilidad de cada módulo

| Carpeta/archivo | Responsabilidad |
|---|---|
| `js/xlsx/` | Leer bytes de un `.xlsx` y devolver filas crudas por hoja. No conoce el dominio (fases, riesgos, etc.). |
| `js/model/` | Transformar filas crudas en el modelo del dominio: mapeo de columnas por alias, validación de columnas obligatorias, normalización de estados/impactos. No toca el DOM. |
| `js/state.js` | Cuál es el dato activo y qué filtros están activos. No renderiza. |
| `js/render/*.js` | Cada archivo pinta **una** sección a partir de datos ya filtrados que recibe por parámetro. |
| `js/render/index.js` | Aplica los filtros, calcula la línea de tiempo compartida y delega el pintado sección por sección. |
| `js/main.js` | Único que engancha eventos del DOM (botones, filtros, tema, carga de archivo) y orquesta el flujo completo. |

## Uso — desarrollo local

Con ES Modules nativos, el navegador bloquea por CORS la carga de módulos si abres
`index.html` directo por doble clic (protocolo `file://`). Para desarrollo local, levanta
un servidor estático simple:

```bash
npx serve .
```

(usa Node, que solo necesitas tener instalado — no agrega dependencias al proyecto ni
`node_modules` al repo). Abre la URL que te indique (normalmente `http://localhost:3000`).
Alternativa: la extensión "Live Server" de VS Code, con recarga automática al guardar.

Una vez abierto, usa el botón **Cargar Excel** para visualizar un `.xlsx` propio con
las hojas `Cronograma`, `Solicitudes`, `Riesgos` y `Entregables` (mismo formato que
`ejemplo-datos.xlsx`), o el enlace "ver el tablero con datos de ejemplo" para cargar
datos ficticios sin necesidad de un archivo.

Requiere un navegador moderno: Chrome/Edge 80+, Firefox 113+, Safari 16.4+.

## Publicación en Azure Static Web Apps

El proyecto ya es autocontenido en la raíz del repo — no hace falta ninguna carpeta
de "deploy" ni build previo.

```bash
az login
swa deploy ./ --env production
```

O desde el portal de Azure: **Create → Static Web App → Deployment "Other"**, apuntando
al contenido de este repo. Azure da HTTPS y un dominio `*.azurestaticapps.net`
automáticamente. `staticwebapp.config.json` (en la raíz) configura las cabeceras y la
ruta por defecto.

- **"Cargar Excel" funciona igual una vez publicado.** El archivo se lee en el
  navegador del usuario; no se sube al servidor ni se comparte con nadie.
- La carga es **por sesión**: al recargar la página se vuelve al estado vacío. Para que
  todos vean datos actualizados sin cargar el Excel a mano, haría falta un backend
  (API + base de datos) — no es el alcance de este proyecto hoy.

## Nota de marca

La aplicación usa la identidad de VITAL Supermayorista y la atribución
"Powered by Softtek". El uso del logo de Softtek requiere aprobación de su área
Legal y de Marketing (`global.image@softtek.com`) antes de salir a producción.
Los manuales de marca **no** se versionan en este repositorio.
```

- [ ] **Step 2: Verificar que el README no referencia archivos/carpetas que ya no existen**

Run: `grep -n "dashboard.html\|deploy/" README.md`
Expected: sin coincidencias (si aparece algo, revisa y corrige antes de continuar).

- [ ] **Step 3: Commit** (pedir confirmación al usuario primero)

```bash
git add README.md
git commit -m "Actualiza README con la nueva estructura y guia de desarrollo/publicacion"
```

---

### Task 18: Verificación manual de paridad funcional

**Files:** ninguno (solo verificación, sin cambios de código)

Esta tarea reemplaza las pruebas automatizadas (fuera de alcance en esta ronda). Es la
comprobación de que el tablero reestructurado se comporta **exactamente igual** que
`dashboard.html`.

- [ ] **Step 1: Levantar el servidor local**

Run: `npx serve .` (en una terminal aparte, déjalo corriendo)
Expected: indica una URL local, ej. `http://localhost:3000`.

- [ ] **Step 2: Abrir `dashboard.html` original y `index.html` nuevo en dos pestañas del navegador, lado a lado**

`dashboard.html` se abre con doble clic (sigue funcionando, no usa módulos). `index.html`
se abre en `http://localhost:3000` (o la URL que indique `npx serve`).

- [ ] **Step 3: Checklist de paridad — marca cada punto comparando ambas pestañas**

- [ ] Ambas muestran el estado vacío inicial ("Aún no hay datos cargados") con el mismo texto y estilo.
- [ ] Clic en "ver el tablero con datos de ejemplo" en ambas → mismos KPIs (mismo % de avance real, mismo número de entregables/riesgos/tareas — compara los conteos exactos que anotaste en la Tarea 6, Step 3).
- [ ] Cronograma: mismas fases, mismas fechas, misma barra de avance real vs. meta, mismo "Dif." por fase.
- [ ] Gantt: mismas barras, mismas etiquetas de meses, mismo tooltip al pasar el mouse sobre una barra.
- [ ] Entregables: mismos grupos por hito, mismo color por rango de avance (verde/ámbar/rojo).
- [ ] Riesgos: misma matriz impacto × probabilidad, mismo detalle de mitigación por riesgo.
- [ ] Tareas: mismo donut, misma leyenda, mismo texto de "tasa de cierre" y de fechas de creación.
- [ ] Filtro por fase: clic en un chip de fase en ambas → mismos datos filtrados, mismo conteo en "Mostrando X fases · Y entregables · Z tareas".
- [ ] Filtro por estado: igual que el anterior, con un chip de estado.
- [ ] "Limpiar filtros" restablece ambos tableros a la vista completa.
- [ ] Botón "Quitar datos": en ambos vuelve al estado vacío.
- [ ] Cargar un archivo `.xlsx` real (usa `ejemplo-datos.xlsx`, ahora en la raíz) en ambas pestañas → mismo resultado.
- [ ] Cargar un archivo que NO sea `.xlsx` (renombra cualquier archivo a `.txt` y súbelo) → mismo mensaje de error "Formato no soportado" en ambas.
- [ ] Cargar un `.xlsx` sin alguna hoja obligatoria (ej. duplica `ejemplo-datos.xlsx`, ábrelo en Excel, borra la hoja "Riesgos", guárdalo, súbelo) → mismo mensaje "No se pudo usar..." con el mismo detalle de hojas encontradas, en ambas.
- [ ] Toggle de tema claro/oscuro: mismo comportamiento visual en ambas.
- [ ] Reduce el ancho de la ventana del navegador (< 900px): mismo layout responsive en ambas (columnas de KPI, cronograma sin encabezado de tabla, etc.).
- [ ] Abre las herramientas de desarrollador (consola) en la pestaña de `index.html` durante todo el recorrido: no debe haber ningún error ni advertencia en consola.

- [ ] **Step 4: Si algún punto del checklist falla**

Detente, no continúes a la Tarea 19. Identifica el módulo responsable de esa sección (usa la tabla de responsabilidades del README) y corrige el archivo correspondiente. Vuelve a correr el checklist completo desde el Step 3 después de corregir.

- [ ] **Step 5: Sin commit en esta tarea** (es solo verificación, no hay archivos que commitear).

---

### Task 19: Limpieza final — eliminar `dashboard.html` y `deploy/`

**Files:**
- Delete: `dashboard.html`
- Delete: `deploy/` (carpeta completa: `deploy/index.html`, `deploy/README.md`, `deploy/staticwebapp.config.json`; `deploy/ejemplo-datos.xlsx` ya se movió en la Tarea 16)

**Interfaces:** ninguna (solo elimina archivos ya reemplazados).

**Precondición: la Tarea 18 (verificación manual de paridad) debe haber pasado por completo antes de ejecutar esta tarea.**

- [ ] **Step 1: Confirmar explícitamente con el usuario antes de borrar nada**

Esto es una acción difícil de revertir en el árbol de trabajo (aunque recuperable vía git
si ya hay commits previos). Pregunta: *"La verificación de paridad pasó — ¿confirmas que
borre `dashboard.html` y la carpeta `deploy/` ahora que `index.html` + `css/` + `js/` +
`assets/` los reemplazan?"*

- [ ] **Step 2: Borrar los archivos (solo tras confirmación)**

```bash
git rm dashboard.html
git rm -r deploy
```

- [ ] **Step 3: Verificar que el repo sigue funcionando sin esos archivos**

Run: `npx serve .` y repite una pasada rápida del checklist de la Tarea 18 (solo sobre `index.html`, ya no hay `dashboard.html` con qué comparar — verifica contra tu memoria del comportamiento ya confirmado).
Expected: mismo comportamiento que en la Tarea 18.

- [ ] **Step 4: Commit** (pedir confirmación al usuario primero, de nuevo, específicamente para este commit)

```bash
git add -A
git commit -m "Elimina dashboard.html y deploy/: reemplazados por la nueva estructura modular"
```
