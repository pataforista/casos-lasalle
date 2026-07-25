# Herramientas

Qué usar para cada cosa, y qué contrato tiene que respetar cada salida para que
la app siga funcionando.

## Verificación rápida

Antes y después de tocar datos:

```bash
node tools/validateAllPacks.js ./data/manifest_v1.json
```

Es la única comprobación que reproduce lo que `js/caseLoader.js` exige de verdad.
Si sale `✅ VALIDATION OK`, la app puede cargar el banco de casos.

Para las hojas de sprites:

```bash
node tools/check_img.js
```

---

## Banco de casos

`data/cases_v1.json` es la fuente. De ahí salen los packs y el manifest.

| Herramienta | Para qué | Escribe |
|---|---|---|
| `splitPacks.js` | Repartir `cases_v1.json` en packs y generar el manifest desde cero | `data/packs/*.json`, `data/manifest_v1.json` |
| `buildManifest.js` | Refrescar sólo el índice cuando ya editaste un pack | `data/manifest_v1.json` |
| `validateAllPacks.js` | Validar packs + manifest | nada |
| `assign_and_validate.js` | Asignar etiquetas HiTOP/RDoC y validar estructura | archivo de salida que le pases |
| `enhanceCases.js` | Completar `explanation` (rationale, take_home, why_not) | archivo de salida que le pases |
| `fix_whynot_dedup.js` | Depurar `why_not` duplicados. Dry-run salvo `--write` | `data/cases_v1.json` |
| `add_display_titles.js` | Añadir `display_title` neutros | `data/cases_v1.json` |
| `apply_clinical_corrections.js` | Correcciones clínicas puntuales | `data/cases_v1.json` |
| `mergeCorrections.js` | Fusionar `data/casos_corregidos_usuario.json` (opcional; si no existe, no hace nada) | `data/cases_v1.json` |
| `update_cases.js` | Migración puntual con `modified_cases.json`. Dry-run salvo `--write` | pack real + manifest |

### El formato del manifest es un contrato

`js/caseLoader.js` espera que `manifest.index` sea una **lista plana, una entrada
por caso**, y que cada entrada traiga `case_id` y `pack`:

```json
{
  "packs": { "real": "packs/cases_real_v1.json", "synth": [] },
  "index": [
    { "case_id": "REAL_…", "pack": "packs/cases_real_v1.json",
      "difficulty": "facil", "educational_level": "licenciatura", "is_real_data": true }
  ]
}
```

`pickRandomCase()` filtra por `difficulty`, `educational_level` e `is_real_data`
leyendo el índice, sin abrir el pack, así que esos campos tienen que estar ahí.

Ese formato vive en **`tools/lib/manifest.js`** y nada más debería construirlo a
mano. `writeManifest()` valida antes de tocar disco y se niega a escribir algo
que el loader no sepa leer.

Esto no es teórico: el manifest estuvo escrito como un único envoltorio
`[{pack, cases:[{id,title}]}]` apuntando a un pack que no existía. `getPoolSize()`
devolvía 1, `pickRandomCase()` no encontraba ningún caso y **todas** las partidas
caían al generador sintético, con los 94 casos reales inalcanzables y sin ningún
error visible.

---

## Sprites

Las hojas son una rejilla de **5 columnas × 2 filas**, 10 poses, en este orden:

```
normal  speaking  thinking  ok         streak
worried shock     exhausted surprised  angry
```

`js/game.js` (`MOOD_FRAMES`) mapea cada ánimo a ese índice, y el CSS recorta con
`background-size: 500% 200%`.

Pipeline, en orden:

1. `assets/pixelate_and_keyout.py` — quita el croma verde y aplica el look pixel
   art. `assets/sprites_src/<nombre>.png` → `assets/sprites/<nombre>_out.png`.
2. `tools/normalize_sprites.py` — detecta la cabeza de cada pose, la centra y
   escribe celdas cuadradas. `<nombre>_out.png` → `<nombre>_atlas.png`.

**La app carga los `_atlas.png`.** Los `_out.png` se conservan porque son la
entrada del paso 2.

```bash
python3 tools/normalize_sprites.py --check   # informa desviaciones, no escribe
python3 tools/normalize_sprites.py           # regenera los atlas
```

Si añades una hoja nueva, acuérdate de sumarla al `APP_SHELL` de `sw.js`: si una
sola ruta de esa lista no existe, `cache.addAll()` rechaza entera y el service
worker no llega a instalarse, así que la app se queda sin caché offline.
