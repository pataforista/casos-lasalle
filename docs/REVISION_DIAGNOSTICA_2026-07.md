# Revisión diagnóstica — PsyCase (julio 2026)

Alcance: código (runtime JS, SW, HTML/CSS), datos (`manifest_v1.json` + `cases_real_v1.json`, 94 casos), jugabilidad y estética. La app se ejecutó en navegador headless (móvil 390×844 y escritorio 1280×800) recorriendo menú → caso → feedback → game over → filtros, incluyendo un escenario sin acceso a CDNs.

---

## 1. Resumen ejecutivo

La base es sólida: runtime vainilla ligero y legible, escape XSS consistente, CSP declarada, loader de packs con validación de rutas, economía persistente y repaso espaciado. La estética synthwave es coherente y se ve bien en móvil.

Los problemas más importantes no son de estilo sino de **flujo de juego y datos**:

1. Un fallo de filtros hace que la app **cambie silenciosa y permanentemente** a casos sintéticos del generador, sin avisar al usuario.
2. El **repaso espaciado ignora al 62 % del banco** (solo guarda casos con prefijo `REAL_`; los `EDU_`, `CLIN_` y `HOSP_` fallados se pierden).
3. El soporte offline de CDNs **no funciona** (las respuestas opacas nunca se cachean), y como el layout de escritorio depende de Tailwind CDN, sin red la app pierde su contenedor y se estira a todo el ancho.
4. ~15+ títulos de casos **revelan el diagnóstico que es la respuesta** ("Bulimia Nerviosa: ciclo atracón-compensación" → pregunta cuya respuesta es bulimia).

---

## 2. Bugs de código

### P1 — Afectan la experiencia de forma visible

**B1. Fallback al generador es silencioso y permanente** (`js/game.js:898-907`)
Cuando `pickRandomCase` lanza error (pool vacío), `state.useGenerator = true` y nunca se restablece: `ensureCasesLoaded` retorna temprano porque `casesReady` sigue en `true`. Desde ese momento **todas** las guardias de la sesión usan casos sintéticos, incluso sin filtros. Se reproduce fácil:
- Filtro `residencia + fácil` → 0 casos en el manifest → generador (verificado: apareció "Trastorno Esquizoafectivo", que es un módulo del generador, con badge "Caso 1" y sin ningún aviso).
- Pools pequeños se agotan solos: `licenciatura + difícil` tiene 3 casos y `recentCases` excluye los últimos 30, así que a la cuarta pregunta el pool queda vacío → generador para siempre.

*Fix sugerido:* no persistir `useGenerator` tras un fallo de filtros; si el pool se agota, vaciar `excludeCaseIds` y repetir casos (o avisar "pool agotado, repitiendo casos"); mostrar un badge "Caso sintético" cuando el origen sea el generador.

**B2. El repaso espaciado solo guarda casos `REAL_`** (`js/game.js:247`)
`saveFailedCase` hace `if (!caseId.startsWith("REAL_")) return;`. El banco tiene 36 `REAL_`, 18 `EDU_`, 20 `CLIN_`, 20 `HOSP_` — todos reales (`is_real_data: true`), pero el 62 % de los errores nunca entra al repaso. El filtro correcto sería excluir solo los `MODULAR_` del generador.

**B3. El SW nunca cachea los CDNs → el "soporte offline real" de fuentes/Tailwind no existe** (`sw.js:54,64`)
Los `fetch` de recursos cross-origin sin CORS (script de Tailwind, CSS de Google Fonts) devuelven respuestas *opacas* con `res.ok === false`, así que `if (res.ok) cache.put(...)` no las guarda jamás. Offline: sin fuentes Chakra Petch/Inter y sin Tailwind. Consecuencia mayor: el contenedor `max-w-2xl mx-auto` de `index.html` es clase Tailwind — sin el CDN, en escritorio el juego se estira a 1280 px (verificado con captura). *Fix:* eliminar la dependencia de Tailwind (ver B4) y auto-hospedar las fuentes, o cachear respuestas opacas deliberadamente.

