# Herramientas

Esta carpeta contiene los scripts utilizados para procesar datos e imágenes.

> **¡Atención!** La guía completa y definitiva del proyecto, incluyendo los diagramas de arquitectura y el paso a paso detallado, se encuentra en **`DEVELOPER_GUIDE.md`** en la raíz del proyecto. Consulta esa guía primero.

---

## Verificación Rápida

Antes y después de tocar datos:

```bash
npm run validate:packs
# o bien
node tools/validateAllPacks.js ./data/manifest_v1.json
```

Es la única comprobación que reproduce lo que `js/caseLoader.js` exige de verdad.
Si sale `✅ VALIDATION OK`, la app puede cargar el banco de casos.

Para las hojas de sprites:

```bash
node tools/check_img.js
```

---

## Scripts Disponibles

A continuación un resumen de los scripts que aún forman parte del pipeline oficial:

| Script | Función | Uso (si está en package.json) |
|--------|---------|-----|
| `enhanceCases.js` | Auto-completa explicaciones vacías (LLM) | `npm run enhance` |
| `validate_cases.js` | Valida la estructura de casos clínicos | `npm run validate` |
| `splitPacks.js` | Genera packs distribuidos y el manifiesto | `npm run split` |
| `validateAllPacks.js`| Valida los packs de salida generados | `npm run validate:packs` |
| `pixelate_and_keyout.py` | Procesa sprites (fondo verde + pixelado) | `python tools/pixelate_and_keyout.py` |
| `normalize_sprites.py` | Genera atlas finales de sprites (5x2) | `python tools/normalize_sprites.py` |
| `check_img.js` | Chequeo rápido de completitud de sprites | `node tools/check_img.js` |
| `buildManifest.js` | Refresca sólo el índice sin recrear los packs| `node tools/buildManifest.js` |

> **Nota:** Todos los scripts de migración o correcciones de un solo uso que existían anteriormente (`add_display_titles.js`, `mergeCorrections.js`, `apply_clinical_corrections.js`, etc.) han sido eliminados del repositorio para mantener el pipeline limpio y seguro.
