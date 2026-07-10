# Revisión diagnóstica — PsyCase (julio 2026)

> **Actualización 2026-07-10:** los hallazgos urgentes (B1–B7 y los triviales de P3, salvo el README) fueron **corregidos en esta rama** y verificados en navegador. Quedan pendientes como trabajo editorial/diseño: B8, B9, títulos-spoiler, distribución de datos, HUD móvil, economía y accesibilidad. Cada ítem indica su estado.

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

**B1. ✅ CORREGIDO — Fallback al generador es silencioso y permanente** (`js/game.js:898-907`)
Cuando `pickRandomCase` lanza error (pool vacío), `state.useGenerator = true` y nunca se restablece: `ensureCasesLoaded` retorna temprano porque `casesReady` sigue en `true`. Desde ese momento **todas** las guardias de la sesión usan casos sintéticos, incluso sin filtros. Se reproduce fácil:
- Filtro `residencia + fácil` → 0 casos en el manifest → generador (verificado: apareció "Trastorno Esquizoafectivo", que es un módulo del generador, con badge "Caso 1" y sin ningún aviso).
- Pools pequeños se agotan solos: `licenciatura + difícil` tiene 3 casos y `recentCases` excluye los últimos 30, así que a la cuarta pregunta el pool queda vacío → generador para siempre.

*Corrección aplicada:* al agotarse el pool se reintenta sin exclusiones (repite casos) antes de generar; el generador se usa solo para ese turno sin persistir `useGenerator`; el badge muestra "· Sintético"; y el menú ahora usa `CaseDB.getPoolSize` para mostrar cuántos casos reales cubre la combinación de filtros (con advertencia cuando es cero).

**B2. ✅ CORREGIDO — El repaso espaciado solo guarda casos `REAL_`** (`js/game.js:247`)
`saveFailedCase` hacía `if (!caseId.startsWith("REAL_")) return;`. El banco tiene 36 `REAL_`, 18 `EDU_`, 20 `CLIN_`, 20 `HOSP_` — todos reales (`is_real_data: true`), pero el 62 % de los errores nunca entraba al repaso. Ahora se excluyen solo los `MODULAR_` del generador.

**B3. ✅ CORREGIDO — El SW nunca cachea los CDNs → el "soporte offline real" de fuentes/Tailwind no existe** (`sw.js:54,64`)
Los `fetch` de recursos cross-origin sin CORS (script de Tailwind, CSS de Google Fonts) devuelven respuestas *opacas* con `res.ok === false`, así que `if (res.ok) cache.put(...)` no las guardaba jamás. Offline: sin fuentes Chakra Petch/Inter y sin Tailwind. Consecuencia mayor: el contenedor `max-w-2xl mx-auto` de `index.html` era clase Tailwind — sin el CDN, en escritorio el juego se estiraba a 1280 px (verificado con captura). *Corrección aplicada:* el SW ahora acepta respuestas opacas para el whitelist de fuentes (`isCacheable`), Tailwind se eliminó por completo (ver B4) y se subió `CACHE_VERSION` a v1.1.0.

**B4. ✅ CORREGIDO — Tailwind CDN completo para ~10 clases de utilidad**
Se cargaba el compilador JIT de Tailwind (~300 KB de JS que exigía `'unsafe-eval'` en la CSP) para usar `max-w-2xl mx-auto p-4 min-h-screen flex flex-col justify-center`, `text-center opacity-80 font-bold` y `text-pink-400`. Se reemplazaron por la regla `#app` en `styles.css` y estilos inline puntuales; la CSP ya no incluye `unsafe-eval` ni `cdn.tailwindcss.com`. Verificado: en 1280 px el contenedor queda centrado a 672 px sin red externa.

**B5. ✅ CORREGIDO — Los filtros se pierden al reiniciar desde Game Over** (`js/game.js:551-554`)
"Nueva Guardia" llama `startTurn(false, false)` cuando los `<select>` ya no existen en el DOM, y `selectLevel ? selectLevel.value : ""` restablecía los filtros a "todos". Ahora los selects se leen solo si existen y, al volver al menú, reflejan los filtros vigentes.

### P2 — Inconsistencias de flujo

**B6. ✅ CORREGIDO — Al fallar la última vida no hay retroalimentación.** `checkAnswer` con `lives <= 0` iba directo a `handleDeath` (`js/game.js:1101`): el jugador nunca veía por qué falló el caso que lo mató — justo el que más valor didáctico tiene. Ahora el feedback se muestra siempre y el Game Over aparece al avanzar (también en el timeout de la última vida).

**B7. ✅ CORREGIDO — Una respuesta incorrecta no revela cuál era la correcta.** En timeout sí se iluminaba la opción correcta (`js/game.js:850-852`), pero al responder mal solo se marcaba en rojo la elegida. Ahora `checkAnswer` marca también `.correct` cuando `ok === false`.