**B4. Tailwind CDN completo para ~10 clases de utilidad**
Se carga el compilador JIT de Tailwind (~300 KB de JS que exige `'unsafe-eval'` en la CSP, como admite el propio comentario en `index.html:7`) para usar `max-w-2xl mx-auto p-4 min-h-screen flex flex-col justify-center`, `text-center opacity-80 font-bold` y `text-pink-400`. Reemplazarlas por ~12 líneas en `styles.css` permite: quitar `unsafe-eval` y el dominio del CDN de la CSP, arreglar el offline de escritorio (B3) y acelerar la primera carga.

**B5. Los filtros se pierden al reiniciar desde Game Over** (`js/game.js:551-554`)
"Nueva Guardia" llama `startTurn(false, false)` cuando los `<select>` ya no existen en el DOM, y `selectLevel ? selectLevel.value : ""` restablece los filtros a "todos". El jugador que eligió "licenciatura + media" los pierde sin saberlo. *Fix:* leer los selects solo si existen; si no, conservar `state.filters`.

### P2 — Inconsistencias de flujo

**B6. Al fallar la última vida no hay retroalimentación.** `checkAnswer` con `lives <= 0` va directo a `handleDeath` (`js/game.js:1101`): el jugador nunca ve por qué falló el caso que lo mató — justo el que más valor didáctico tiene. Mostrar el feedback y luego el Game Over.

**B7. Una respuesta incorrecta no revela cuál era la correcta.** En timeout sí se ilumina la opción correcta (`js/game.js:850-852`), pero al responder mal solo se marca en rojo la elegida; el overlay de feedback explica el porqué del error sin decir la respuesta correcta (hay que deducirla de "Ver explicación"). Marcar también `.correct` en `checkAnswer` cuando `ok === false`.

**B8. El timeout ignora las preferencias y las tareas restantes.** `showTimeoutFeedback` siempre auto-avanza a los 3.5 s aunque el usuario haya puesto "⏸️ Manual", no tiene botón "Siguiente", y salta con `nextCase()` directamente, descartando las tareas restantes de un caso multi-tarea (una respuesta incorrecta, en cambio, continúa con la siguiente tarea "descompensada"). Además no incrementa `solvedCasesCount`, así que el badge "Caso N" repite número.

**B9. Narrativa de descompensación desincronizada.** Tras fallar la tarea 1, la tarea 2 se prefija con "🚨 ¡El paciente se ha descompensado…! Realiza una maniobra de rescate" (`js/game.js:696`), pero la pregunta mostrada es la tarea 2 normal del caso (p. ej. teoría de criterios DSM), no una maniobra de rescate. El texto promete un branching que no existe.

### P3 — Menores

- `js/game.js:139`: `state.timeLeft = GAME_CONFIG.turnSeconds` — esa clave no existe (`baseTurnSeconds`); inofensivo porque `startTimer` lo sobrescribe, pero es un typo latente.
- `js/game.js:751`: barajado con `sort(() => Math.random() - 0.5)` está sesgado (la opción correcta no queda uniformemente distribuida entre las 4 posiciones). Usar Fisher–Yates.
- ECG (`js/game.js:766`): el `path` mide más de 100 unidades y `stroke-dasharray: 100` produce segmentos partidos — en las capturas se ve como guiones sueltos, no como trazo ECG. Añadir `pathLength="100"` al `<path>` lo arregla en una línea.
- Consola: 404 de `favicon.ico` (no hay `<link rel="icon">`).
- `assets/icons/` tiene duplicados: `icon-192.png`/`icon_192.png` y `icon-512.png`/`icon_512.png`; manifest y SW solo usan los de guion. Borrar los de guion bajo.
- Game Over: "Repasar Errores (1 **listos** / 1 total)" — concordancia singular/plural.
- `Economy.save()` no envuelve `localStorage.setItem` en try/catch (Safari privado / cuota llena rompería la partida).
- README desactualizado: menciona `js/ui.js` y `tools/validator.js` que no existen; `data/cases_v1.json` y `casos_corregidos_usuario.json` (~300 KB) se publican sin que el runtime los use.

---

## 3. Datos y contenido (94 casos)

