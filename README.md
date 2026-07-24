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

### Prerrequisitos

- **Node.js** v18+ ([descargar](https://nodejs.org/)) — solo se usa para levantar el
  servidor de desarrollo; no agrega `node_modules` ni dependencias al proyecto.
- Un **navegador moderno**: Chrome/Edge 80+, Firefox 113+, Safari 16.4+
  (se requiere soporte de ES Modules y `DecompressionStream`).

### Pasos

1. Clona el repositorio:

   ```bash
   git clone <url-del-repo>
   cd PMODashboard
   ```

2. Levanta el servidor estático:

   ```bash
   npm run dev
   ```

   > Si el puerto 3000 está ocupado usa: `npx serve . -p 8080`

3. Abre <http://localhost:3000> en tu navegador.

4. Usa el botón **Cargar Excel** para visualizar un `.xlsx` propio con las hojas
   `Cronograma`, `Solicitudes`, `Riesgos` y `Entregables` (mismo formato que
   `ejemplo-datos.xlsx`), o el enlace "ver el tablero con datos de ejemplo" para
   cargar datos ficticios sin necesidad de un archivo.

> **Alternativa**: usa la extensión "Live Server" de VS Code, que ofrece recarga
> automática al guardar.
>
> **⚠️ No abras `index.html` con doble clic** — los ES Modules nativos requieren un
> servidor HTTP; el protocolo `file://` es bloqueado por CORS.

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