**B8. El timeout ignora las preferencias y las tareas restantes.** `showTimeoutFeedback` siempre auto-avanza a los 3.5 s aunque el usuario haya puesto "⏸️ Manual", no tiene botón "Siguiente", y salta con `nextCase()` directamente, descartando las tareas restantes de un caso multi-tarea (una respuesta incorrecta, en cambio, continúa con la siguiente tarea "descompensada"). Además no incrementa `solvedCasesCount`, así que el badge "Caso N" repite número.

**B9. Narrativa de descompensación desincronizada.** Tras fallar la tarea 1, la tarea 2 se prefija con "🚨 ¡El paciente se ha descompensado…! Realiza una maniobra de rescate" (`js/game.js:696`), pero la pregunta mostrada es la tarea 2 normal del caso (p. ej. teoría de criterios DSM), no una maniobra de rescate. El texto promete un branching que no existe.

### P3 — Menores

- ✅ `js/game.js:139`: `state.timeLeft = GAME_CONFIG.turnSeconds` — clave inexistente (`baseTurnSeconds`); corregido.
- ✅ `js/game.js:751`: barajado con `sort(() => Math.random() - 0.5)` sesgado; reemplazado por Fisher–Yates.
- ✅ ECG (`js/game.js:766`): el `path` mide más de 100 unidades y `stroke-dasharray: 100` producía segmentos partidos; se añadió `pathLength="100"`. Al corregirlo se encontró un bug extra: `getPatientEcgClass` devuelve `tachy`/`brady`/`flat` pero el CSS espera `ecg-tachy`/`ecg-brady`/`ecg-flat` — las variantes de ritmo (taquicardia rosa, bradicardia lenta, línea plana) nunca se aplicaban. También corregido (`ecg-${ecgClass}`).
- ✅ Consola: 404 de `favicon.ico` — se añadió `<link rel="icon">`.
- ✅ `assets/icons/`: eliminados los duplicados `icon_192.png`/`icon_512.png` (guion bajo, sin referencias).
- ✅ Game Over y menú: concordancia "1 listo" / "N listos".
- ✅ `Economy.save()` y la persistencia de casos fallados ahora envuelven `localStorage.setItem` en try/catch (Safari privado / cuota llena ya no rompe la partida).
- ⏳ README desactualizado: menciona `js/ui.js` y `tools/validator.js` que no existen; `data/cases_v1.json` y `casos_corregidos_usuario.json` (~300 KB) se publican sin que el runtime los use.

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
- ✅ *(resuelto con la Fase 1 del plan de personajes)* Los dos residentes ("Aguilar"/"Solis") alternaban mecánicamente y las frases de `NARRATIVE.residents` nunca se mostraban en el juego — narrativa declarada pero no cableada.

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

## 6. Plan: sprites, rotación de personajes e interacciones más realistas

Objetivo: que la guardia se sienta habitada — caras nuevas, reacciones creíbles y un paciente visible — sin romper el offline-first ni el rendimiento móvil. Se propone en tres fases incrementales; cada una es útil por sí sola.

### Fase 1 — ✅ IMPLEMENTADA — Rotación y voz de los personajes (sin assets nuevos)

Antes había exactamente 2 residentes ("Aguilar", "Solis") que alternaban de forma mecánica caso por caso, el jefe era una constante, y las frases de `NARRATIVE.residents` estaban escritas en el código pero **nunca se mostraban** en pantalla. Lo implementado: roster de 8 residentes con gradiente y frase personal, selección aleatoria sin repetición consecutiva (se conserva el residente durante las tareas de su caso), frase de presentación contextual según la clase ECG del paciente en la tarjeta del caso, reacción del residente en el feedback de acierto/error/timeout (con pool especial en racha ≥3 y anti-repetición de frases), arco del jefe (VIGILANDO → TENSO → ASINTIENDO en racha ≥5 → IMPRESIONADO en racha ≥8 → ¡FURIOSO! con 1 vida) y la cita de `NARRATIVE.boss` visible en el menú.

1. **Roster ampliado:** 6–8 residentes con nombre, género, color de gradiente propio y 2–3 rasgos de personalidad (la insegura, el sobrado, la metódica…). Selección aleatoria ponderada que evite repetir el residente del caso anterior — más variedad percibida sin tocar assets.
2. **Frases contextuales:** cada residente "presenta" el caso con una línea propia según el tipo (`case_type`, clase ECG): *"Doctora, este viene agitado, no lo puedo contener"* para `tachy`, *"Lo encontraron los familiares, casi no responde"* para `brady`. Pools de frases por estado (presentación / acierto / error / racha) con anti-repetición.
3. **Jefe con arco:** hoy solo "VIGILANDO/¡FURIOSO!". Añadir estados intermedios ligados a racha y vidas (aprobación seca en racha ≥5, advertencia a 2 vidas, elogio raro y valioso), reutilizando la cita de `NARRATIVE.boss` que tampoco se muestra.

