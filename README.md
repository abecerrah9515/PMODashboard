# PMO Dashboard — Tablero de Control

Tablero de control de proyecto (cronograma, entregables, riesgos y tareas) en una
sola página web autónoma. Permite **cargar un archivo Excel** para visualizar otros
datos con el mismo formato, sin servidor ni dependencias externas.

## Archivo principal

- **`dashboard.html`** — la aplicación completa. Logos y datos de ejemplo van
  embebidos; no usa CDNs ni build. Se puede abrir con doble clic o publicar como
  sitio estático (Azure Static Web Apps, Blob Storage, etc.).

## Uso

Abre `dashboard.html` en un navegador moderno (Chrome/Edge 80+, Firefox 113+,
Safari 16.4+). Usa el botón **Cargar Excel** para visualizar un `.xlsx` propio con
las hojas `Cronograma`, `Solicitudes`, `Riesgos` y `Entregables`.

## Nota de marca

La aplicación usa la identidad de VITAL Supermayorista y la atribución
"Powered by Softtek". El uso del logo de Softtek requiere aprobación de su área
Legal y de Marketing (`global.image@softtek.com`) antes de salir a producción.
Los manuales de marca **no** se versionan en este repositorio.
