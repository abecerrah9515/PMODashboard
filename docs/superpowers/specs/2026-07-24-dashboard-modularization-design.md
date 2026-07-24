# Modularización del Tablero de Control — Diseño

**Fecha:** 2026-07-24
**Estado:** Aprobado por el usuario, pendiente de plan de implementación

## Contexto

`dashboard.html` es hoy un único archivo (~1650 líneas, ~99 KB) que mezcla CSS, HTML y JS (lector de XLSX, modelo de datos y render) en un solo bloque. Funciona bien como "una sola página sin build", pero dificulta el mantenimiento: cualquier cambio exige navegar todo el archivo, y el repo mantiene una copia duplicada manual en `deploy/index.html` que hay que sincronizar a mano con `dashboard.html`.

## Objetivo

Reestructurar el proyecto en archivos separados por responsabilidad única (CSS, HTML, JS por módulo), **sin build, sin dependencias externas, sin CDNs** — manteniendo la filosofía actual — y **sin ningún cambio funcional**: el tablero debe verse y comportarse exactamente igual que hoy. Es un refactor puro de estructura para mejorar mantenibilidad; no se agregan ni quitan features.

## Restricciones no negociables

- Cero paso de build (no bundler, no transpiler, no `node_modules` en producción).
- Cero dependencias externas / CDN.
- Compatibilidad con Chrome/Edge 80+, Firefox 113+, Safari 16.4+ (ya se apoya en `DecompressionStream`, que exige este mínimo; ES Modules nativos son compatibles con ese mismo rango).
- Publicación destino: **Azure Static Web Apps** (confirmado por el usuario). No se necesita `server.js`: SWA sirve archivos estáticos directamente.
- Paridad funcional total: mismos datos de ejemplo, mismos mensajes de error/advertencia, mismo comportamiento de filtros, tema claro/oscuro, carga de Excel, etc.
- Sin pruebas automatizadas en esta ronda (decisión explícita del usuario). La estructura debe quedar preparada para agregarlas después (funciones puras exportadas via ES Modules, importables directamente con `node --test`).

## Decisiones de arquitectura

| Decisión | Elegido | Alternativas descartadas |
|---|---|---|
| Módulos JS | ES Modules nativos (`import`/`export`, `<script type="module">`) | Scripts clásicos + namespace global (acoplamiento implícito por orden de carga); bundler tipo Vite/esbuild (rompe "cero build") |
| CSS | Archivos `.css` externos enlazados con `<link>` | Dejarlo embebido en el HTML |
| Servidor | Ninguno | `server.js` con Express (solo aplica a Azure App Service, no a Static Web Apps) |
| Testing | Ninguno en esta ronda | Suite con `node --test` |
| `deploy/` | Se elimina la duplicación manual; `staticwebapp.config.json` pasa a la raíz | Mantener dos copias sincronizadas a mano |

## Estructura de carpetas y archivos

```
/
├── index.html                    ← shell delgado: markup + <link rel="stylesheet"> + <script type="module" src="js/main.js">
├── README.md                     ← documenta la estructura completa y la responsabilidad de cada archivo
├── staticwebapp.config.json      ← movido a la raíz (antes solo en deploy/)
├── assets/
│   ├── vital-logo.svg            ← logo VITAL extraído del HTML (antes inline, ~300 líneas de <path>)
│   └── softtek-logo.svg          ← logo Softtek extraído del HTML
├── css/
│   ├── theme.css                 ← variables :root (paleta VITAL, tema claro/oscuro, --good/--warn/--crit, sombras)
│   ├── shell.css                 ← brandbar, titlebar, botones de header, barra de filtros, srcbar, loadmsg, estado vacío, footer, media queries de layout general
│   └── dashboard.css             ← kpis, cronograma, gantt, entregables, matriz de riesgos, donut de tareas
└── js/
    ├── main.js                   ← único punto de entrada: importa todo, engancha eventos del DOM, arranca la app
    ├── util/
    │   ├── dom.js                 ← `$`, `esc`, `empty` — helpers de acceso/escape del DOM, sin conocer el dominio
    │   └── dates.js               ← `MES`, `fmtD`, `U`, `ymdOf`, `corto`, `serialToYMD` — utilidades de fecha, sin estado
    ├── xlsx/
    │   ├── unzip.js               ← `unzip`, `inflateRaw` — parseo de la estructura ZIP y descompresión; no sabe nada de Excel/dominio
    │   └── xlsx-reader.js         ← `readXlsx`, `parseShared`, `parseStyles`, `parseSheet`, `cellVal`, `colIdx`, `xml` — de bytes de .xlsx a filas crudas por hoja
    ├── model/
    │   ├── normalize.js           ← `norm`, `txt`, `num`, `ymd`, `estKey`, `impKey`, `splitSub` — normalización de texto/fechas/estados en español
    │   ├── build-model.js         ← `buildModel` — de filas crudas (Cronograma/Entregables/Riesgos/Solicitudes) al modelo del dominio `{fases, del, risks, sol}`, con validación de columnas obligatorias
    │   └── default-data.js        ← `DEFAULT_DATA` — datos de ejemplo (ficticios/anonimizados, igual que hoy)
    ├── state.js                   ← estado global (`DATA`, filtros `fase`/`estado`), predicados `faseOk`/`estadoOk`, `setData`, `applyView`
    └── render/
        ├── index.js                ← orquestador: aplica filtros de `state`, calcula la línea de tiempo (timeline), delega a cada sección, actualiza meta/header/footer/srcbar
        ├── kpis.js                 ← tarjetas KPI (avance general, entregables, riesgos, tareas)
        ├── cronograma.js           ← tabla de fases con barra real vs. meta
        ├── gantt.js                ← línea de tiempo / diagrama de Gantt
        ├── entregables.js          ← lista de entregables agrupada por hito
        ├── riesgos.js               ← matriz impacto × probabilidad + detalle de riesgos
        └── tareas.js                ← donut + detalle de tareas/solicitudes
```