**Integridad estructural: bien.** Manifest ↔ pack sincronizados (94/94), 0 tareas sin distractores, 0 respuestas duplicadas dentro de las opciones, siempre 3 distractores, todos los casos con `explanation`.

Problemas encontrados:

1. **Títulos que regalan la respuesta (≥15 casos, conteo conservador por keyword).** Ej.: `HOSP_004_MANIA_CRITERIOS` ("Episodio Maníaco: Criterios DSM-5"), `EDU_05_TEPT`, `CLIN_002_FOBIA_SOCIAL`. En un juego de razonamiento diagnóstico el título no debería nombrar el diagnóstico cuando este es la respuesta esperada. Añadir un campo `display_title` neutro ("Mujer de 22 años con conducta alimentaria de riesgo") — el código ya lo soporta (`getCaseTitle` lo prefiere).
2. **Distribución muy desbalanceada frente al UI de filtros.** El selector ofrece 3 niveles × 3 dificultades, pero los datos solo cubren: licenciatura fácil 25, licenciatura media 50, licenciatura difícil 3, residencia difícil 10, especialidad media 5, especialidad difícil 1. Cuatro combinaciones (residencia fácil/media, especialidad fácil…) dan pool vacío → disparan B1. O se poblan esas celdas o el UI debería deshabilitar/mostrar el conteo por combinación (`CaseDB.getPoolSize` ya existe y nadie lo usa).
3. **`why_not` no cubre la segunda tarea en los 24 casos multi-tarea.** Los `why_not` a nivel de caso corresponden a los distractores de la tarea 1; al fallar la tarea 2 el jugador recibe el rationale genérico. Además las 118 tareas del pack carecen de `rationale` propio.
4. **Viñetas demasiado cortas:** `EDU_20_TALLER` (79 caracteres) y otro caso <100. Para "decidir bajo presión" falta contexto mínimo.
5. **"Lectura rápida" muestra teoría antes de la pregunta.** En casos tipo `EDU`/`HOSP` el `source_chunk` es un párrafo de libro de texto ("La bulimia nerviosa se caracteriza por…") que aparece encima de la viñeta-pregunta y suele contener la respuesta. Funciona para Modo Estudio, pero en guardia contrarreloj contradice la premisa del juego. Valdría separar `content_kind: theory` vs `vignette` y en modo guardia mostrar solo la viñeta.
6. Algunos `why_not` suenan a texto generado sin editar, largos y circulares (ej. en `HOSP_013`: "…no es correcta en esta presentación clínica, ya que los hallazgos descritos, la evolución temporal y los criterios de exclusión sustentan el diagnóstico y manejo prioritario de '…'" — no explica nada clínico). Una pasada editorial sobre los `why_not` de los packs `CLIN_`/`HOSP_` elevaría mucho la calidad del feedback.
7. `case_type: "documento_educativo"` tiene soporte completo en el código (sin timer, ECG plano, "Lectura Libre") pero **ningún caso lo usa** — código muerto o contenido pendiente; decidir cuál.

---

## 4. Jugabilidad

**Lo que funciona:** el loop central (leer → decidir → feedback breve → "Ver explicación") es bueno y rápido; el timer basado en `Date.now()` no acumula deriva; los atajos 1-4 existen; el auto-avance es configurable; el repaso espaciado con 3 niveles de maestría (0→24h→72h→borrado) es una mecánica seria de estudio, bien pensada.

**Fricciones:**

- **HUD demasiado alto en móvil (~430 px):** avatares, corazones, monedas, combo, 4 botones y "MEJOR" empujan la pregunta y las opciones bajo el fold — hay que hacer scroll mientras corre el tiempo. Compactar a una fila (corazones + timer + monedas) y mover sonido/auto/home a un menú.
- **Economía sin fricción:** empiezas con 150 🪙, cada acierto da 25+, y el único gasto es la pista (50, máx. 1/turno). A los pocos minutos las monedas son decorativas y el logro "Magnate" (500) cae solo. Faltan sumideros: comprar vida, congelar tiempo, x2 de racha, cosméticos del avatar.
- **La pista es débil para su precio:** elimina 1 distractor aleatorio de 3 (a veces el que ya habías descartado). Alternativa: eliminar 2, o mostrar el `take_home` como "consulta al adscrito" (encaja con la narrativa).
- **Curva de dificultad razonable** (45 s → −log2 con la racha, piso 15 s), pero invisible: el jugador no sabe que su racha acorta el reloj. Un aviso "⚡ racha 4: 35 s" haría legible la presión.
- **Rango (R1→LEYENDA) sube solo con XP acumulado** (50/acierto): es un contador de tiempo jugado, no de destreza. Ligarlo a maestría del repaso o a rachas le daría significado.
- Los dos residentes ("Aguilar"/"Solis") alternan mecánicamente y las frases de `NARRATIVE.residents` nunca se muestran en el juego — narrativa declarada pero no cableada.

