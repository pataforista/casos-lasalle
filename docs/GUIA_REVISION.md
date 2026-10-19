# Guía para próximas revisiones

Esta guía existe para que la siguiente revisión no empiece de cero. Lo que una
máquina puede comprobar lo comprueba sola; lo que exige criterio clínico o de
diseño queda aquí escrito, con la huella del código que se revisó por última
vez para saber cuándo esa lectura caducó.

## Qué se actualiza solo y qué no

| Pieza | Cómo se mantiene | Qué pasa si se olvida |
|---|---|---|
| Bloque automático de `docs/MAPA_APP.md` (archivos, símbolos con línea, caché offline, claves de almacenamiento, estadísticas del banco, coherencia) | `npm run map`. Con `npm run hooks` instalado, se regenera en cada commit | `npm run check` y la CI (`.github/workflows/check.yml`) fallan |
| Coherencia offline: todo lo que carga `index.html` y todo sprite que usa `game.js` debe estar en `APP_SHELL` y existir | `tools/buildAppMap.js` | El commit, `npm run check` y la CI fallan con el archivo exacto |
| Parte manual de `docs/MAPA_APP.md` (arquitectura, flujos, reglas) | A mano, cuando cambie la arquitectura | Nada falla: por eso existe la huella de abajo |
| Esta guía (checklist, trampas, deuda, registro) | A mano, al cerrar cada revisión | `npm run map` avisa ⚠️ cuando la huella del runtime ya no coincide con la anotada aquí |

**Huella revisada:** `160ec91266d3`

> La huella es un hash de los archivos del runtime (`index.html`, `sw.js`,
> `manifest.webmanifest`, `assets/styles.css`, `js/*.js`). Sale en la cabecera
> del bloque automático del mapa. Al terminar una revisión, cópiala aquí y
> añade una fila al registro.

---

## 1. Rutina de revisión

1. `npm run check`. Si falla, eso va primero.
2. Lee el bloque automático del mapa: la tabla de archivos dice qué creció, la deuda editorial dice qué empeoró.
3. Sirve la app (`npm run serve`) y juega una guardia completa en móvil (390×844) y escritorio, sin red una vez instalada.
4. Recorre la checklist de la sección 2 sólo en las áreas que tocó el cambio.
5. Cierra: actualiza la sección 4 (deuda), añade una fila al registro (sección 5) y copia la huella.

## 2. Checklist por área

### Flujo de juego (`js/game.js`)
- [ ] Todo `setTimeout` que pinta usa `later()` (respeta `state.runId`).
- [ ] Toda decisión pasa por `checkAnswer()` o `resolveTimeout()`, que fijan `state.locked`.
- [ ] Una pregunta fallada en un caso multi-pregunta marca `state.decompensated` y la guardia sigue con la siguiente.
- [ ] El botón del feedback dice la verdad (`nextLabel()`): siguiente pregunta, pase de visita, cierre de guardia o siguiente paciente.
- [ ] Modo estudio y `documento_educativo` no mueven monedas, racha ni estadísticas (`isUntimed()`).
- [ ] El repaso espaciado sólo asciende con el caso entero sin fallos (`state.caseHadError`).

### Datos (`data/`, `tools/`)
- [ ] `npm run validate:packs` en verde.
- [ ] Casos nuevos con `display_title` que **no** nombre el diagnóstico si el diagnóstico es la respuesta.
- [ ] `why_not` cubre los distractores de **cada** pregunta (el juego filtra por pregunta; lo que falte, no se muestra).
- [ ] Nada de RDoC/HiTOP en preguntas ni explicaciones (decisión de contenidos para licenciatura).

### Offline y actualización (`sw.js`, `js/boot.js`)
- [ ] Cambió algo del runtime ⇒ subió `CACHE_VERSION`.
- [ ] Archivo nuevo del runtime ⇒ está en `APP_SHELL` y en `RUNTIME_FILES` de `tools/buildAppMap.js`.
- [ ] Una actualización del SW no recarga a mitad de guardia (`PsyBoot.inShift`).

### Rendimiento y animación (`assets/styles.css`)
- [ ] Ningún `filter`, `transform` ni `will-change` sobre `<body>` o `#app`: rompen `position: fixed` de overlays y feedback.
- [ ] Animaciones en bucle sólo con `transform`/`opacity`.
- [ ] Toda animación nueva respeta `@media (prefers-reduced-motion: reduce)`.
- [ ] No hay dos reglas con el mismo selector y `animation:` abreviado peleándose (la última gana y pisa `animation-name`).

