# Tablero de Control — VITAL Supermayorista

Sitio web estático (una sola página). Muestra el tablero de control del proyecto
(cronograma, entregables, riesgos y tareas) y permite **cargar un Excel** para
visualizar otros datos con el mismo formato.

## Contenido de esta carpeta

| Archivo | ¿Se sube? | Para qué |
|---|---|---|
| `index.html` | **Sí** | La aplicación completa. Es lo único imprescindible. |
| `staticwebapp.config.json` | Sí (solo Azure Static Web Apps) | Cabeceras y ruta por defecto. |
| `ejemplo-datos.xlsx` | Opcional | Archivo de muestra para probar el botón "Cargar Excel". |
| `README.md` | No hace falta | Esta guía. |

> El `index.html` es **autónomo**: los logos y los datos de ejemplo van embebidos.
> No usa CDNs, ni servidor, ni build. Funciona incluso abriéndolo con doble clic.

## Lo que NO se debe subir

Estos archivos están en la carpeta del proyecto (un nivel arriba) y **no deben
publicarse**:

- `MANUAL DE MARCA-03 1.pdf` — confidencial (marca VITAL).
- `Softtek-Brandkeeper-2025.pdf` — confidencial; el uso del logo Softtek requiere
  aprobación de su área Legal y de Marketing (`global.image@softtek.com`).
- `PROY-REFINANCIA-*.pbix` — fuente original de Power BI.

## Cómo desplegar en Azure

### Opción A — Azure Static Web Apps (recomendada)

Con Azure CLI (requiere [SWA CLI](https://aka.ms/swa)):

```bash
az login
swa deploy ./ --env production
```

O desde el portal: **Create → Static Web App → Deployment "Other"**, y sube el
contenido de esta carpeta. Azure da HTTPS y un dominio `*.azurestaticapps.net`
automáticamente.

### Opción B — Azure Blob Storage (sitio estático)

```bash
# 1) Activa el hosting estático en la cuenta de almacenamiento (una vez)
az storage blob service-properties update --account-name <CUENTA> \
  --static-website --index-document index.html --404-document index.html

# 2) Sube el contenido al contenedor especial $web
az storage blob upload-batch --account-name <CUENTA> \
  -d '$web' -s ./ --pattern "index.html"
```

La URL sale en el portal, en **Static website → Primary endpoint**.
`staticwebapp.config.json` no aplica aquí (es solo para Static Web Apps).

### Opción C — Azure App Service

Es más de lo necesario para un sitio estático, pero si ya tienes un App Service:
sube `index.html` a `/site/wwwroot/`.

## Notas de funcionamiento

- **"Cargar Excel" funciona en el sitio publicado.** El archivo se lee en el
  navegador del usuario; no se sube al servidor ni se comparte con nadie.
- La carga es **por sesión**: al recargar la página se vuelve a los datos de
  ejemplo. Para que todos vean datos actualizados sin cargar el Excel a mano,
  haría falta un backend (API + base de datos) — es el siguiente paso si se
  quiere convertir en una app dinámica.
- Requiere un navegador moderno (Chrome/Edge 80+, Firefox 113+, Safari 16.4+)
  por el lector de Excel integrado.
- El Excel que se cargue debe tener las hojas `Cronograma`, `Solicitudes`,
  `Riesgos` y `Entregables` con las mismas columnas del formato original.
