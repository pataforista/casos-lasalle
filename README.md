# PsyCase (PWA) — HTML/JS Vainilla + Dataset por Packs

PsyCase es una PWA offline-first que carga casos clínicos desde un `manifest` + “packs” JSON.
El objetivo es que el runtime sea ligero (móvil) y que el dataset se pueda escalar sin romper la app.

---

## 1) Estructura recomendada

```
/assets/
  /icons/
    icon-192.png
    icon-512.png

/data/
  manifest_v1.json
  /packs/
    cases_real_v1.json
    cases_synth_pack01_v1.json
    ...

/js/
  caseLoader.js
  game.js
  ui.js

/tools/
  validator.js
  buildManifest.js        (opcional si usas monolítico)
  splitPacks.js
  validateAllPacks.js

index.html
manifest.webmanifest
sw.js
README.md
```

---

## 2) Qué archivos se publican (runtime)

Publica SOLO esto:
- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `/js/*`
- `/data/manifest_v1.json`
- `/data/packs/*`
- `/assets/icons/*`

**No publiques** `/tools` (no es necesario para el juego).

---

## 3) Ejecutar local (importante: no abras con file://)

Necesitas un servidor local para que `fetch()` y el Service Worker funcionen.

### Opción A: Python
```bash
python -m http.server 8080
```

### Opción B: Node (si tienes npx)
```bash
npx serve .
```

Abre:
- `http://localhost:8080`

---

## 4) Probar PWA en Android (Chrome)

1) Abre la app una vez con internet (para precachear).
2) Menú ⋮ → “Agregar a pantalla principal”.
3) Cierra la app instalada.
4) Activa modo avión.
5) Abre la app instalada: debe cargar (offline-first).

---

## 5) Dataset: flujo de trabajo (source of truth)

Recomendación: mantener una fuente monolítica para edición y regeneración:

- `data/cases_v1.json` (opcional, recomendado como “fuente única”)

Luego generas:
- `data/manifest_v1.json`
- `data/packs/*.json`

Pipeline típico:
1) Validar fuente:
```bash
node tools/validator.js data/cases_v1.json
```

2) Generar packs + manifest:
```bash
node tools/splitPacks.js data/cases_v1.json data --packSize=25 --version=v1
```

3) Validar release completo:
```bash
node tools/validateAllPacks.js data/manifest_v1.json
```

---

## 6) Notas de versionado

Si cambias la estructura del runtime o deseas forzar recache:
- Cambia `CACHE_NAME` en `sw.js` (ej. `psycase-cache-v2`)

Si solo cambian casos:
- El SW con estrategia stale-while-revalidate actualizará los JSON con el tiempo.
