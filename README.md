# PsyCase — Casos LaSalle

Simulador de guardia psiquiátrica para estudiantes de licenciatura en medicina.
PWA offline-first en HTML/CSS/JS vainilla: sin dependencias, sin build.

## Cambiar el juego sin programar

Abre **[`EDITAR_JUEGO.md`](EDITAR_JUEGO.md)**: vidas, reloj, precios, residentes,
frases, pase de visita y el título y la dificultad de cada caso. Edítalo
(también desde github.com en el móvil) y GitHub aplica el cambio solo. En
local: `npm run apply`.

## Empezar

```bash
npm run serve          # o: python3 -m http.server 8080
# abre http://localhost:8080  (no con file://: fetch y el Service Worker lo necesitan)
```

Antes de tocar nada, y antes de cada commit:

```bash
npm run hooks          # una vez por clon: regenera el mapa en cada commit
npm run check          # packs válidos + mapa al día + coherencia offline
```

## Dónde está cada cosa

| Documento | Para qué |
|---|---|
| [`EDITAR_JUEGO.md`](EDITAR_JUEGO.md) | Lo que se ajusta sin programar. Al guardarlo se regeneran `js/content.js` y los casos |
| [`docs/MAPA_APP.md`](docs/MAPA_APP.md) | Arquitectura, flujos y, abajo, un índice **autogenerado** de archivos, funciones con su línea, caché offline y estado del banco de casos |
| [`docs/GUIA_REVISION.md`](docs/GUIA_REVISION.md) | Checklist de revisión, trampas conocidas, deuda priorizada y registro de revisiones |
| [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md) | Cómo añadir casos y personajes, y cómo ajustar la economía del juego |
| [`tools/README.md`](tools/README.md) | Scripts de datos y sprites |

## Qué se publica

`index.html`, `manifest.webmanifest`, `sw.js`, `js/`, `assets/styles.css`,
`assets/icons/`, `assets/sprites/*_atlas.png`, `data/manifest_v1.json` y
`data/packs/`. El resto (`tools/`, `docs/`, `data/cases_v1.json`,
`assets/sprites_src/`) es material de trabajo.

## Datos

`data/cases_v1.json` es la fuente editable. `npm run split` genera
`data/manifest_v1.json` + `data/packs/*.json`, que es lo que carga la app.
`npm run validate:packs` comprueba que el loader podrá leerlos.

## Versionado

Cualquier cambio del runtime exige subir `CACHE_VERSION` en `sw.js`. Los
jugadores reciben la versión nueva al volver al menú: nunca a mitad de guardia.
