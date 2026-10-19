"use strict";

// GAME_CONFIG, NARRATIVE, BOSS_ROUNDS, ROSTER y RESIDENT_LINES viven en
// js/content.js, que se genera desde EDITAR_JUEGO.md (npm run apply).

// Anti-repetición: recuerda la última frase usada por pool
const _lineMemory = {};
function pickLine(poolName) {
  const pool = RESIDENT_LINES[poolName] || [];
  if (!pool.length) return "";
  let idx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && idx === _lineMemory[poolName]) idx = (idx + 1) % pool.length;
  _lineMemory[poolName] = idx;
  return pool[idx];
}

// Geometría de las sprite sheets normalizadas (tools/normalize_sprites.py):
// rejilla fija de 5x2 con celdas cuadradas y la cabeza centrada en cada una.
const SPRITE_COLS = 5;
const SPRITE_ROWS = 2;

// Índice de cada ánimo en la hoja, en el mismo orden fila por fila con el que
// la escribe la herramienta de normalización.
const MOOD_FRAMES = {
  normal: 0,
  speaking: 1,
  thinking: 2,
  ok: 3,
  streak: 4,
  worried: 5,
  shock: 6,
  exhausted: 7,
  surprised: 8,
  angry: 9
};

const Avatars = {
  // Recorta una pose de la hoja normalizada. Como la rejilla es exacta
  // (celdas cuadradas de 5x2), basta aritmética de porcentajes: no hay
  // ajustes manuales de encuadre y la cara siempre queda centrada.
  _generate(spritePath, mood, animation, tone) {
    const frame = MOOD_FRAMES[mood] !== undefined ? MOOD_FRAMES[mood] : 0;
    const col = frame % SPRITE_COLS;
    const row = Math.floor(frame / SPRITE_COLS);

    const pctX = (col / (SPRITE_COLS - 1)) * 100;
    const pctY = (row / (SPRITE_ROWS - 1)) * 100;

    return `
      <div class="kawaii-avatar kawaii-avatar--${tone || "resident"} ${animation ? animation : ''}">
        <div class="sprite-frame" style="
          background-image: url('assets/sprites/${spritePath}');
          background-size: ${SPRITE_COLS * 100}% ${SPRITE_ROWS * 100}%;
          background-position: ${pctX}% ${pctY}%;
        "></div>
      </div>
    `;
  },

  // Cambia la pose de un avatar ya pintado sin rehacer el HUD entero. Lo usa
  // el reloj para que el residente se preocupe cuando queda poco tiempo:
  // volver a pintar todo el HUD diez veces por segundo sería absurdo.
  setMood(container, mood) {
    const frame = container && container.querySelector(".sprite-frame");
    if (!frame) return;
    const idx = MOOD_FRAMES[mood] !== undefined ? MOOD_FRAMES[mood] : 0;
    const col = idx % SPRITE_COLS;
    const row = Math.floor(idx / SPRITE_COLS);
    frame.style.backgroundPosition =
      `${(col / (SPRITE_COLS - 1)) * 100}% ${(row / (SPRITE_ROWS - 1)) * 100}%`;
  },

  resident(name, mood = "normal") {
    const res = ROSTER.find(r => r.name === name) || ROSTER[0];
    const anim = (mood === "ok" || mood === "streak") ? "bounce" : ((mood === "shock" || mood === "angry") ? "shake" : "");
    return this._generate(res.sprite, mood, anim, "resident");
  },

  boss(mood = "normal") {
    const anim = mood === "angry" ? "shake" : "";
    return this._generate("celada_atlas.png", mood, anim, "boss");
  },

  patient(caseId, ecgClass) {
    let hash = 0;
    if (caseId) {
      for (let i = 0; i < caseId.length; i++) {
        hash = caseId.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % 3;
    const files = ["pac1_atlas.png", "pac2_atlas.png", "pac3_atlas.png"];
    let mood = "normal";
    let anim = "";
    // El fondo del retrato sigue al ritmo, no al azar del identificador: rojo
    // si va acelerado, azul frío si está hipoactivo, neutro si nada urge.
    let tone = "patient";
    if (ecgClass === "tachy") {
      mood = "shock";
      anim = "shake";
      tone = "patient-tachy";
    } else if (ecgClass === "brady" || ecgClass === "flat") {
      mood = "exhausted";
      tone = "patient-brady";
    }
    return this._generate(files[index], mood, anim, tone);
  }
};

const Game = (() => {
  const state = {
    lives: GAME_CONFIG.maxLives,
    timeLeft: GAME_CONFIG.baseTurnSeconds,
    timer: null,
    timerStart: 0,
    current: null,
    currentTaskIndex: 0,
    studyMode: false,
    reviewMode: false,
    autoAdvance: SafeStore.get('psy_pref_autoadvance') !== 'false',
    soundEnabled: SafeStore.get('psy_pref_sound') !== 'false',
    solvedCasesCount: 0,
    filters: {
      educational_level: "",
      difficulty: ""
    },
    resident: ROSTER[0],
    turnSeconds: GAME_CONFIG.baseTurnSeconds, // Dinámico
    casesReady: false,
    streak: 0,
    maxStreak: 0,
    recentCases: [],
    recentFeedbackTimer: null,
    residentMood: "normal",
    // null = usa el estado derivado de BOSS_STATES. Sólo se fija a mano para
    // una reacción puntual (el enojo justo después de un error) que la tabla,
    // que sólo mira vidas y racha, no sabría representar.
    bossMood: null,
    hintUsedInTurn: false,
    justRescued: false,
    failedCaseIds: [],
    decompensated: false,
    // La pregunta ya se decidió (respuesta o reloj agotado). Bloquea las
    // ayudas de pago: antes se podía comprar una pista o +30s con el
    // feedback ya en pantalla y las monedas se iban a la basura.
    locked: false,
    // Hubo algún fallo en alguna tarea del caso actual. El repaso espaciado
    // sólo asciende un caso resuelto entero sin errores.
    caseHadError: false,
    // Contador de sesión: cada guardia y cada vuelta al menú lo incrementan.
    // Los setTimeout diferidos comprueban que sigue siendo el suyo antes de
    // pintar nada (si no, un feedback podía aparecer encima del menú).
    runId: 0,
    // Último reloj anunciado, para avisar cuando la racha lo acorta.
    lastTurnSeconds: GAME_CONFIG.baseTurnSeconds,
    // Apuesta clínica del turno actual: firmar la nota dobla lo que ganas y
    // añade una multa si te equivocas. Se reinicia en cada pregunta.
    signed: false,
    lastReward: null,
    // Bloque de 5 pacientes que cierra con el pase de visita del adscrito.
    round: { answered: 0, correct: 0, coins: 0, index: 1 },
    // Acumulado de toda la guardia, para el resumen final.
    shift: newShift()
  };

  function newShift() {
    return { answered: 0, correct: 0, coins: 0, cases: 0, fast: 0, signed: 0, mistakes: [] };
  }

  const $ = (sel) => document.querySelector(sel);

  // Programa un callback sólo válido para la sesión actual (ver state.runId).
  function later(fn, ms) {
    const run = state.runId;
    return setTimeout(() => { if (run === state.runId) fn(); }, ms);
  }

  function setUrgency(hot, critical) {
    document.body.classList.toggle("hot-zone-active", !!hot);
    document.body.classList.toggle("time-critical", !!critical);
  }

  // Detiene todo lo que corre durante un turno: reloj, auto-avance y efectos.
  function stopTurnFx() {
    clearInterval(state.timer);
    clearTimeout(state.recentFeedbackTimer);
    setUrgency(false, false);
  }

  // --- SCREEN MANAGER ---
  const ScreenManager = {
    showMenu() {
      state.runId++;
      stopTurnFx();
      PsyBoot.inShift = false;
      // Si llegó una versión nueva durante la guardia, éste es el momento de
      // aplicarla: el jugador ya no pierde nada.
      PsyBoot.applyPendingUpdate();

      $("#hudRoot").innerHTML = "";
      $("#caseRoot").innerHTML = "";
      $("#modalRoot").innerHTML = "";
      $("#fxRoot").innerHTML = "";

      // El menú se pinta en hudRoot, que hace de contenedor principal.
      renderMenu();
      $("#hudRoot").classList.remove("fade-out");
      $("#hudRoot").classList.add("fade-in", "screen-transition");
    }
  };

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // --- REPASO ESPACIADO ---
  // Cada caso fallado guarda un nivel de maestría: 0 (repasar ya) → 1 (+24 h)
  // → 2 (+72 h) → borrado al tercer acierto espaciado.
  const FAILED_KEY = "psycase_failed_cases";
  const REVIEW_DELAYS_MS = [0, 24 * 3600 * 1000, 72 * 3600 * 1000];
  const MASTERY_LEVEL = 3;

  function getFailedCases() {
    try {
      const raw = JSON.parse(SafeStore.get(FAILED_KEY, "[]"));
      if (!Array.isArray(raw)) return [];
      return raw
        .filter(item => (item !== null && typeof item === "object") || typeof item === "string")
        .map(item => {
          if (typeof item === "string") {
            return { caseId: item, level: 0, nextReview: 0 };
          }
          return {
            caseId: typeof item.caseId === "string" ? item.caseId : "",
            level: Number.isFinite(item.level) ? item.level : 0,
            nextReview: Number.isFinite(item.nextReview) ? item.nextReview : 0
          };
        })
        .filter(item => item.caseId.length > 0);
    } catch (e) {
      return [];
    }
  }

  function storeFailedCases(list) {
    SafeStore.set(FAILED_KEY, JSON.stringify(list));
  }

  function getDueFailedCases() {
    const now = Date.now();
    return getFailedCases().filter(item => !item.nextReview || item.nextReview <= now);
  }

  // Quita del repaso los casos que ya no existen en el banco. Sin esto, un
  // caso retirado del dataset quedaba "listo para repasar" para siempre: el
  // menú prometía N casos y el repaso terminaba al instante.
  function pruneFailedCases() {
    if (!CaseDB.isReady()) return;
    const list = getFailedCases();
    const kept = list.filter(item => CaseDB.hasCase(item.caseId));
    if (kept.length !== list.length) storeFailedCases(kept);
  }

  function saveFailedCase(caseId) {
    // Todos los casos del banco entran al repaso; sólo se excluyen los sintéticos del generador.
    if (!caseId || caseId.startsWith("MODULAR_")) return;
    const failed = getFailedCases();
    const existing = failed.find(item => item.caseId === caseId);
    if (!existing) {
      failed.push({ caseId, level: 0, nextReview: Date.now() });
    } else {
      // Volver a fallar reinicia la maestría y lo deja listo de inmediato.
      existing.level = 0;
      existing.nextReview = Date.now();
    }
    storeFailedCases(failed);
  }

  function promoteFailedCase(caseId) {
    if (!caseId) return;
    const failed = getFailedCases();
    const idx = failed.findIndex(item => item.caseId === caseId);
    if (idx === -1) return;
    const item = failed[idx];
    item.level = (item.level || 0) + 1;
    if (item.level >= MASTERY_LEVEL) {
      failed.splice(idx, 1);
    } else {
      item.nextReview = Date.now() + REVIEW_DELAYS_MS[item.level];
    }
    storeFailedCases(failed);
  }

  // Separador de oraciones que no corta en decimales ("0.6-1.2 mEq/L")
  const SENTENCE_RE = /(?:[^.!?]|[.!?](?=\d))+(?:[.!?]+|$)/g;

  function getBriefFeedback(caseObj, task) {
    const rationale = task?.rationale || caseObj?.explanation?.rationale || "";
    if (!rationale) return "Evalúa el riesgo inmediato y prioriza lo defendible.";
    const sentences = rationale.match(SENTENCE_RE);
    return sentences ? sentences[0].trim() : rationale.slice(0, 160) + "…";
  }

  // En los casos multi-tarea, why_not mezcla los distractores de todas las
  // preguntas. Mostrarlo entero en la pregunta 2 explicaba opciones que el
  // jugador nunca vio. Se queda sólo con las de la pregunta en pantalla.
  function getWhyNotForTask(caseObj, task) {
    const whyNot = Array.isArray(caseObj?.explanation?.why_not) ? caseObj.explanation.why_not : [];
    const shown = new Set((Array.isArray(task?.distractors) ? task.distractors : []).map(normalizeCaseText));
    if (!shown.size) return whyNot;
    return whyNot.filter(item => shown.has(normalizeCaseText(item.option || "")));
  }

  function getExplanationPayload(caseObj, task, selectedText, ok) {
    const explanation = caseObj?.explanation || {};
    // Una tarea con rationale propio manda sobre el del caso (que suele
    // explicar la primera pregunta).
    const rationale = String(task?.rationale || explanation.rationale || "").trim();
    const takeHome = String(explanation.take_home || "").trim();
    const whyNot = getWhyNotForTask(caseObj, task);
    let reason = "";

    if (!ok && selectedText) {
      const cleanSelected = normalizeCaseText(selectedText);
      const match = whyNot.find(item => normalizeCaseText(item.option || "") === cleanSelected);
      reason = String(match?.reason || "").trim();
    }
    return { reason: reason || rationale, rationale, takeHome };
  }

  function getCaseTitle(caseObj) {
    return String(caseObj?.display_title || caseObj?.title || "Caso clínico");
  }

  function normalizeCaseText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  // El multiplicador sube en escalones de racha. Se calcula para la racha que
  // tendrás DESPUÉS de acertar, que es la que realmente se paga.
  function getStreakMultiplier(streak) {
    const steps = Math.floor(Math.max(0, streak) / GAME_CONFIG.streakStep);
    return Math.min(GAME_CONFIG.maxMultiplier, 1 + steps * 0.5);
  }

  function getMultiplierLabel(mult) {
    if (mult >= 3) return "LEYENDA DE GUARDIA";
    if (mult >= 2.5) return "INTRATABLE";
    if (mult >= 2) return "IMPARABLE";
    if (mult >= 1.5) return "EN RITMO";
    return "";
  }

  function isUntimed() {
    return state.studyMode || state.current?.case_type === "documento_educativo";
  }

  // Cuánto queda del reloj en el instante de responder. El tiempo dejó de ser
  // sólo una amenaza: ahora también es dinero.
  function getSpeedInfo() {
    if (isUntimed() || !state.turnSeconds) return { ratio: 0, coins: 0, fast: false };
    const ratio = Math.max(0, Math.min(1, state.timeLeft / state.turnSeconds));
    return {
      ratio,
      coins: Math.round(ratio * GAME_CONFIG.speedBonusMax),
      fast: ratio >= GAME_CONFIG.fastThreshold
    };
  }

  function formatMultiplier(mult) {
    return "×" + (Number.isInteger(mult) ? mult.toFixed(0) : mult.toFixed(1));
  }

  // Residente aleatorio evitando repetir el del caso anterior
  function pickResident() {
    const candidates = ROSTER.filter(r => r.name !== state.resident?.name);
    return candidates[Math.floor(Math.random() * candidates.length)] || ROSTER[0];
  }

  // Frase con la que el residente presenta el caso (según el "ritmo" del paciente).
  // A veces usa su frase personal para que cada residente tenga voz propia.
  function getResidentPresentLine(ecgClass) {
    if (state.resident?.signature && Math.random() < 0.25) return state.resident.signature;
    if (ecgClass === "tachy") return pickLine("presentTachy");
    if (ecgClass === "brady") return pickLine("presentBrady");
    return pickLine("presentNormal");
  }

  // Estado del jefe: evalúa resultados — rachas altas ganan elogio, vidas bajas ganan tensión.
  // La etiqueta y el retrato salen de la misma tabla para que nunca se
  // contradigan: antes el texto tenía seis estados y la cara sólo dos.
  const BOSS_STATES = [
    { when: () => state.studyMode,      label: "EDUCANDO",      mood: "speaking" },
    { when: () => state.lives <= 1,     label: "¡FURIOSO!",     mood: "angry"    },
    { when: () => state.streak >= 8,    label: "IMPRESIONADO",  mood: "streak"   },
    { when: () => state.streak >= 5,    label: "ASINTIENDO",    mood: "ok"       },
    { when: () => state.decompensated,  label: "ALERTA",        mood: "surprised"},
    { when: () => state.lives === 2,    label: "TENSO",         mood: "worried"  },
    { when: () => true,                 label: "VIGILANDO",     mood: "normal"   }
  ];

  function getBossState() {
    return BOSS_STATES.find(s => s.when()) || BOSS_STATES[BOSS_STATES.length - 1];
  }

  function getBossStatus() {
    return getBossState().label;
  }

  function splitCaseText(text) {
    const clean = normalizeCaseText(text);
    if (!clean) return { summary: "", details: "" };
    const sentences = clean.match(SENTENCE_RE) || [];
    let summary = sentences.slice(0, 2).join(" ").trim();
    let details = sentences.slice(2).join(" ").trim();
    if (!summary) summary = clean;
    if (!details && clean.length > 240) {
      summary = clean.slice(0, 240).trim() + "…";
      details = clean.slice(240).trim();
    }
    return { summary, details };
  }

  // --- RENDERERS & FX ---
  function withTransition(callback) {
    if (document.startViewTransition) {
      document.startViewTransition(callback);
    } else {
      callback();
    }
  }

  function flashScreen(isCorrect) {
    const root = $("#fxRoot");
    if (!root) return;
    const flash = document.createElement("div");
    flash.className = "flash-overlay " + (isCorrect ? "flash-correct" : "flash-incorrect");
    root.appendChild(flash);
    setTimeout(() => {
      if (root.contains(flash)) root.removeChild(flash);
    }, 500);
  }

  // Sacudida corta del contenedor. Un error debe sentirse, no sólo leerse.
  function shakeScreen() {
    // Se sacude el caso, no #app: transformar el contenedor rompería el
    // posicionamiento fijo de #fxRoot, que cuelga de él.
    const target = $("#caseRoot");
    if (!target) return;
    target.classList.remove("screen-shake");
    void target.offsetWidth; // reinicia la animación si ya estaba corriendo
    target.classList.add("screen-shake");
    setTimeout(() => target.classList.remove("screen-shake"), 450);
  }

  // Número flotante con lo que acabas de ganar o perder.
  function floatReward(text, tone = "good") {
    const root = $("#fxRoot");
    if (!root || !text) return;
    const el = document.createElement("div");
    el.className = "float-reward float-reward--" + tone;
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => { if (root.contains(el)) root.removeChild(el); }, 1500);
  }

  // Banner de hito de racha: aparece sólo cuando el multiplicador sube de nivel.
  function showComboBanner(mult) {
    const root = $("#fxRoot");
    if (!root) return;
    const label = getMultiplierLabel(mult);
    const el = document.createElement("div");
    el.className = "combo-banner";
    el.innerHTML = `<span class="combo-banner-mult">${formatMultiplier(mult)}</span>` +
                   (label ? `<span class="combo-banner-label">${escapeHtml(label)}</span>` : "");
    root.appendChild(el);
    setTimeout(() => { if (root.contains(el)) root.removeChild(el); }, 1600);
  }

  // Aviso de logro. Antes sólo se enteraba uno al morir, cuando ya daba igual.
  function showAchievementToasts(list) {
    if (!Array.isArray(list) || !list.length) return;
    const root = $("#fxRoot");
    if (!root) return;
    list.forEach((ach, i) => {
      setTimeout(() => {
        const el = document.createElement("div");
        el.className = "toast-achievement";
        el.innerHTML = `
          <span class="toast-icon" aria-hidden="true">${escapeHtml(ach.icon)}</span>
          <span class="toast-text">
            <span class="toast-title">Logro desbloqueado</span>
            <span class="toast-name">${escapeHtml(ach.name)}</span>
          </span>`;
        root.appendChild(el);
        if (state.soundEnabled) playSequence([880, 1175, 1568], 0.07, 0.12);
        setTimeout(() => { if (root.contains(el)) root.removeChild(el); }, 3200);
      }, i * 500);
    });
  }

  // Revisa logros y los anuncia en el momento en que se ganan.
  function pushAchievements() {
    showAchievementToasts(Economy.checkAchievements());
  }

  function renderMenu() {
    withTransition(() => {
      const root = $("#hudRoot");
      if (!root) return;

      Economy.init(); // Refresh data
      const failedList = getFailedCases();
      const dueList = getDueFailedCases();
      const board = Economy.getAchievementBoard();
      const unlockedCount = board.filter(a => a.unlocked).length;
      const bestShift = Economy.getBestShift();
      const accuracy = Economy.getAccuracy();

    root.innerHTML = `
      <div class="miami-card hero-card">
        <div class="hero-title">PsyCase</div>
        <div class="hero-subtitle">Guardia crítica · decide en segundos</div>

        <div class="hero-meta">
          <div class="hud-stat">
            <span class="hud-stat-label">Rango</span>
            <span class="hud-stat-value">${escapeHtml(Economy.getRank())}</span>
          </div>
          <div class="hud-stat hud-stat--coins">
            <span class="hud-stat-label">Monedas</span>
            <span class="hud-stat-value">🪙 ${Economy.getCoins()}</span>
          </div>
          <div class="hud-stat" title="Máximo de pacientes atendidos en una sola guardia">
            <span class="hud-stat-label">Récord</span>
            <span class="hud-stat-value">🏅 ${bestShift}</span>
          </div>
          ${accuracy === null ? "" : `
          <div class="hud-stat" title="Aciertos sobre decisiones tomadas en toda tu carrera">
            <span class="hud-stat-label">Precisión</span>
            <span class="hud-stat-value">${accuracy}%</span>
          </div>`}
        </div>

        <!-- Cada modo dice en qué se diferencia: antes eran dos botones con
             el mismo aspecto y había que entrar para descubrirlo. -->
        <div class="mode-list">
          <button class="btn-action btn-mode" id="btnStart">
            <span class="btn-mode-icon" aria-hidden="true">🚨</span>
            <span class="btn-mode-text">
              <span class="btn-mode-title">Iniciar guardia</span>
              <span class="btn-mode-desc">${GAME_CONFIG.maxLives} vidas y reloj corriendo · ganas monedas</span>
            </span>
          </button>

          <button class="btn-action btn-mode btn-mode--study" id="btnStudyMode">
            <span class="btn-mode-icon" aria-hidden="true">📚</span>
            <span class="btn-mode-text">
              <span class="btn-mode-title">Modo estudio</span>
              <span class="btn-mode-desc">Sin reloj ni vidas · para aprender sin presión</span>
            </span>
          </button>

          ${failedList.length > 0 ? `
            <button class="btn-action btn-mode btn-mode--review" id="btnMenuReviewFailed"
              ${dueList.length === 0 ? 'disabled' : ''}>
              <span class="btn-mode-icon" aria-hidden="true">${dueList.length > 0 ? "🔁" : "✅"}</span>
              <span class="btn-mode-text">
                <span class="btn-mode-title">${dueList.length > 0 ? "Repasar errores" : "Repaso al día"}</span>
                <span class="btn-mode-desc">${dueList.length > 0
                  ? `${dueList.length} ${dueList.length === 1 ? "caso listo" : "casos listos"} de ${failedList.length} en repaso`
                  : `${failedList.length} ${failedList.length === 1 ? "caso" : "casos"} esperando su próxima vuelta`}</span>
              </span>
            </button>
          ` : ""}
        </div>
      </div>

      <div class="miami-card">
        <div class="narrative-title" style="margin-bottom:12px;">📊 FILTRAR CASOS (OPCIONAL)</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div>
            <label class="stat-label" style="display:block; margin-bottom:6px;" for="selectLevel">Nivel Educativo</label>
            <select class="miami-select" id="selectLevel">
              <option value="">Todos los niveles</option>
              <option value="licenciatura">Licenciatura</option>
            </select>
          </div>
          <div>
            <label class="stat-label" style="display:block; margin-bottom:6px;" for="selectDifficulty">Dificultad</label>
            <select class="miami-select" id="selectDifficulty">
              <option value="">Todas</option>
              <option value="facil">Fácil</option>
              <option value="media">Media</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
        </div>
        <div class="pool-info" id="poolInfo" aria-live="polite"></div>
      </div>

      <!-- La vitrina hace visible lo que antes sólo aparecía al morir: hay
           metas concretas que perseguir entre guardia y guardia. -->
      <div class="miami-card">
        <div class="narrative-title" style="margin-bottom:12px;">🏅 VITRINA DE LOGROS · ${unlockedCount}/${board.length}</div>
        <div class="achievement-shelf">
          ${board.map(a => `
            <div class="achievement-chip ${a.unlocked ? "achievement-chip--on" : ""}"
                 title="${escapeHtml(a.name)}: ${escapeHtml(a.desc)}">
              <span class="achievement-chip-icon" aria-hidden="true">${a.unlocked ? escapeHtml(a.icon) : "🔒"}</span>
              <span class="achievement-chip-text">
                <span class="achievement-chip-name">${escapeHtml(a.name)}</span>
                <span class="achievement-chip-desc">${escapeHtml(a.desc)}</span>
              </span>
            </div>`).join("")}
        </div>
      </div>

      <!-- Briefing en vez de temario: las mismas reglas, pero dichas por el
           adscrito y con su cara delante. Una lista de viñetas bajo el título
           "Bienvenida a la guardia" se leía como el encuadre de una clase. -->
      <div class="miami-card briefing-card">
        <div class="briefing-head">
          <div class="avatar">${Avatars.boss("speaking")}</div>
          <div class="briefing-who">
            <div class="hud-person-role">Adscrito de guardia</div>
            <div class="hud-person-name">Dr. Celada</div>
          </div>
        </div>
        <div class="briefing-quote">“${escapeHtml(NARRATIVE.intro)}”</div>
        <div class="briefing-rules">
          ${NARRATIVE.rules.map(r => `<div class="briefing-rule">${escapeHtml(r.replaceAll("{pase}", GAME_CONFIG.casesPerRound))}</div>`).join("")}
        </div>
        <div class="briefing-sign">${escapeHtml(NARRATIVE.consequence)}</div>
      </div>
    `;

    // Reflejar los filtros vigentes y mostrar cuántos casos reales cubre la combinación
    const selectLevel = $("#selectLevel");
    const selectDifficulty = $("#selectDifficulty");
    selectLevel.value = state.filters.educational_level;
    selectDifficulty.value = state.filters.difficulty;

    // Cada opción de dificultad dice cuántos casos tiene con el nivel elegido.
    // Con 1 solo caso "Difícil" el jugador veía el mismo paciente una y otra
    // vez sin entender por qué.
    const labelDifficultyOptions = () => {
      Array.from(selectDifficulty.options).forEach(opt => {
        if (!opt.dataset.base) opt.dataset.base = opt.textContent;
        if (!state.casesReady) { opt.textContent = opt.dataset.base; return; }
        const n = CaseDB.getPoolSize({ educational_level: selectLevel.value, difficulty: opt.value });
        opt.textContent = `${opt.dataset.base} (${n})`;
      });
    };

    const updatePoolInfo = () => {
      const info = $("#poolInfo");
      if (!info) return;
      labelDifficultyOptions();
      if (!state.casesReady) {
        info.textContent = "⚠️ Sin conexión con el banco de casos: se jugarán casos sintéticos";
        info.classList.add("pool-info--warn");
        return;
      }
      const n = CaseDB.getPoolSize({
        educational_level: selectLevel.value,
        difficulty: selectDifficulty.value
      });
      let msg = n > 0
        ? `${n} caso${n === 1 ? "" : "s"} del banco clínico con estos filtros`
        : "⚠️ Sin casos reales para esta combinación: se jugarán casos sintéticos";
      if (n > 0 && n < GAME_CONFIG.casesPerRound) msg += " · se repetirán pronto";
      info.textContent = msg;
      info.classList.toggle("pool-info--warn", n === 0);
    };
    selectLevel.onchange = updatePoolInfo;
    selectDifficulty.onchange = updatePoolInfo;
    ensureCasesLoaded().then(updatePoolInfo);

    // Un solo arranque por clic: antes un doble toque lanzaba dos guardias
    // superpuestas (dos casos, dos relojes compitiendo por el mismo HUD).
    const launch = (studyMode, reviewMode) => {
      root.querySelectorAll(".btn-mode").forEach(b => { b.disabled = true; });
      root.classList.add("fade-out", "screen-transition");
      later(() => startTurn(studyMode, reviewMode), 260);
    };

    $("#btnStart").onclick = () => launch(false, false);
    $("#btnStudyMode").onclick = () => launch(true, false);
    if (failedList.length > 0) {
      $("#btnMenuReviewFailed").onclick = () => launch(true, true);
    }
  });
}

  function renderGameOver() {
    const modal = $("#modalRoot");

    PsyBoot.inShift = false;
    let isRecord = false;
    if (!state.studyMode) {
      isRecord = Economy.registerGame(state.maxStreak, state.shift.cases);
    }
    // registerGame puede desbloquear logros (primer turno, turno largo,
    // veterano): antes se marcaban en silencio y nadie se enteraba.
    pushAchievements();
    const unlocked = Economy.getUnlockedAchievements();
    const sh = state.shift;
    const accuracy = sh.answered ? Math.round((sh.correct / sh.answered) * 100) : 0;

    const failedList = getFailedCases();
    const dueList = getDueFailedCases();
    const showReviewBtn = failedList.length > 0;

    // Morir sin saber en qué fallaste es perder la guardia dos veces. La
    // lista convierte el Game Over en la última lección del turno.
    const mistakes = sh.mistakes.slice(-4).reverse();
    const mistakesHtml = mistakes.length ? `
      <div class="shift-mistakes">
        <div class="stat-label" style="color:var(--miami-pink);">Para repasar</div>
        ${mistakes.map(m => `
          <div class="shift-mistake">
            <div class="shift-mistake-title">${escapeHtml(m.title)}${m.timeout ? " · ⏰" : ""}</div>
            <div class="shift-mistake-answer">✔ ${escapeHtml(m.answer)}</div>
            ${m.takeHome ? `<div class="shift-mistake-take">${escapeHtml(m.takeHome)}</div>` : ""}
          </div>`).join("")}
      </div>` : "";

    modal.innerHTML = `
      <div class="modal">
        <div class="modalCard game-over-card">
          <div class="game-over-mark" aria-hidden="true">🌅</div>
          <h2 class="hero-title" style="color:#ff0055; margin:0;">GUARDIA TERMINADA</h2>
          <div style="color:var(--ink-2);">${sh.cases > 0
            ? `Atendiste a ${sh.cases} ${sh.cases === 1 ? "paciente" : "pacientes"} antes del cambio de turno.`
            : "El turno se cerró antes del primer paciente."}</div>

          ${isRecord && sh.cases > 0 ? `<div class="record-flag">🏅 ¡NUEVO RÉCORD DE GUARDIA!</div>` : ""}

          <!-- Cerrar una guardia sin saber cómo te fue es lo mismo que no
               jugarla. El resumen es la parte que se recuerda. -->
          <div class="stat-grid stat-grid--wide">
             <div class="stat-box">
               <div class="stat-value">${sh.cases}</div>
               <div class="stat-label">Pacientes</div>
             </div>
             <div class="stat-box">
               <div class="stat-value">${accuracy}%</div>
               <div class="stat-label">Precisión</div>
             </div>
             <div class="stat-box">
               <div class="stat-value">${state.maxStreak}</div>
               <div class="stat-label">Mejor Racha</div>
             </div>
             <div class="stat-box">
               <div class="stat-value">+${sh.coins}</div>
               <div class="stat-label">🪙 de la guardia</div>
             </div>
          </div>

          <div class="shift-extras">
            <span class="reward-chip reward-chip--fast">⚡ ${sh.fast === 1 ? "1 decisión veloz" : `${sh.fast} decisiones veloces`}</span>
            <span class="reward-chip reward-chip--sign">✍️ ${sh.signed === 1 ? "1 nota firmada" : `${sh.signed} notas firmadas`}</span>
            <span class="reward-chip">🏅 Récord: ${Economy.getBestShift()} pacientes</span>
          </div>
          
          ${unlocked.length ? `
            <div style="margin:10px 0;">
              <div class="stat-label" style="color:#ffd700;">Vitrina · ${unlocked.length} ${unlocked.length === 1 ? "logro" : "logros"}</div>
              <div class="achievement-list">
                ${unlocked.map(a => `
                  <div class="achievement-badge" title="${escapeHtml(a.name)}">${escapeHtml(a.icon)}</div>
                `).join("")}
              </div>
            </div>
          ` : ""}

          ${mistakesHtml}

          <div class="stat-label">Rango Actual: ${Economy.getRank()}</div>
          
          <div class="game-over-actions">
            <button class="btn-action" id="btnRestart">Nueva Guardia</button>
            ${showReviewBtn ? `
              <button class="btn-action btn-action--review" id="btnReviewFailed"
                ${dueList.length === 0 ? "disabled" : ""}>
                ${dueList.length > 0
                  ? `Repasar errores (${dueList.length} ${dueList.length === 1 ? "listo" : "listos"} de ${failedList.length})`
                  : `Repaso al día (${failedList.length} en maestría)`}
              </button>
            ` : ""}
            <button class="btn-action btn-action--ghost" id="btnMenu">Volver al menú</button>
          </div>
        </div>
      </div>
    `;

    $("#btnRestart").onclick = () => {
      modal.innerHTML = "";
      startTurn(false, false);
    };
    if (showReviewBtn) {
      $("#btnReviewFailed").onclick = () => {
        modal.innerHTML = "";
        startTurn(true, true);
      };
    }
    $("#btnMenu").onclick = () => {
      modal.innerHTML = "";
      ScreenManager.showMenu();
    };
  }

  function showReviewSuccess() {
    const modal = $("#modalRoot");
    modal.innerHTML = `
      <div class="modal">
        <div class="modalCard game-over-card" style="border-color:#39ff14; box-shadow: 0 0 50px rgba(57, 255, 20, 0.25);">
          <div style="font-size:48px;">🏆</div>
          <div class="hero-title" style="color:#39ff14;">¡ERRORES DEPURADOS!</div>
          <div style="color:rgba(255,255,255,0.7); margin-bottom:10px;">No quedan casos pendientes de repaso por hoy. Los que aún están en maestría volverán cuando les toque.</div>
          <div style="color:var(--miami-cyan); font-weight:700; margin-bottom:20px;">¡Excelente trabajo clínico!</div>
          <div style="display:grid; gap:10px;">
            <button class="btn-action" id="btnSuccessMenu">Volver al Menú</button>
          </div>
        </div>
      </div>
    `;
    $("#btnSuccessMenu").onclick = () => {
      modal.innerHTML = "";
      ScreenManager.showMenu();
    };
  }

  // Si el banco no carga, la guardia sigue con el generador; en cada turno
  // se vuelve a intentar, así que en cuanto vuelve la red regresan los casos
  // reales (antes el fallo se quedaba pegado toda la sesión).
  async function ensureCasesLoaded() {
    if (state.casesReady) return true;
    try {
      await CaseDB.init();
      state.casesReady = true;
      pruneFailedCases();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async function startTurn(studyMode = false, reviewMode = false) {
    state.runId++;
    stopTurnFx();
    PsyBoot.inShift = true;
    state.studyMode = studyMode;
    state.reviewMode = reviewMode;
    ensureAudio();
    if (state.soundEnabled) playTone(520, 0.08);

    // Reset state
    state.lives = studyMode ? 999 : GAME_CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.recentCases = [];
    state.recentFeedbackTimer = null;
    state.residentMood = "normal";
    state.bossMood = null;
    state.hintUsedInTurn = false;
    state.solvedCasesCount = 0;
    state.currentTaskIndex = 0;
    state.signed = false;
    state.lastReward = null;
    state.locked = false;
    state.caseHadError = false;
    state.decompensated = false;
    state.lastTurnSeconds = GAME_CONFIG.baseTurnSeconds;
    state.round = { answered: 0, correct: 0, coins: 0, cases: 0, index: 1 };
    state.shift = newShift();

    // Read filters — review mode ignores filters to avoid excluding valid failed cases
    if (reviewMode) {
      state.filters.educational_level = "";
      state.filters.difficulty = "";
    } else {
      // Si los selects no están en el DOM (ej. reinicio desde Game Over), conservar los filtros previos
      const selectLevel = $("#selectLevel");
      const selectDifficulty = $("#selectDifficulty");
      if (selectLevel) state.filters.educational_level = selectLevel.value;
      if (selectDifficulty) state.filters.difficulty = selectDifficulty.value;
    }

    $("#hudRoot").innerHTML = "";
    $("#modalRoot").innerHTML = "";
    await ensureCasesLoaded();
    await nextCase();

    // Animate entrance
    requestAnimationFrame(() => {
      $("#hudRoot").classList.remove("fade-out");
      $("#hudRoot").classList.add("slide-up", "screen-transition");
      $("#caseRoot").classList.add("slide-up", "screen-transition");
    });
  }

  function renderHUD() {
    const hud = $("#hudRoot");
    if (!hud) return;

    const untimed = isUntimed();
    const coins = Economy.getCoins();
    const costs = GAME_CONFIG.costs;
    const res = state.resident || ROSTER[0];

    // Vidas: los corazones se leen de un vistazo, pero sin número no se sabe
    // cuántas quedan cuando hay más de tres; el texto lo desambigua.
    const livesText = state.studyMode
      ? `<span class="hud-lives-icons">💖</span><span class="hud-lives-count">sin límite</span>`
      : `<span class="hud-lives-icons">${"💖".repeat(state.lives)}${"🖤".repeat(Math.max(0, GAME_CONFIG.maxLives - state.lives))}</span>` +
        `<span class="hud-lives-count">${state.lives} ${state.lives === 1 ? "vida" : "vidas"}</span>`;

    // El multiplicador que pagará el PRÓXIMO acierto: es el dato que importa
    // mientras decides, no el histórico de la racha ya cobrada.
    const nextMult = getStreakMultiplier(state.streak + 1);
    const multLabel = getMultiplierLabel(nextMult);
    const roundProgress = `${state.round.cases}/${GAME_CONFIG.casesPerRound}`;

    // El reloj entra como una cifra más del marcador en vez de reclamar su
    // propio bloque, y la barra se muda al borde superior de la tarjeta: ahí
    // se lee como el estado del turno y no cuesta un solo píxel de altura.
    const statCells = [];
    if (untimed) {
      statCells.push({
        label: state.studyMode ? "Modo" : "Lectura",
        value: state.studyMode ? "Estudio" : "Libre",
        cls: "hud-stat--free",
        title: "Este turno corre sin reloj"
      });
    } else {
      statCells.push({
        label: "Reloj",
        value: `${Math.ceil(state.timeLeft)}s`,
        cls: "hud-stat--timer",
        valueId: "tValue",
        title: "Segundos para decidir"
      });
    }
    statCells.push({
      label: "Racha",
      value: `${state.streak}<span class="hud-mult ${nextMult > 1 ? "hud-mult--on" : ""}">${formatMultiplier(nextMult)}</span>`,
      cls: nextMult > 1 ? "hud-stat--hot" : "",
      title: `Aciertos seguidos · mejor marca de la guardia: ${state.maxStreak}${multLabel ? " · " + multLabel : ""}`
    });
    if (!state.studyMode) {
      statCells.push({
        label: `Pase ${state.round.index}`,
        value: roundProgress,
        cls: "",
        title: `Cada ${GAME_CONFIG.casesPerRound} pacientes el Dr. Celada pasa lista y reparte bono`
      });
    }
    statCells.push({
      label: "Monedas",
      value: `🪙 ${coins}`,
      cls: "hud-stat--coins",
      title: `Para gastar en ayudas · rango ${Economy.getRank()}`
    });

    // La barra arranca donde va el reloj: repintar el HUD (comprar una pista,
    // silenciar el sonido) ya no la devuelve al 100 % durante un instante.
    const timePct = state.turnSeconds
      ? Math.max(0, Math.min(100, (state.timeLeft / state.turnSeconds) * 100))
      : 100;

    const statsHtml = statCells.map(cell => `
      <div class="hud-stat ${cell.cls}" title="${escapeHtml(cell.title)}">
        <span class="hud-stat-label">${escapeHtml(cell.label)}</span>
        <span class="hud-stat-value"${cell.valueId ? ` id="${cell.valueId}"` : ""}>${cell.value}</span>
      </div>`).join("");

    // Cada ayuda dice qué hace y por qué está bloqueada. Un botón apagado con
    // sólo un emoji y un número no explica nada al que lo necesita.
    // Con la pregunta ya decidida ninguna ayuda sirve: se bloquean todas.
    const lockedReason = state.locked ? "La decisión ya está tomada" : "";
    const helpers = [
      {
        id: "btnHint", icon: "💡", label: "Pista", cost: costs.hint,
        desc: "Descarta una opción incorrecta",
        blocked: lockedReason || (state.hintUsedInTurn ? "Ya usaste la pista en esta pregunta" : ""),
        blockedShort: state.locked ? "Decidido" : "Ya usada"
      },
      // En modo estudio no hay vidas ni reloj que comprar: los botones sólo
      // ocupaban sitio con un "Al máximo" que no significaba nada.
      ...(state.studyMode ? [] : [
        {
          id: "btnBuyLife", icon: "❤️", label: "Vida", cost: costs.life,
          desc: "Recupera una vida perdida",
          blocked: state.lives >= GAME_CONFIG.maxLives ? "Ya tienes todas tus vidas" : "",
          blockedShort: "Al máximo"
        },
        {
          id: "btnBuyTime", icon: "⏱️", label: `+${GAME_CONFIG.timeBoostSeconds}s`, cost: costs.time,
          desc: `Suma ${GAME_CONFIG.timeBoostSeconds} segundos al reloj`,
          blocked: untimed ? "Este caso no tiene reloj" : lockedReason,
          blockedShort: untimed ? "Sin reloj" : "Decidido"
        }
      ])
    ];

    const helperButtons = helpers.map(h => {
      const poor = !h.blocked && coins < h.cost;
      const reason = h.blocked || (poor ? `Te faltan ${h.cost - coins} monedas` : h.desc);
      // El segundo renglón es el precio mientras la ayuda sirva; si no,
      // pasa a decir por qué no, que es lo único útil en ese momento.
      const detail = h.blocked
        ? `<span class="btn-help-cost btn-help-cost--reason">${escapeHtml(h.blockedShort)}</span>`
        : `<span class="btn-help-cost ${poor ? "btn-help-cost--short" : ""}">🪙 ${h.cost}</span>`;
      return `
        <button class="btn-help" id="${h.id}" ${h.blocked || poor ? "disabled" : ""}
                title="${escapeHtml(reason)}" aria-label="${escapeHtml(`${h.label}: ${reason}`)}">
          <span class="btn-help-icon" aria-hidden="true">${h.icon}</span>
          <span class="btn-help-text">
            <span class="btn-help-label">${h.label}</span>
            ${detail}
          </span>
        </button>`;
    }).join("");

    hud.innerHTML = `
      <div class="miami-card hud-card">
        ${untimed ? "" : `
        <div class="hud-progress ${state.timeLeft <= 5 && !state.locked ? "hud-progress--danger" : ""}" role="progressbar" aria-label="Tiempo restante">
          <div class="hud-progress-bar" id="tBar" style="width:${timePct}%"></div>
        </div>`}
        <div class="hudRow">
          <div class="hudBox">
            <div class="avatar" id="resBox">${Avatars.resident(res.name, state.residentMood)}</div>
            <div class="hud-person">
              <div class="hud-person-role">Residente</div>
              <div class="hud-person-name">${escapeHtml(res.title)} ${escapeHtml(res.name)}</div>
              <div class="hud-lives" aria-label="${escapeHtml(state.studyMode ? "Vidas ilimitadas" : `${state.lives} vidas`)}">${livesText}</div>
            </div>
          </div>

          <div class="hudBox hudBox--right">
            <div class="hud-person hud-person--right">
              <div class="hud-person-role">Adscrito</div>
              <div class="hud-person-name">Dr. Celada</div>
              <div class="hud-boss-status">${getBossStatus()}</div>
            </div>
            <div class="avatar" id="bossBox">${Avatars.boss(state.bossMood || getBossState().mood)}</div>
          </div>
        </div>

        <div class="hud-stats">${statsHtml}</div>

        <div class="hud-actions">
          <div class="hud-help-group" role="group" aria-label="Ayudas de pago">
            ${helperButtons}
          </div>
          <div class="hud-tool-group" role="group" aria-label="Ajustes de la partida">
            <button class="btn-tool" id="btnSoundToggle"
                    aria-pressed="${state.soundEnabled}"
                    aria-label="${state.soundEnabled ? "Sonido activado. Silenciar" : "Sonido silenciado. Activar"}"
                    title="${state.soundEnabled ? "Silenciar sonido" : "Activar sonido"}">
              <span aria-hidden="true">${state.soundEnabled ? "🔊" : "🔇"}</span>
            </button>
            <button class="btn-tool" id="btnAutoToggle"
                    aria-pressed="${state.autoAdvance}"
                    aria-label="${state.autoAdvance ? "Avance automático activado. Pasar a manual" : "Avance manual. Activar automático"}"
                    title="${state.autoAdvance ? "El caso avanza solo tras la retroalimentación" : "Tú decides cuándo avanzar"}">
              <span aria-hidden="true">${state.autoAdvance ? "▶️" : "⏸️"}</span>
            </button>
            <button class="btn-tool btn-tool--exit" id="btnMenuFromGame"
                    aria-label="Salir al menú principal" title="Salir al menú principal">
              <span aria-hidden="true">🏠</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const hintBtn = $("#btnHint");
    if (hintBtn) hintBtn.onclick = () => useHint();

    const lifeBtn = $("#btnBuyLife");
    if (lifeBtn) lifeBtn.onclick = () => buyLife();

    const timeBtn = $("#btnBuyTime");
    if (timeBtn) timeBtn.onclick = () => buyTime();

    const soundBtn = $("#btnSoundToggle");
    if (soundBtn) {
      soundBtn.onclick = () => {
        state.soundEnabled = !state.soundEnabled;
        SafeStore.set('psy_pref_sound', state.soundEnabled);
        renderHUD();
        playTone(660, 0.05);
      };
    }

    const autoBtn = $("#btnAutoToggle");
    if (autoBtn) {
      autoBtn.onclick = () => {
        state.autoAdvance = !state.autoAdvance;
        SafeStore.set('psy_pref_autoadvance', state.autoAdvance);
        renderHUD();
        playTone(660, 0.05);
      };
    }

    const menuBtn = $("#btnMenuFromGame");
    if (menuBtn) {
      menuBtn.onclick = () => ScreenManager.showMenu();
    }
  }

  function useHint() {
    if (state.locked || state.hintUsedInTurn) return;
    const distractors = document.querySelectorAll('.option-btn[data-ok="0"]:not(.hint-used)');
    // Cobrar sólo si de verdad hay algo que descartar.
    if (!distractors.length || !Economy.spend(GAME_CONFIG.costs.hint)) return;
    state.hintUsedInTurn = true;

    const target = distractors[Math.floor(Math.random() * distractors.length)];
    target.classList.add("hint-used");
    target.disabled = true;
    target.setAttribute("aria-label", "Descartada por la pista");
    playTone(600, 0.05);
    renderHUD(); // Update buttons and coins
  }

  function buyLife() {
    if (state.studyMode || state.lives >= GAME_CONFIG.maxLives || !Economy.spend(GAME_CONFIG.costs.life)) return;
    state.lives++;
    playTone(880, 0.1);
    renderHUD();
  }

  function buyTime() {
    if (state.locked || isUntimed() || !Economy.spend(GAME_CONFIG.costs.time)) return;
    // El tick recalcula timeLeft desde timerStart, así que sumar segundos al
    // marcador no servía de nada. Y topar la compra contra el reloj original
    // la volvía una estafa: en un turno de 34s ya empezado devolvía 3s.
    // Se alarga el turno completo: 30 segundos comprados son 30 segundos.
    state.turnSeconds += GAME_CONFIG.timeBoostSeconds;
    state.timeLeft = Math.max(0, state.turnSeconds - (Date.now() - state.timerStart) / 1000);
    playTone(880, 0.1);
    renderHUD();
  }

  function pickTask(caseObj, index = 0) {
    const t = (caseObj?.tasks && caseObj.tasks[index]) ? caseObj.tasks[index] : null;
    // Sin rationale por defecto: un texto genérico aquí taparía el del caso.
    const base = {
      instruction: "Analiza el caso y responde.",
      expected_answer: "Conducta adecuada",
      distractors: ["Opción A", "Opción B", "Opción C"]
    };
    
    if (!t) return base;

    // Consecuencias de Guardia (Branching Scenarios). La urgencia ya no se
    // concatena al enunciado: iba como texto plano dentro del párrafo de la
    // pregunta y se leía como parte del caso. Ahora renderCase la pinta como
    // alerta propia y aquí sólo se marca.
    return { ...base, ...t, question: t.question || "", urgent: state.decompensated && index > 0 };
  }

  function getPatientEcgClass(c) {
    if (!c) return "normal";
    if (c.case_type === "documento_educativo") return "flat"; // Documentos teóricos = línea plana tranquila (no animada)
    if (state.decompensated) return "tachy"; // Si está descompensado por error previo, taquicardia inmediata!
    
    const id = String(c.case_id || "").toUpperCase();
    const title = String(c.title || c.display_title || "").toUpperCase();
    const type = String(c.type || "").toUpperCase();
    const text = String(c.source_chunks?.[0]?.text_content || "").toUpperCase();

    const tachyKeywords = ["MANIA", "PANIC", "PÁNICO", "COCA", "ABSTINENCIA", "AGITAC", "SUICID", "SUI", "TAQUICARDIA", "MANÍA"];
    const bradyKeywords = ["ANOREXIA", "DEMENC", "HIPOACTIVO", "ESTUPOR", "BRADICARDIA", "ANOREXICA", "ANORÉXICA"];

    if (tachyKeywords.some(kw => id.includes(kw) || title.includes(kw) || type.includes(kw) || text.includes(kw))) {
      return "tachy";
    }
    if (bradyKeywords.some(kw => id.includes(kw) || title.includes(kw) || type.includes(kw) || text.includes(kw))) {
      return "brady";
    }
    return "normal";
  }

  function renderCase() {
    const root = $("#caseRoot");
    if (!root || !state.current) return;

    // Animation reset for new case
    root.classList.remove("slide-up", "screen-transition");
    void root.offsetWidth; // trigger reflow
    root.classList.add("slide-up", "screen-transition");

    const c = state.current;
    const sources = Array.isArray(c.source_chunks) ? c.source_chunks : [];
    const text = sources.map(x => normalizeCaseText(x.text_content)).filter(Boolean).join("\n\n");
    const task = pickTask(c, state.currentTaskIndex);
    const bodyText = text || task.instruction;
    const { summary, details } = splitCaseText(bodyText);
    const questionText = normalizeCaseText(task.question || task.instruction);
    const consequenceText = state.streak >= 3 && !state.studyMode ? NARRATIVE.consequence : "";
    // "Basado en el texto…" con la historia plegada obligaba a responder a
    // ciegas: si la pregunta alude al texto, la historia se abre sola.
    const refersToText = /\b(texto|lectura|fragmento)\b/i.test(questionText);

    const options = [
      { t: task.expected_answer, ok: true },
      ...(Array.isArray(task.distractors) ? task.distractors : []).map(d => ({ t: d, ok: false }))
    ];
    // Fisher–Yates: barajado uniforme (sort(random-0.5) sesga la posición de la correcta)
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Badge: número de paciente y, si el caso tiene varias, de pregunta.
    const tasksCount = c.tasks ? c.tasks.length : 1;
    let progressBadge = "";
    if (c.case_type === "documento_educativo") {
      progressBadge = "Lectura Didáctica";
    } else {
      progressBadge = `Caso ${state.solvedCasesCount + 1}` +
        (tasksCount > 1 ? ` · ${state.currentTaskIndex + 1}/${tasksCount}` : "");
    }
    // Transparencia: avisar cuando el caso no proviene del banco clínico real
    const isSynthetic = c.metadata?.is_real_data === false || String(c.case_id || "").startsWith("MODULAR_");
    if (isSynthetic) progressBadge += " · Sintético";

    const ecgClass = getPatientEcgClass(c);
    const ecgSvg = `
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" class="ecg-svg" aria-hidden="true">
        <path d="M 0 15 L 30 15 L 35 12 L 40 18 L 45 15 L 48 5 L 52 28 L 56 15 L 60 17 L 65 15 L 100 15"
              pathLength="100" vector-effect="non-scaling-stroke"
              class="ecg-line ecg-${ecgClass}"></path>
      </svg>
    `;

    // El residente presenta el caso (solo en la primera tarea, no en documentos didácticos).
    // Si el paciente se descompensó por la respuesta anterior, habla en todas
    // las tareas: es la voz que anuncia la consecuencia.
    const res = state.resident || ROSTER[0];
    const isUrgent = !!task.urgent;
    // La apuesta sólo existe donde hay algo en juego: nada de firmar notas en
    // modo estudio ni en una lectura didáctica.
    const canSign = !state.studyMode && c.case_type !== "documento_educativo";
    if (!canSign) state.signed = false;
    let presentLine = "";
    if (isUrgent) {
      presentLine = pickLine("decompensated");
    } else if (state.currentTaskIndex === 0 && c.case_type !== "documento_educativo") {
      presentLine = getResidentPresentLine(ecgClass);
    }

    root.innerHTML = `
      <div class="miami-card case-card ${isUrgent ? "case-card--critical" : ""}">
        <div class="caseHeader">
          ${Avatars.patient(c.case_id, ecgClass)}
          <div class="caseHeader-main">
            <div class="caseTitle">${escapeHtml(getCaseTitle(c))}</div>
            <div class="caseHeader-meta">
              ${ecgSvg}
              <div class="caseBadge">${escapeHtml(progressBadge)}</div>
            </div>
          </div>
        </div>
        ${isUrgent ? `
          <div class="case-alert" role="alert">
            <span class="case-alert-icon" aria-hidden="true">🚨</span>
            <span class="case-alert-text">
              <strong>El paciente se descompensó</strong>
              Tu conducta anterior lo empeoró. Esta decisión es de rescate.
            </span>
          </div>` : ""}
        
        <details class="caseDetails" ${refersToText ? "open" : ""}>
          <summary>📋 Ver Historia Clínica</summary>
          <div class="caseBody" style="margin-top: 12px;">
            ${escapeHtml(summary)}
            ${details ? `<br><br>${escapeHtml(details)}` : ""}
          </div>
        </details>

        ${presentLine ? `<div class="residentQuote">💬 <strong>${escapeHtml(res.title)} ${escapeHtml(res.name)}:</strong> “${escapeHtml(presentLine)}”</div>` : ""}
        ${consequenceText ? `<div class="caseAside">${escapeHtml(consequenceText)}</div>` : ""}
      </div>
      
      ${questionText ? `<div class="caseQuestion">${escapeHtml(questionText)}</div>` : ""}
      ${canSign ? `
        <button class="sign-toggle ${state.signed ? "sign-toggle--on" : ""}" id="btnSignNote"
                aria-pressed="${state.signed}"
                title="Comprometes tu firma: doble recompensa si aciertas, multa de ${GAME_CONFIG.signFine} monedas si no">
          <span class="sign-toggle-icon" aria-hidden="true">✍️</span>
          <span class="sign-toggle-text">
            <span class="sign-toggle-title">${state.signed ? "Nota firmada" : "Firmar la nota"}</span>
            <span class="sign-toggle-desc">×2 si aciertas · −${GAME_CONFIG.signFine} 🪙 si fallas</span>
          </span>
          <span class="sign-toggle-state">${state.signed ? "ACTIVA" : "OFF"}</span>
        </button>` : ""}
      <div class="options ${state.signed ? "options--signed" : ""}">
        ${options.map((o, idx) => `
          <button class="option-btn stagger-in" data-ok="${o.ok ? "1" : "0"}" data-index="${idx + 1}" style="--stagger-order: ${idx}">
            <span class="option-index">${idx + 1}</span>
            <span class="option-text">${escapeHtml(String(o.t))}</span>
          </button>
        `).join("")}
      </div>
      <div class="options-hint">Atajos: 1-${options.length}${canSign ? " · F firma" : ""} · Enter avanza</div>
    `;

    root.querySelectorAll(".option-btn").forEach(btn => {
      btn.onclick = () => checkAnswer(btn, btn.dataset.ok === "1", task);
    });

    const signBtn = $("#btnSignNote");
    if (signBtn) signBtn.onclick = () => toggleSign();
  }

  // Alterna la firma sin repintar el caso: un re-render volvería a barajar las
  // opciones y regalaría información al que firma y desfirma.
  function toggleSign() {
    const btn = $("#btnSignNote");
    if (!btn || btn.disabled) return;
    state.signed = !state.signed;
    btn.classList.toggle("sign-toggle--on", state.signed);
    btn.setAttribute("aria-pressed", String(state.signed));
    const title = btn.querySelector(".sign-toggle-title");
    if (title) title.textContent = state.signed ? "Nota firmada" : "Firmar la nota";
    const flag = btn.querySelector(".sign-toggle-state");
    if (flag) flag.textContent = state.signed ? "ACTIVA" : "OFF";
    const opts = document.querySelector(".options");
    if (opts) opts.classList.toggle("options--signed", state.signed);
    if (state.soundEnabled) playTone(state.signed ? 740 : 420, 0.07);
  }

  // Arranca una pregunta: desbloquea ayudas, pinta HUD y caso, y pone (o no)
  // el reloj. Antes este bloque estaba copiado en nextCase y advanceNext.
  function beginTask() {
    state.locked = false;
    state.hintUsedInTurn = false;
    if (isUntimed()) {
      clearInterval(state.timer);
      state.timeLeft = state.turnSeconds;
    } else {
      prepareTimer();
    }
    renderHUD();
    renderCase();
    if (isUntimed()) {
      setUrgency(false, false);
    } else {
      startTimer();
    }
  }

  // Calcula la duración del turno antes de pintar el HUD, para que la cifra
  // del reloj salga bien desde el primer fotograma.
  function prepareTimer() {
    // Dificultad logarítmica: cada acierto seguido recorta el reloj un poco menos.
    const reduction = Math.floor(Math.log2(state.streak + 1) * GAME_CONFIG.difficultyScale);
    state.turnSeconds = Math.max(GAME_CONFIG.minTurnSeconds, GAME_CONFIG.baseTurnSeconds - reduction);
    state.timeLeft = state.turnSeconds;
  }

  function startTimer() {
    clearInterval(state.timer);

    // La presión de la racha era invisible: el reloj se acortaba sin que nadie
    // lo dijera. Se anuncia cuando el recorte acumulado llega a 3 s (avisar de
    // cada segundo era ruido); si la racha se rompe, el reloj vuelve a crecer
    // y la cuenta se reinicia en silencio.
    if (state.turnSeconds > state.lastTurnSeconds) {
      state.lastTurnSeconds = state.turnSeconds;
    } else if (state.lastTurnSeconds - state.turnSeconds >= 3) {
      floatReward(`⏱️ ${state.turnSeconds}s · la racha aprieta`, "clock");
      state.lastTurnSeconds = state.turnSeconds;
    }

    state.timeLeft = state.turnSeconds;
    state.timerStart = Date.now();
    state.residentWorried = false;

    state.timer = setInterval(() => {
      const elapsed = (Date.now() - state.timerStart) / 1000;
      state.timeLeft = Math.max(0, state.turnSeconds - elapsed);
      const pct = Math.min(100, (state.timeLeft / state.turnSeconds) * 100);

      const b = $("#tBar");
      if (b) b.style.width = pct + "%";

      const value = $("#tValue");
      if (value) value.textContent = `${Math.ceil(state.timeLeft)}s`;

      // Zona caliente (< 20 %) y crítica (≤ 5 s): sólo cambian clases; la capa
      // .urgency-fx hace el resto con opacidad, sin repintar la página.
      const isHot = pct <= 20;
      const isCritical = state.timeLeft <= 5;
      setUrgency(isHot, isCritical);

      // El residente se pone nervioso al entrar en la zona caliente y se
      // recompone si compras tiempo. Sólo se escribe en la transición: el
      // tick corre diez veces por segundo.
      if (isHot !== state.residentWorried) {
        state.residentWorried = isHot;
        state.residentMood = isHot ? "worried" : "speaking";
        Avatars.setMood($("#resBox"), state.residentMood);
      }

      const track = b ? b.parentElement : null;
      if (track) track.classList.toggle("hud-progress--danger", isCritical);

      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        setUrgency(false, false);
        resolveTimeout();
      }
    }, 100);
  }

  // Agotar el reloj cuenta como decisión fallida y sigue el mismo camino que
  // un error: si al caso le quedan preguntas, el paciente se descompensa y la
  // guardia continúa con ellas. Antes saltaba al caso siguiente, descartaba
  // las tareas pendientes, no contaba al paciente y auto-avanzaba siempre,
  // aunque el jugador hubiera elegido avance manual.
  function resolveTimeout() {
    if (state.locked) return;
    state.locked = true;
    const task = pickTask(state.current, state.currentTaskIndex);

    if (!state.studyMode) {
      state.lives -= 1;
      state.streak = 0;
      state.round.answered++;
      state.shift.answered++;
      Economy.recordAnswer({ correct: false });
    }
    state.signed = false;
    state.lastReward = null;
    state.caseHadError = true;
    state.justRescued = false;
    saveFailedCase(state.current?.case_id);
    recordMistake(task, true);
    if (hasMoreTasks()) state.decompensated = true;

    // No decidir no es equivocarse: el residente se queda preocupado, no en
    // shock, y el adscrito no se enoja por una decisión concreta.
    state.residentMood = "worried";
    state.residentWorried = true;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.dataset.ok === "1") b.classList.add("correct");
    });
    const signBtn = $("#btnSignNote");
    if (signBtn) signBtn.disabled = true;

    if (state.soundEnabled) playSequence([440, 349, 262], 0.1, 0.18);
    renderHUD();
    showTimeoutFeedback(task);
  }

  function hasMoreTasks() {
    const tasks = state.current?.tasks;
    return Array.isArray(tasks) && state.currentTaskIndex + 1 < tasks.length;
  }

  // Lo que se lista en el Game Over como "Para repasar".
  function recordMistake(task, timeout = false) {
    if (state.studyMode) return;
    state.shift.mistakes.push({
      title: getCaseTitle(state.current),
      answer: String(task?.expected_answer || ""),
      takeHome: String(state.current?.explanation?.take_home || ""),
      timeout
    });
  }

  async function nextCase() {
    if (state.lives <= 0) return handleDeath();

    clearTimeout(state.recentFeedbackTimer);
    const overlay = $("#modalRoot");
    if (overlay) overlay.innerHTML = "";

    state.resident = pickResident();
    // El residente entra presentando el caso, así que la pose es la de hablar:
    // el retrato acompaña a la frase que aparece justo debajo.
    state.residentMood = "speaking";
    state.bossMood = null; // vuelve al estado derivado de vidas y racha
    state.justRescued = false;
    state.currentTaskIndex = 0;
    state.decompensated = false;
    state.caseHadError = false;

    const run = state.runId;
    await ensureCasesLoaded();

    if (state.reviewMode) {
      const activeFailed = getDueFailedCases();
      if (!activeFailed.length) {
        showReviewSuccess();
        return;
      }
      state.failedCaseIds = activeFailed.map(item => item.caseId);
    }

    try {
      if (!state.casesReady) throw new Error("Banco de casos no disponible");
      const queryFilters = {
        excludeCaseIds: state.reviewMode ? [] : state.recentCases,
        ...state.filters
      };
      if (state.reviewMode) {
        queryFilters.includeCaseIds = state.failedCaseIds;
      }
      state.current = await CaseDB.pickRandomCase(queryFilters);
    } catch (err) {
      if (state.reviewMode) {
        showReviewSuccess();
        return;
      }
      try {
        // Pool agotado por las exclusiones recientes: reintentar permitiendo repetir.
        if (!state.casesReady) throw err;
        state.current = await CaseDB.pickRandomCase({ ...state.filters });
        state.recentCases = [];
      } catch (err2) {
        // Ni un caso real disponible: el generador cubre SOLO este turno.
        console.warn("Sin casos reales disponibles, generando caso sintético:", err2);
        state.current = Generator.createCase(state.filters);
      }
    }

    // Mientras se cargaba un pack el jugador pudo salir al menú.
    if (run !== state.runId) return;

    if (state.current?.case_id) {
      state.recentCases.unshift(state.current.case_id);
      if (state.recentCases.length > 30) state.recentCases.length = 30;
    }

    beginTask();
  }

  async function advanceNext() {
    if (state.lives <= 0) return handleDeath();

    if (hasMoreTasks()) {
      state.currentTaskIndex++;
      beginTask();
      return;
    }

    state.solvedCasesCount++;
    state.round.cases++;
    state.shift.cases++;
    // Cada bloque de pacientes cierra con el pase de visita del adscrito:
    // la guardia deja de ser una fila infinita de preguntas y adquiere ritmo.
    if (!state.studyMode && state.round.cases >= GAME_CONFIG.casesPerRound) {
      showRoundReview();
      return;
    }
    await nextCase();
  }

  // Pase de visita: el Dr. Celada evalúa el bloque, paga bono y, si fue
  // impecable, devuelve una vida. Es el único momento en que se recupera vida
  // sin pasar por la caja.
  function showRoundReview() {
    stopTurnFx();

    const r = state.round;
    const answered = Math.max(1, r.answered);
    const ratio = Math.min(1, r.correct / answered);
    const tier = BOSS_ROUNDS.find(t => ratio >= t.min) || BOSS_ROUNDS[BOSS_ROUNDS.length - 1];
    const perfect = r.answered > 0 && r.correct === r.answered;
    const line = tier.lines[Math.floor(Math.random() * tier.lines.length)];

    const bonus = tier.bonus;
    if (bonus > 0) Economy.add(bonus, Math.round(bonus / 2));
    const healed = !!tier.heal && state.lives < GAME_CONFIG.maxLives;
    if (healed) state.lives++;
    Economy.recordRound(perfect);

    if (state.soundEnabled) {
      if (tier.tone === "perfect") playSequence([523, 659, 784, 1046, 1319], 0.09, 0.18);
      else if (tier.tone === "good") playSequence([523, 659, 784], 0.09, 0.16);
      else if (tier.tone === "bad") playSequence([392, 311, 233], 0.11, 0.22);
      else playSequence([440, 523], 0.1, 0.16);
    }

    const modal = $("#modalRoot");
    modal.innerHTML = `
      <div class="modal">
        <div class="modalCard round-card round-card--${tier.tone}">
          <div class="round-head">
            <div class="avatar">${Avatars.boss(tier.mood)}</div>
            <div class="round-head-text">
              <div class="hud-person-role">Pase de visita · bloque ${r.index}</div>
              <div class="round-title">${escapeHtml(tier.label)}</div>
            </div>
          </div>

          <div class="round-quote">“${escapeHtml(line)}”</div>

          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-value">${r.correct}/${r.answered}</div>
              <div class="stat-label">Aciertos</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${Math.round(ratio * 100)}%</div>
              <div class="stat-label">Precisión</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${r.coins}</div>
              <div class="stat-label">🪙 del bloque</div>
            </div>
          </div>

          <div class="round-bonus ${bonus > 0 ? "" : "round-bonus--none"}">
            ${bonus > 0
              ? `Bono del adscrito: <strong>+${bonus} 🪙</strong>`
              : "Sin bono este bloque. El siguiente se gana en la sala."}
          </div>
          ${healed ? `<div class="round-bonus round-bonus--heal">💖 <strong>Recuperas una vida.</strong></div>` : ""}

          <button class="btn-action" id="btnRoundContinue" style="margin-top:16px;">Continuar la guardia</button>
        </div>
      </div>
    `;

    pushAchievements();

    const continueBtn = $("#btnRoundContinue");
    try { continueBtn.focus({ preventScroll: true }); } catch { /* navegadores viejos */ }
    continueBtn.onclick = () => {
      if (continueBtn.disabled) return; // Enter repetido no abre dos bloques
      continueBtn.disabled = true;
      modal.innerHTML = "";
      state.round = { answered: 0, correct: 0, coins: 0, cases: 0, index: r.index + 1 };
      nextCase();
    };
  }

  // Botones "Siguiente" / "Ver explicación" y auto-avance, comunes al
  // feedback de respuesta y al de tiempo agotado.
  function bindFeedbackControls(root) {
    const timerBar = $("#feedbackTimerBar");
    const panel = root.querySelector(".feedback-overlay");
    let done = false;

    // Un solo avance por panel: Enter repetido o doble toque saltaban una
    // pregunta entera.
    const advance = () => {
      if (done) return;
      done = true;
      clearTimeout(state.recentFeedbackTimer);
      if (panel) panel.classList.add("leaving");
      later(() => {
        root.innerHTML = "";
        advanceNext();
      }, 180);
    };

    const useAutoAdvance = state.autoAdvance && !isUntimed();
    if (timerBar) {
      if (useAutoAdvance) timerBar.style.setProperty("--advance-ms", `${GAME_CONFIG.advanceDelayMs}ms`);
      else timerBar.style.display = "none";
    }

    const nextBtn = $("#btnNextFeedback");
    nextBtn.onclick = advance;
    // Foco al botón principal: teclado y lector de pantalla llegan directo.
    try { nextBtn.focus({ preventScroll: true }); } catch { /* navegadores viejos */ }

    const showMoreBtn = $("#btnShowMoreFeedback");
    if (showMoreBtn) {
      showMoreBtn.onclick = (e) => {
        e.stopPropagation();
        // Leer la explicación detiene el auto-avance: nadie lee con prisa.
        clearTimeout(state.recentFeedbackTimer);
        if (timerBar) timerBar.style.display = "none";
        $("#expandedFeedback").hidden = false;
        showMoreBtn.remove();
      };
    }

    if (useAutoAdvance) {
      state.recentFeedbackTimer = later(advance, GAME_CONFIG.advanceDelayMs);
    }
  }

  // Bloque desplegable común: rationale completo, take-home y "¿por qué no?".
  function renderExpandedFeedback(details, whyNotList) {
    return `
      <div id="expandedFeedback" hidden>
        ${details.rationale && details.rationale !== details.reason ? `<div class="modalFeedback feedback-rationale">${escapeHtml(details.rationale)}</div>` : ""}
        ${details.takeHome ? `<div class="feedback-take-home">💡 Para recordar: ${escapeHtml(details.takeHome)}</div>` : ""}
        ${whyNotList.length ? `
          <div class="feedback-why-not">
            <div class="modalSectionTitle feedback-why-not-title">¿Por qué otras opciones no?</div>
            ${whyNotList.map(w => `
              <div class="feedback-why-not-item">
                <strong>${escapeHtml(w.option)}</strong>: ${escapeHtml(w.reason)}
              </div>
            `).join("")}
          </div>
        ` : ""}
      </div>`;
  }

  function showSmartFeedback(ok, task, selectedText) {
    const root = $("#modalRoot");
    const brief = getBriefFeedback(state.current, task);
    const details = getExplanationPayload(state.current, task, selectedText, ok);
    const whyNotList = getWhyNotForTask(state.current, task);
    const hasMore = (details.rationale && details.rationale !== details.reason) || details.takeHome || whyNotList.length;

    // Reacción del residente al resultado (racha alta tiene frases propias).
    // Un rescate tiene voz propia: no es un acierto más.
    const res = state.resident || ROSTER[0];
    const rw = state.lastReward;
    const wasSigned = !!(rw && rw.signed);
    const reactLine = state.justRescued
      ? pickLine("rescued")
      : (wasSigned
        ? pickLine(ok ? "okSigned" : "errorSigned")
        : pickLine(ok ? (state.streak >= 3 ? "okStreak" : "ok") : "error"));

    // Desglose de lo que acabas de cobrar (o pagar). Sin esto el multiplicador
    // y el bono de rapidez serían números invisibles en un contador.
    let rewardStrip = "";
    if (rw && (rw.coins > 0 || rw.fine > 0)) {
      const parts = [];
      if (rw.coins > 0) {
        parts.push(`<span class="reward-chip">+${rw.base} base</span>`);
        if (rw.speed > 0) {
          parts.push(`<span class="reward-chip ${rw.fast ? "reward-chip--fast" : ""}">+${rw.speed} rapidez</span>`);
        }
        if (rw.mult > 1) parts.push(`<span class="reward-chip reward-chip--mult">${formatMultiplier(rw.mult)} racha</span>`);
        if (rw.signed) parts.push(`<span class="reward-chip reward-chip--sign">×2 firma</span>`);
      }
      if (rw.fine > 0) parts.push(`<span class="reward-chip reward-chip--fine">multa por firmar</span>`);
      const total = rw.coins > 0 ? `+${rw.coins} 🪙` : `−${rw.fine} 🪙`;
      rewardStrip = `
        <div class="reward-strip">
          <div class="reward-total ${rw.coins > 0 ? "" : "reward-total--bad"}">${total}</div>
          <div class="reward-parts">${parts.join("")}</div>
        </div>`;
    }

    // Consecuencia visible del error: el jugador tiene que ver que el paciente
    // empeoró, no descubrirlo en la siguiente pregunta.
    const consequenceNote = consequenceHtml();

    let headerIcon = "⚠️";
    let headerText = "ERROR CLÍNICO";
    if (state.justRescued) { headerIcon = "💚"; headerText = "RESCATE LOGRADO"; }
    else if (ok && wasSigned) { headerIcon = "✍️"; headerText = "NOTA FIRMADA"; }
    else if (ok && rw && rw.fast) { headerIcon = "⚡"; headerText = "REFLEJO CLÍNICO"; }
    else if (ok) { headerIcon = "💎"; headerText = "EXCELENTE"; }
    else if (wasSigned) { headerIcon = "🖊️"; headerText = "NOTA FIRMADA… Y ERRADA"; }

    const tone = ok ? "good" : "bad";
    root.innerHTML = `
      <div class="feedback-overlay feedback-overlay--${tone} show" role="status" aria-live="assertive">
        <div class="feedback-header">
          <div class="feedback-icon" aria-hidden="true">${headerIcon}</div>
          <div class="feedback-status feedback-status--${tone}">${headerText}</div>
        </div>
        ${consequenceNote}
        ${rewardStrip}
        ${reactLine ? `<div class="feedback-resident">${escapeHtml(res.title)} ${escapeHtml(res.name)}: “${escapeHtml(reactLine)}”</div>` : ""}
        <div class="modalFeedback feedback-reason">${escapeHtml(details.reason || brief)}</div>
        ${renderExpandedFeedback(details, whyNotList)}

        <div class="feedback-controls" id="feedbackControls">
          ${hasMore ? `<button class="btn-powerup" id="btnShowMoreFeedback">📖 Ver explicación</button>` : ""}
          <button class="btn-powerup btn-powerup--primary" id="btnNextFeedback">${nextLabel()}</button>
        </div>

        <div class="feedback-timer-bar feedback-timer-bar--${tone} animate-timer" id="feedbackTimerBar"></div>
      </div>
    `;

    bindFeedbackControls(root);
  }

  function consequenceHtml() {
    if (state.decompensated) {
      return `<div class="feedback-consequence">🚨 <strong>El paciente se descompensó.</strong> La siguiente decisión es de rescate.</div>`;
    }
    if (state.justRescued) {
      return `<div class="feedback-consequence feedback-consequence--good">💚 <strong>Paciente estabilizado.</strong> Lo sacaste de la descompensación.</div>`;
    }
    return "";
  }

  // El botón dice adónde lleva: otra pregunta del mismo paciente, el pase de
  // visita, el final de la guardia o el siguiente paciente.
  function nextLabel() {
    if (state.lives <= 0) return "Cerrar la guardia";
    if (hasMoreTasks()) return "Siguiente pregunta";
    if (!state.studyMode && state.round.cases + 1 >= GAME_CONFIG.casesPerRound) return "Pase de visita";
    return "Siguiente paciente";
  }

  function showTimeoutFeedback(task) {
    const root = $("#modalRoot");
    const brief = getBriefFeedback(state.current, task);
    const details = getExplanationPayload(state.current, task, "", true);
    const whyNotList = getWhyNotForTask(state.current, task);
    const hasMore = (details.rationale && details.rationale !== brief) || details.takeHome || whyNotList.length;

    const res = state.resident || ROSTER[0];
    const timeoutLine = pickLine("timeout");

    root.innerHTML = `
      <div class="feedback-overlay feedback-overlay--timeout show" role="status" aria-live="assertive">
        <div class="feedback-header">
          <div class="feedback-icon" aria-hidden="true">⏰</div>
          <div class="feedback-status feedback-status--timeout">TIEMPO AGOTADO</div>
        </div>
        ${consequenceHtml()}
        ${timeoutLine ? `<div class="feedback-resident">${escapeHtml(res.title)} ${escapeHtml(res.name)}: “${escapeHtml(timeoutLine)}”</div>` : ""}
        <div class="feedback-label">Respuesta correcta</div>
        <div class="modalFeedback feedback-answer">${escapeHtml(task.expected_answer)}</div>
        <div class="modalFeedback feedback-rationale">${escapeHtml(brief)}</div>
        ${renderExpandedFeedback({ ...details, reason: brief }, whyNotList)}

        <div class="feedback-controls" id="feedbackControls">
          ${hasMore ? `<button class="btn-powerup" id="btnShowMoreFeedback">📖 Ver explicación</button>` : ""}
          <button class="btn-powerup btn-powerup--primary" id="btnNextFeedback">${nextLabel()}</button>
        </div>

        <div class="feedback-timer-bar feedback-timer-bar--timeout animate-timer" id="feedbackTimerBar"></div>
      </div>
    `;

    bindFeedbackControls(root);
  }

  function handleDeath() {
    stopTurnFx();
    PsyBoot.inShift = false;
    if (state.soundEnabled) playTone(150, 0.4);
    later(() => renderGameOver(), 600);
  }

  function checkAnswer(btn, ok, task) {
    // Una sola respuesta por pregunta: una tecla y un toque en el mismo
    // instante ya no pueden puntuar dos veces.
    if (state.locked) return;
    state.locked = true;
    clearInterval(state.timer);
    setUrgency(false, false);
    document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
    const signBtn = $("#btnSignNote");
    if (signBtn) signBtn.disabled = true;

    // Sólo puntúa lo que tiene consecuencias: el modo estudio y las lecturas
    // didácticas no mueven monedas, rachas ni estadísticas de carrera.
    const scores = !isUntimed();
    const signed = scores && state.signed;
    const speed = getSpeedInfo();
    const lastTask = !hasMoreTasks();
    state.lastReward = null;

    if (ok) {
      flashScreen(true);
      btn.classList.add("correct");
      const prevMult = getStreakMultiplier(state.streak);

      if (scores) {
        state.streak++;
        state.maxStreak = Math.max(state.maxStreak, state.streak);

        const mult = getStreakMultiplier(state.streak);
        const base = GAME_CONFIG.baseReward;
        let coins = Math.round((base + speed.coins) * mult);
        let xp = Math.round(GAME_CONFIG.baseXP * mult);
        if (signed) {
          coins *= 2;
          xp = Math.round(xp * 1.5);
        }
        Economy.add(coins, xp);

        state.lastReward = { base, speed: speed.coins, mult, signed, coins, xp, fine: 0, fast: speed.fast };
        state.round.answered++; state.round.correct++; state.round.coins += coins;
        state.shift.answered++; state.shift.correct++; state.shift.coins += coins;
        if (speed.fast) state.shift.fast++;
        if (signed) state.shift.signed++;

        floatReward(`+${coins} 🪙`, signed ? "signed" : "good");

        // El salto de multiplicador merece su propio momento; un acierto más
        // dentro del mismo escalón, no.
        if (mult > prevMult && mult > 1) {
          showComboBanner(mult);
          if (state.soundEnabled) playSequence([880, 1175, 1397, 1760], 0.075, 0.14);
        } else if (state.soundEnabled) {
          playSequence(signed ? [660, 988, 1319] : [660, 880, 1175], 0.06, 0.12);
        }
      } else if (state.soundEnabled) {
        playSequence([660, 880, 1175], 0.06, 0.12);
      }

      // En racha la cara acompaña a la frase.
      state.residentMood = state.streak >= 3 ? "streak" : "ok";

      // Repaso espaciado: sólo asciende un caso resuelto ENTERO sin fallos.
      // Antes, fallar la pregunta 1 y acertar la 2 lo guardaba y lo
      // ascendía en el mismo minuto, mandándolo a +24 h sin haberlo dominado.
      if (lastTask && !state.caseHadError) promoteFailedCase(state.current?.case_id);

      // Rescate: si el paciente venía descompensado, estabilizarlo es un
      // acontecimiento y se anuncia, no un flag que se apaga en silencio.
      state.justRescued = state.decompensated;
      state.decompensated = false;
      if (state.justRescued && state.soundEnabled) playTone(1320, 0.18);

      if (scores) Economy.recordAnswer({ correct: true, fast: speed.fast, signed, rescue: state.justRescued });
    } else {
      flashScreen(false);
      shakeScreen();
      btn.classList.add("incorrect");
      // Revelar cuál era la opción correcta (igual que en timeout)
      document.querySelectorAll('.option-btn[data-ok="1"]').forEach(b => b.classList.add("correct"));

      let fine = 0;
      if (scores) {
        state.lives--;
        state.streak = 0;
        // Firmar es apostar: si la nota lleva tu nombre y estaba mal, se paga.
        if (signed) {
          fine = Economy.fine(GAME_CONFIG.signFine);
          if (fine > 0) floatReward(`−${fine} 🪙`, "bad");
        }
        state.round.answered++;
        state.shift.answered++;
        Economy.recordAnswer({ correct: false, signed });
      }
      state.lastReward = { base: 0, speed: 0, mult: 1, signed, coins: 0, xp: 0, fine, fast: false };

      state.residentMood = "shock";
      state.bossMood = "angry";
      state.justRescued = false;
      state.caseHadError = true;
      if (state.soundEnabled) playSequence([320, 250, 190], 0.09, 0.2);

      saveFailedCase(state.current?.case_id);
      recordMistake(task);

      // Si al caso le quedan preguntas, la siguiente es de rescate.
      if (!lastTask) state.decompensated = true;
    }

    if (scores) pushAchievements();
    renderHUD();

    // Mostrar la retroalimentación SIEMPRE, incluso al perder la última vida:
    // es el caso con mayor valor didáctico. advanceNext() dispara el Game Over
    // al avanzar (manual o auto) cuando lives <= 0.
    const selectedTextEl = btn.querySelector(".option-text");
    const selectedText = selectedTextEl ? selectedTextEl.textContent : btn.textContent;
    later(() => showSmartFeedback(ok, task, selectedText), GAME_CONFIG.modalDelayMs);
  }

  function init() {
    ScreenManager.showMenu();
    window.addEventListener("keydown", (e) => {
      // Ctrl+1 cambia de pestaña, no responde un caso. Y una tecla mantenida
      // no debe saltar feedback y pase de visita de un tirón.
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const tag = e.target && e.target.tagName;
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;

      // Enter/Espacio avanza la retroalimentación o cierra el pase de visita.
      // Si el foco está en otro botón (p. ej. "Ver explicación"), manda ese.
      if (e.key === "Enter" || e.key === " ") {
        const advanceBtn = document.querySelector("#btnRoundContinue, #btnNextFeedback");
        if (advanceBtn && !(tag === "BUTTON" && e.target !== advanceBtn)) {
          e.preventDefault();
          advanceBtn.click();
        }
        return;
      }

      // F firma la nota antes de responder.
      if (e.key.toLowerCase() === "f") {
        const signBtn = document.querySelector("#btnSignNote");
        if (signBtn && !signBtn.disabled) {
          e.preventDefault();
          toggleSign();
        }
        return;
      }

      if (/^[1-9]$/.test(e.key)) {
        const b = document.querySelector(`.option-btn[data-index="${e.key}"]`);
        if (b && !b.disabled) b.click();
      }
    });
  }

  // Una sucesión corta de notas se lee como "acierto" o "error" mucho mejor
  // que un tono suelto: es la diferencia entre un pitido y una señal.
  function playSequence(notes, step = 0.08, dur = 0.12) {
    if (!state.soundEnabled || !Array.isArray(notes)) return;
    notes.forEach((f, i) => setTimeout(() => playTone(f, dur), i * step * 1000));
  }

  let audioCtx = null;
  function ensureAudio() {
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
      }
      // iOS/Chrome crean el contexto suspendido hasta un gesto del usuario.
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    } catch {
      audioCtx = null;
    }
  }

  function playTone(f, d = 0.1) {
    if (!state.soundEnabled) return;
    ensureAudio();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    // Ataque corto y volumen contenido: antes el tono salía a ganancia 1
    // (volumen máximo) con un chasquido al empezar.
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + d + 0.05);
  }

  return { init };
})();

window.addEventListener("DOMContentLoaded", () => Game.init());