### Fase 2 — Interacciones realistas (esfuerzo medio)

4. **Globos de diálogo en el HUD:** burbuja breve junto al avatar (aparece 2–3 s, no bloquea el timer, `aria-live="polite"`, se desactiva con `prefers-reduced-motion`). Es el vehículo de las frases de la Fase 1 — sin esto, las frases no tienen dónde vivir.
5. **Arreglar B9 con esta pieza:** la "descompensación" actual promete una maniobra de rescate que no existe. Convertirla en reacción real: al fallar la tarea 1, el ECG pasa a `tachy` (ya implementado), el residente lanza una frase de urgencia y el prefijo engañoso desaparece — la tarea 2 se presenta como lo que es, con contexto de deterioro.
6. **Reacciones encadenadas:** acierto en racha → residente celebra Y el jefe asiente; error → residente en shock Y el jefe reacciona un beat después (400 ms). La secuencia, no la simultaneidad, es lo que se lee como "vivo".
7. **El paciente entra a escena:** hoy el paciente es solo una línea de ECG. Darle presencia mínima: un avatar de paciente en la tarjeta del caso cuyo estado visual siga a `getPatientEcgClass` (normal/taqui/brady) y empeore al descompensarse. Es el mayor salto de realismo por unidad de esfuerzo.

### Fase 3 — Sprites (esfuerzo medio-alto, requiere producir assets)

8. **Sustituir los SVG procedurales por sprites con identidad:** retratos estilo pixel-art o cartoon plano, coherentes con la estética synthwave (paleta cian/rosa/morado sobre fondo oscuro).
   - **Formato:** sprite sheets WebP (con PNG de respaldo) en `assets/sprites/`, animación por `steps()` de CSS — nada de GIF ni JS por frame.
   - **Estados mínimos por personaje:** idle, hablando, celebrando, shock (4 frames bastan; la rotación de personajes disimula la economía de frames).
   - **Pacientes:** 6–10 retratos genéricos reutilizables (por edad/sexo aparente), asignados por hash del `case_id` para que el mismo caso muestre siempre la misma cara.
   - **Offline-first obligatorio:** todos los sprites en `APP_SHELL` del SW con bump de `CACHE_VERSION`; presupuesto ~150–250 KB total para no castigar la primera carga móvil.
   - **Accesibilidad:** `prefers-reduced-motion` congela en el frame idle; los estados también se comunican por texto (ya existe el patrón "VIGILANDO/¡FURIOSO!").
9. **Gancho con la economía (pendiente #7):** desbloquear residentes/retratos con monedas o rango da por fin un sumidero significativo a las monedas y una razón para subir de rango.

## 7. Priorización sugerida

| # | Acción | Esfuerzo | Impacto | Estado |
|---|--------|----------|---------|--------|
| 1 | B1: fallback del generador visible y no permanente + `getPoolSize` en el menú | Bajo | Alto | ✅ Hecho |
| 2 | B2: repaso espaciado para todos los casos reales (excluir solo `MODULAR_`) | Trivial | Alto | ✅ Hecho |
| 3 | B4+B3: quitar Tailwind CDN, endurecer CSP, cachear fuentes offline | Bajo | Alto | ✅ Hecho |
| 4 | B6+B7: revelar respuesta correcta al fallar y feedback antes del Game Over | Bajo | Alto | ✅ Hecho |
| 5 | `display_title` neutros para los ~15 títulos-spoiler | Medio (editorial) | Alto para el valor didáctico | ⏳ Pendiente |
| 6 | Compactar HUD móvil | Medio | Medio | ⏳ Pendiente |
| 7 | Sumideros de economía + curva de dificultad visible | Medio | Medio | ⏳ Pendiente |
| 8 | `prefers-reduced-motion` + contraste + `aria-live` | Bajo | Medio | ⏳ Pendiente |
| 9 | P3 varios (typo, shuffle, ECG, favicon, plural, íconos, try/catch) | Trivial | Bajo | ✅ Hecho (falta README) |

| 10 | Fase 1 personajes: roster ampliado + frases contextuales + arco del jefe | Bajo | Medio-alto | ✅ Hecho |
| 11 | Fase 2 personajes: globos de diálogo, B9 real, paciente en escena | Medio | Alto | ⏳ Pendiente |
| 12 | Fase 3 personajes: sprites con estados + desbloqueo vía economía | Medio-alto | Medio (estética) | ⏳ Pendiente |

Pendientes también: B8 (timeout ignora preferencias y tareas restantes), B9 (narrativa de descompensación — se resuelve dentro de la Fase 2 del plan de personajes) y todo lo editorial de la sección 3 (why_not de segundas tareas, viñetas cortas, teoría antes de la pregunta, `documento_educativo` sin contenido).