`deploy/` deja de contener una copia duplicada del HTML: el `app location` de Azure Static Web Apps apunta directamente a la raíz del repo (que ya es autocontenida: `index.html` + `css/` + `js/` + `assets/` + `staticwebapp.config.json`). `deploy/README.md` se conserva o se fusiona al README raíz con las instrucciones de publicación, actualizadas a la nueva estructura.

## Responsabilidad de cada módulo (resumen para el README)

- **`xlsx/`** — solo sabe leer bytes de un `.xlsx` y devolver filas crudas por hoja. No conoce el dominio (fases, riesgos, etc.).
- **`model/`** — solo sabe transformar filas crudas en el modelo del dominio: mapeo de columnas por alias, validación de columnas obligatorias, normalización de estados/impactos. No toca el DOM.
- **`state.js`** — solo sabe cuál es el dato activo y qué filtros están activos. No sabe renderizar.
- **`render/*.js`** — cada archivo pinta **una** sección a partir de datos ya filtrados que recibe por parámetro; no leen `state` ni `DATA` directamente.
- **`render/index.js`** — el único que conoce el "todo": aplica filtros, calcula la línea de tiempo compartida, delega el pintado sección por sección.
- **`main.js`** — el único que engancha eventos del DOM y orquesta el flujo completo.

## Flujo de datos (sin cambios de comportamiento)

1. `main.js` engancha `change` en el file input.
2. `xlsx-reader.readXlsx(file)` → filas crudas por hoja (o rechaza la promesa con `Error` en español, igual que hoy).
3. `build-model.buildModel(sheets, filename)` → `{data, warns, errs}`.
4. Si `errs.length`: se muestra el mensaje de error y **se conserva el dato anterior** (idéntico al comportamiento actual).
5. Si no: `state.setData(data, warns)` → dispara `render/index.js` → cada sección se repinta con los datos filtrados vigentes.
6. Clics en chips de filtro / "Limpiar filtros" / "Quitar datos" → actualizan `state` → vuelven a llamar a `render()`.
7. Toggle de tema → alterna `data-theme` en `<html>` directamente, sin pasar por `state`/`render` (igual que hoy).

## Mejora puntual incluida (no es una feature nueva, es limpieza de estructura)

El botón "Quitar datos" (`clearBtn`) hoy se re-engancha con `addEventListener` dentro de `render()` en cada repintado. Se cambia a delegación de eventos en `main.js` sobre `#srcbar`, consistente con cómo ya se manejan los chips de filtro (`#f-fase`, `#f-estado`). Es un cambio de implementación interna, no de comportamiento observable.

## Documentación (README)

El `README.md` raíz se actualiza para incluir:
- El árbol de carpetas completo (como el de arriba).
- Una tabla o lista con la responsabilidad de cada archivo/carpeta.
- Instrucciones de uso sin cambios (abrir `index.html`, cargar Excel).
- Instrucciones de publicación actualizadas (SWA apunta a la raíz, sin `deploy/` duplicado).

## Errores y validación

Sin cambios respecto al comportamiento actual: mismos mensajes de error en español (`"Falta la hoja..."`, `"Formato no soportado"`, `"Navegador no compatible"`, etc.), mismas advertencias (`warns`) por columnas no reconocidas o valores no mapeados.

## Fuera de alcance (explícitamente, para esta ronda)

- Pruebas automatizadas.
- `server.js` / cualquier runtime Node en producción.
- Cambios visuales, de UX o de datos.
- Bundler o paso de build.
- División adicional del CSS más allá de los 3 archivos propuestos.