---

## 5. Estética y UX

**Lo que funciona:** identidad Miami Vice/synthwave consistente (grid morado, glassmorphism, neones cian/rosa); los avatares SVG kawaii con humor (residente feliz/shock, jefe enojado) comunican estado sin texto; feedback verde/rojo/ámbar claro; `safe-area-inset-bottom` contemplado; los targets táctiles ≥54 px.

**Mejorables:**

1. **Rendimiento de animaciones:** `hot-zone-active` anima `filter: contrast/saturate/sepia` sobre `<body>` y `time-critical` anima `background-color` + `box-shadow` inset también sobre `<body>` — repintados de página completa a 60 fps en el peor momento (últimos segundos con el usuario decidiendo). En gama baja produce jank. Limitar el efecto a un overlay `position:fixed` con `opacity` (compositable).
2. **Sin `prefers-reduced-motion`:** scanline, shake, red-flash, ECG, bounce… ninguna animación se desactiva. Para una app médica con usuarios potencialmente fotosensibles, el flash rojo de pantalla completa a 1 Hz merece un respeto de `@media (prefers-reduced-motion: reduce)`.
3. **Contrastes bajos:** "ATAJOS: 1-4" a `rgba(255,255,255,0.3)` y la etiqueta del timer a 10 px no pasan WCAG AA; los textos secundarios a 0.6-0.7 de alfa sobre glass oscuro quedan al límite.
4. **Accesibilidad estructural:** no hay `<h1>`/landmarks (todo `div`), el overlay de feedback no usa `role="status"`/`aria-live` (lectores de pantalla no anuncian acierto/error), los modales no atrapan el foco ni cierran con Esc, y el estado del ECG (taqui/brady) es solo color/velocidad.
5. **Detalles visuales:** el ECG roto (ver P3) es lo único que se ve "glitch" en un HUD por lo demás pulido; el título del caso en cian compite con "Lectura rápida" también cian — jerarquía mejorable; en Game Over el emoji 💀 + "El servicio ha colapsado" culpa al jugador sin resumen de qué falló (un mini-listado de los casos fallados con su take-home convertiría la muerte en aprendizaje).

---

## 6. Priorización sugerida

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | B1: fallback del generador visible y no permanente + usar `getPoolSize` para deshabilitar combos vacíos en el menú | Bajo | Alto — hoy el jugador puede pasar la sesión entera sin tocar el banco real |
| 2 | B2: repaso espaciado para todos los casos reales (excluir solo `MODULAR_`) | Trivial | Alto — activa el 62 % del banco |
| 3 | B4+B3: quitar Tailwind CDN (12 líneas de CSS), endurecer CSP, auto-hospedar fuentes | Bajo | Alto — offline real y escritorio estable |
| 4 | B6+B7: revelar respuesta correcta al fallar y feedback antes del Game Over | Bajo | Alto — es el momento de máximo aprendizaje |
| 5 | `display_title` neutros para los ~15 títulos-spoiler | Medio (editorial) | Alto para el valor didáctico |
| 6 | Compactar HUD móvil | Medio | Medio |
| 7 | Sumideros de economía + curva de dificultad visible | Medio | Medio |
| 8 | `prefers-reduced-motion` + contraste + `aria-live` | Bajo | Medio |
| 9 | P3 varios (ECG `pathLength`, favicon, plural, íconos duplicados, README) | Trivial | Bajo |