### Accesibilidad y móvil
- [ ] Objetivos táctiles ≥ 44 px; sin desbordamiento horizontal en 320 px.
- [ ] Texto secundario con contraste AA (evitar alfa < 0.55 sobre el fondo oscuro).
- [ ] El feedback se anuncia (`role="status"`) y el foco va al botón principal.

### Seguridad
- [ ] Todo texto del dataset pasa por `escapeHtml()` antes de `innerHTML`.
- [ ] Sin `<script>` en línea ni `onclick=` en plantillas: la CSP es `script-src 'self'`.

## 3. Trampas ya pisadas (no repetir)

| Síntoma | Causa | Dónde quedó resuelto |
|---|---|---|
| Panel de feedback "saltaba" o se iba al fondo en los últimos segundos | `filter` animado sobre `<body>` crea un bloque contenedor para `position: fixed` | `.urgency-fx` + `setUrgency()` |
| "Desvanecer" el menú lo hacía reaparecer | Segunda regla `.screen-transition { animation: … }` pisaba `.fade-out` | Bloque único de transiciones al inicio de `styles.css` |
| Sin red en la primera visita, el banco real no volvía nunca | `CaseDB.init()` cacheaba la promesa rechazada | `initPromise.catch(() => initPromise = null)` |
| La app se recargaba sola en la primera visita | `clients.claim()` dispara `controllerchange` también sin controlador previo | `hadController` en `js/boot.js` |
| Enter dos veces saltaba una pregunta | El avance no era idempotente | Guardia `done` en `bindFeedbackControls()` |
| Monedas perdidas comprando pista con el feedback abierto | Ayudas activas tras decidir | `state.locked` |
| Tiempo agotado se saltaba las preguntas restantes del caso y no contaba al paciente | `showTimeoutFeedback()` llamaba a `nextCase()` directo | `resolveTimeout()` → `advanceNext()` |
| "¿Por qué no?" explicaba opciones de otra pregunta | `why_not` del caso mezcla las de todas sus preguntas | `getWhyNotForTask()` |
| Un caso fallado en la pregunta 1 y acertado en la 2 salía del repaso hoy mismo | Ascenso por pregunta, no por caso | `state.caseHadError` |
| "Basado en el texto…" con la historia clínica plegada | `<details>` siempre cerrado | `refersToText` en `renderCase()` |
| `cache.addAll()` fallaba entera por una ruta con otro nombre | Lista de `APP_SHELL` escrita a mano | Comprobación de coherencia en `npm run check` |

## 4. Deuda conocida (priorizada)

| # | Qué | Por qué importa | Esfuerzo |
|---|---|---|---|
| 1 | Títulos que nombran el diagnóstico-respuesta (p. ej. "SNM: Clínica y Manejo", "Delirium: Fisiopatología…"). El mapa cuenta los casos sin `display_title`, pero varios `display_title` también son spoilers | Regalan la respuesta en un juego de razonamiento | Editorial, medio |
| 2 | Ninguna pregunta tiene `rationale` propio: la pregunta 2 de un caso usa el del caso, que explica la 1 | Feedback impreciso en 17 casos multi-pregunta | Editorial, medio |
| 3 | Distribución de dificultad: 1 solo caso "difícil" | Ese filtro repite el mismo paciente (el menú ya lo avisa con el conteo) | Editorial |
| 4 | Economía: pocas salidas para las monedas; el rango sube sólo con XP acumulado | Las monedas pierden valor tras unas guardias | Diseño, medio |
| 5 | `js/game.js` supera las 2 000 líneas | Revisar y probar cuesta cada vez más; candidatos a módulo: repaso espaciado, feedback, HUD | Medio |
| 6 | Los modales no atrapan el foco ni cierran con Esc | Accesibilidad con teclado | Bajo |
| 7 | `assets/sprites/*_out.png` (entrada de `normalize_sprites.py`) se publican sin que el runtime los use | Peso de despliegue, no de carga (no están en la caché) | Bajo |
| 8 | `case_type: "documento_educativo"` soportado pero sin contenido | Código sin uso real | Decidir |

## 5. Registro de revisiones

| Fecha | Huella | Alcance | Resultado |
|---|---|---|---|
| 2026-07-10 | — | Diagnóstico inicial (`docs/REVISION_DIAGNOSTICA_2026-07.md`) | B1–B7 corregidos |
| 2026-10-19 | `160ec91266d3` | Revisión completa: flujo de turno, repaso, SW, animaciones, limpieza de código y repo, creación de este sistema de mapas | Ver sección 3 y commit de la revisión |
