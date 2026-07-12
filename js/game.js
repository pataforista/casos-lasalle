"use strict";

const GAME_CONFIG = {
  maxLives: 3,
  baseTurnSeconds: 45,
  minTurnSeconds: 15,   // Un poco más bajo para expertos
  difficultyScale: 4.5, // Factor logarítmico
  modalDelayMs: 450,
  advanceDelayMs: 3500  // Tiempo para auto-avance
};

const NARRATIVE = {
  title: "Guardia crítica",
  intro: "Estás de guardia. No eres observador: decides con información incompleta en un servicio saturado.",
  premise: "Aquí no se resuelven casos perfectos. Se decide bajo presión clínica real.",
  welcomeTitle: "Bienvenida a la guardia",
  welcomeSubtitle: "Reglas rápidas antes de empezar.",
  rules: [
    "Decide con la información disponible: no siempre tendrás el panorama completo.",
    "El tiempo y las vidas importan: cada demora cuesta.",
    "Una decisión defendible pesa más que una respuesta perfecta.",
    "Las rachas aumentan tu recompensa; los errores cortan el ritmo.",
    "Lee la retroalimentación breve para ajustar tu criterio clínico."
  ],
  residents: [
    "“No tengo tiempo para revisar todo, dime qué hacemos.”",
    "“Esto puede esperar… o no. Tú decides.”",
    "“Si lo mandamos a casa y se complica, va a rebotar.”"
  ],
  boss: "Dr. Celada evalúa resultados, no intenciones. No pregunta: espera que sepas decidir.",
  consequence: "El error honesto pesa menos que una decisión mal razonada."
};

// --- ROSTER DE RESIDENTES (Fase 1: rotación con identidad propia) ---
const ROSTER = [
  // Todas las tiras se reextrajeron a un formato uniforme 4x1 de celdas
  // cuadradas (ver tools/extract_sprites.py), así que cols:4, rows:1, pctY:0.
  { name: "Aguilar",  title: "Dra.", grad: ["#84fab0", "#8fd3f4"], signature: "Ya lo interrogué; te resumo lo importante.", sprite: "Dra. Aguilar.png", cols: 4, rows: 1, pctY: 0 },
  { name: "Solis",    title: "Dr.",  grad: ["#fccb90", "#d57eeb"], signature: "Yo ya le hubiera dado algo, pero mejor dime tú.", sprite: "Dr. Solís.png", cols: 4, rows: 1, pctY: 0 },
  { name: "Ríos",     title: "Dra.", grad: ["#a1c4fd", "#c2e9fb"], signature: "Con calma: los datos están completos, la decisión es tuya.", sprite: "Dra. Ríos.png", cols: 4, rows: 1, pctY: 0 },
  { name: "Mendoza",  title: "Dr.",  grad: ["#fbc2eb", "#a6c1ee"], signature: "No me gusta cómo se ve… ¿lo checas conmigo?", sprite: "Dr. Mendoza.png", cols: 4, rows: 1, pctY: 0 },
  { name: "Ferrer",   title: "Dra.", grad: ["#f6d365", "#fda085"], signature: "Te lo pongo en una línea: hay que decidir ya.", sprite: "Dra. Ferrer.png", cols: 4, rows: 1, pctY: 0 },
  { name: "Castañeda",title: "Dr.",  grad: ["#96e6a1", "#d4fc79"], signature: "El interrogatorio no me cuadra del todo, júzgalo tú.", sprite: "Dr. Castañeda.png", cols: 4, rows: 1, pctY: 0 },
  { name: "Herrera",  title: "Dra.", grad: ["#e0c3fc", "#8ec5fc"], signature: "La familia está afuera preguntando. ¿Qué les digo?", sprite: "Dra. Herrera.png", cols: 4, rows: 1, pctY: 0 },
  { name: "Valdez",   title: "Dr.",  grad: ["#ffecd2", "#fcb69f"], signature: "Tranquilidad… bueno, la que se pueda a esta hora.", sprite: "Dr. Valdez.png", cols: 4, rows: 1, pctY: 0 }
];

// Frases por contexto. Las de "presentNormal" incluyen las citas originales de NARRATIVE.residents.
const RESIDENT_LINES = {
  presentTachy: [
    "Viene muy agitado, apenas podemos contenerlo. ¿Qué hacemos?",
    "Está taquicárdico y no coopera. Necesito una indicación ya.",
    "Se altera más con cada minuto. Tú decides.",
    "Seguridad ya está enterada, pero esto es clínico. ¿Indicaciones?"
  ],
  presentBrady: [
    "Casi no responde; lo trajeron los familiares.",
    "Lleva horas sin moverse ni comer. Esto no me gusta.",
    "Hipoactivo, apenas contesta. ¿Por dónde empezamos?"
  ],
  presentNormal: [
    "No tengo tiempo para revisar todo, dime qué hacemos.",
    "Esto puede esperar… o no. Tú decides.",
    "Si lo mandamos a casa y se complica, va a rebotar.",
    "Te presento el caso; la sala está llena y hay prisa.",
    "Ya está el expediente. ¿Cuál es tu impresión?"
  ],
  ok: [
    "¡Eso! Ya lo estamos indicando.",
    "De acuerdo, tiene sentido. Procedo.",
    "Bien visto. Aviso a enfermería.",
    "Anotado. El paciente va a agradecerlo."
  ],
  okStreak: [
    "Otra más… hoy estás en modo intratable.",
    "Así da gusto pasar la guardia.",
    "El Dr. Celada tiene que estar viendo esto.",
    "A este ritmo, vaciamos la sala antes del cambio de turno."
  ],
  error: [
    "¿Seguro? El paciente no va bien…",
    "Uy… eso no salió como esperábamos.",
    "Se complicó. Hay que replantear.",
    "El adscrito va a preguntar por esto…"
  ],
  timeout: [
    "Nos quedamos pensando demasiado…",
    "No decidimos a tiempo; ya intervino el adscrito.",
    "La demora también es una decisión, y esta costó."
  ]
};

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

const Avatars = {
  // Genera un avatar usando sprite sheets transparentes y contenedores CSS con degradados.
  _generate(spritePath, cols, rows, mood, animation, badge, gradColors, customPctY = 0) {
    const [c1, c2] = Array.isArray(gradColors) && gradColors.length === 2
      ? gradColors
      : ["#84fab0", "#8fd3f4"];

    let colIdx = 0;
    if (mood === "happy") colIdx = 2;
    else if (mood === "shock" || mood === "angry") colIdx = 3;

    // Todas las tiras tienen 4 columnas, por lo que cols-1 es siempre 3
    const pctX = (colIdx / 3) * 100;
    const pctY = customPctY;

    return `
      <div class="kawaii-avatar ${animation ? animation : ''}" style="background: linear-gradient(135deg, ${c1}, ${c2}); display: flex; align-items: center; justify-content: center; position: relative; overflow: visible;">
        <div style="width: 100%; height: 100%; overflow: hidden; border-radius: 20px; display: flex; align-items: center; justify-content: center;">
          <div class="sprite-frame" style="
            background-image: url('assets/sprites/${spritePath}');
            background-size: ${cols * 100}% ${rows * 100}%;
            background-position: ${pctX}% ${pctY}%;
          "></div>
        </div>
        ${badge ? `<div class="kawaii-tag">${badge}</div>` : ""}
      </div>
    `;
  },

  resident(name, mood = "normal", gradColors) {
    const res = ROSTER.find(r => r.name === name) || ROSTER[0];
    const initial = name ? name[0].toUpperCase() : "R";
    const anim = mood === "happy" ? "bounce" : (mood === "shock" ? "shake" : "");
    return this._generate(res.sprite, res.cols, res.rows, mood, anim, initial, gradColors || res.grad, res.pctY || 0);
  },

  boss(mood = "normal") {
    const anim = mood === "angry" ? "shake" : "";
    return this._generate("Dr. Celada.png", 4, 1, mood, anim, "BOSS", ["#f5576c", "#f093fb"], 0);
  },

  patient(caseId, ecgClass) {
    let hash = 0;
    if (caseId) {
      for (let i = 0; i < caseId.length; i++) {
        hash = caseId.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const index = Math.abs(hash) % 3;
    const patients = [
      { file: "paciente 1 Joven Adulto.png", cols: 4, rows: 1, pctY: 0, grad: ["#ff758c", "#ff7eb3"] },
      { file: "Paciente 2 Adulta Mayor.png", cols: 4, rows: 1, pctY: 0, grad: ["#f6d365", "#fda085"] },
      { file: "Paciente 3 Adulto de Mediana Edad.png", cols: 4, rows: 1, pctY: 0, grad: ["#a1c4fd", "#c2e9fb"] }
    ];
    const pat = patients[index];
    let mood = "normal";
    let anim = "";
    if (ecgClass === "tachy") {
      mood = "happy";
      anim = "shake";
    } else if (ecgClass === "brady" || ecgClass === "flat") {
      mood = "shock";
    }
    return this._generate(pat.file, pat.cols, pat.rows, mood, anim, "PAC", pat.grad, pat.pctY || 0);
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
    autoAdvance: localStorage.getItem('psy_pref_autoadvance') !== 'false',
    soundEnabled: localStorage.getItem('psy_pref_sound') !== 'false',
    // Creado dinámicamente
    solvedCasesCount: 0,
    filters: {
      educational_level: "",
      difficulty: ""
    },
    resident: ROSTER[0],
    turnSeconds: GAME_CONFIG.baseTurnSeconds, // Dinámico
    casesReady: false,
    useGenerator: false,
    streak: 0,
    maxStreak: 0,
    recentCases: [],
    recentFeedbackTimer: null,
    residentMood: "normal",
    bossMood: "normal",
    hintUsedInTurn: false,
    failedCaseIds: [],
    decompensated: false
  };

  const $ = (sel) => document.querySelector(sel);

  // --- SCREEN MANAGER ---
  const ScreenManager = {
    transition(fromId, toId, effect = "fade") {
      const fromEl = $(fromId);
      const toEl = $(toId);

      if (fromEl && fromEl.innerHTML) {
        fromEl.classList.add("fade-out", "screen-transition");
        setTimeout(() => {
          fromEl.innerHTML = "";
          fromEl.classList.remove("fade-out", "screen-transition");
        }, 500);
      }

      if (toEl) {
        toEl.style.opacity = "0";
        setTimeout(() => {
          toEl.classList.add(effect === "slide" ? "slide-up" : "fade-in", "screen-transition");
          toEl.style.opacity = "1";
          setTimeout(() => toEl.classList.remove("slide-up", "fade-in", "screen-transition"), 500);
        }, 100);
      }
    },

    showMenu() {
      // Clear game screens
      $("#hudRoot").innerHTML = "";
      $("#caseRoot").innerHTML = "";
      $("#modalRoot").innerHTML = "";

      // Render menu in hudRoot (acting as main container)
      renderMenu();
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

  function getFailedCases() {
    try {
      const raw = JSON.parse(localStorage.getItem('psycase_failed_cases') || '[]');
      if (!Array.isArray(raw)) return [];
      return raw
        .filter(item => item !== null && typeof item === 'object' || typeof item === 'string')
        .map(item => {
          if (typeof item === 'string') {
            return { caseId: item, level: 0, nextReview: 0 };
          }
          return {
            caseId: typeof item.caseId === 'string' ? item.caseId : '',
            level: Number.isFinite(item.level) ? item.level : 0,
            nextReview: Number.isFinite(item.nextReview) ? item.nextReview : 0
          };
        })
        .filter(item => item.caseId.length > 0);
    } catch(e) {
      return [];
    }
  }

  function getDueFailedCases() {
    const failed = getFailedCases();
    const now = Date.now();
    return failed.filter(item => !item.nextReview || item.nextReview <= now);
  }

  function saveFailedCase(caseId) {
    // Guardar todos los casos del banco para el repaso; excluir solo los sintéticos del generador
    if (!caseId || caseId.startsWith("MODULAR_")) return;
    let failed = getFailedCases();
    let existing = failed.find(item => item.caseId === caseId);
    if (!existing) {
      failed.push({ caseId, level: 0, nextReview: Date.now() });
    } else {
      // Si ya existía, pero se volvió a fallar, se reinicia el nivel de maestría y se programa inmediato
      existing.level = 0;
      existing.nextReview = Date.now();
    }
    try { localStorage.setItem('psycase_failed_cases', JSON.stringify(failed)); } catch {}
  }

  function promoteFailedCase(caseId) {
    if (!caseId) return;
    let failed = getFailedCases();
    let idx = failed.findIndex(item => item.caseId === caseId);
    if (idx !== -1) {
      const item = failed[idx];
      item.level = (item.level || 0) + 1;
      if (item.level >= 3) {
        // Alcanzó el nivel máximo de maestría (3 aciertos espaciados), se borra definitivamente
        failed.splice(idx, 1);
      } else {
        // Reprogramar según el nivel de maestría:
        // Nivel 1: +24 horas (86400000 ms)
        // Nivel 2: +72 horas (259200000 ms)
        const delay = item.level === 1 ? 24 * 3600 * 1000 : 72 * 3600 * 1000;
        item.nextReview = Date.now() + delay;
      }
      try { localStorage.setItem('psycase_failed_cases', JSON.stringify(failed)); } catch {}
    }
  }

  // Separador de oraciones que no corta en decimales ("0.6-1.2 mEq/L")
  const SENTENCE_RE = /(?:[^.!?]|[.!?](?=\d))+(?:[.!?]+|$)/g;

  function getBriefFeedback(caseObj, task) {
    const rationale = caseObj?.explanation?.rationale || task?.rationale || "";
    if (!rationale) return "Evalúa el riesgo inmediato y prioriza lo defendible.";
    const sentences = rationale.match(SENTENCE_RE);
    return sentences ? sentences[0].trim() : rationale.slice(0, 160) + "…";
  }

  function getExplanationPayload(caseObj, task, selectedText, ok) {
    const explanation = caseObj?.explanation || {};
    const rationale = String(explanation.rationale || task?.rationale || "").trim();
    const takeHome = String(explanation.take_home || "").trim();
    const whyNot = Array.isArray(explanation.why_not) ? explanation.why_not : [];
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

  // Estado del jefe: evalúa resultados — rachas altas ganan elogio, vidas bajas ganan tensión
  function getBossStatus() {
    if (state.studyMode) return "EDUCANDO";
    if (state.lives <= 1) return "¡FURIOSO!";
    if (state.streak >= 8) return "IMPRESIONADO";
    if (state.streak >= 5) return "ASINTIENDO";
    if (state.lives === 2) return "TENSO";
    return "VIGILANDO";
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

  // --- RENDERERS ---

  function renderMenu() {
    const root = $("#hudRoot");
    if (!root) return;

    Economy.init(); // Refresh data
    const failedList = getFailedCases();
    const dueList = getDueFailedCases();

    root.innerHTML = `
      <div class="miami-card hero-card">
        <div class="hero-title">PsyCase</div>
        <div class="hero-subtitle">Guardia crítica · decide en segundos</div>
        <div class="hero-grid">
          <div class="hero-pill">⏱️ Tiempo real</div>
          <div class="hero-pill">🩺 Decisiones clínicas</div>
          <div class="hero-pill">🔥 Rachas y recompensas</div>
        </div>
        <button class="btn-action" id="btnStart">Iniciar guardia</button>
        <button class="btn-action" id="btnStudyMode" style="margin-top:10px; background:linear-gradient(135deg, var(--miami-cyan), var(--miami-purple)); box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);">Modo Estudio</button>
        ${failedList.length > 0 ? `
          <button class="btn-action" id="btnMenuReviewFailed" 
            style="margin-top:10px; background:${dueList.length > 0 ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(255, 255, 255, 0.06)'}; 
            box-shadow: ${dueList.length > 0 ? '0 0 15px rgba(255, 215, 0, 0.4)' : 'none'}; 
            border: ${dueList.length > 0 ? 'none' : '1px dashed rgba(255, 255, 255, 0.15)'}; 
            color: ${dueList.length > 0 ? '#fff' : 'rgba(255,255,255,0.4)'}; 
            font-size:16px;" 
            ${dueList.length === 0 ? 'disabled' : ''}>
            ${dueList.length > 0 ? `📖 Repasar Errores (${dueList.length} ${dueList.length === 1 ? "listo" : "listos"} / ${failedList.length} total)` : `✅ Repaso al día (${failedList.length} en maestría)`}
          </button>
        ` : ""}
        <div class="hero-meta">
          <span>Rango: ${escapeHtml(Economy.getRank())}</span>
          <span>🪙 ${Economy.getCoins()}</span>
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
              <option value="residencia">Residencia (RDoC)</option>
              <option value="especialidad">Especialidad</option>
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

      <div class="miami-card">
        <div class="narrative-title">${escapeHtml(NARRATIVE.welcomeTitle)}</div>
        <ul class="rules-list">
           ${NARRATIVE.rules.slice(0, 3).map(r => `<li>${escapeHtml(r)}</li>`).join("")}
        </ul>
        <div class="narrative-quote">${escapeHtml(NARRATIVE.boss)}</div>
      </div>
    `;

    // Reflejar los filtros vigentes y mostrar cuántos casos reales cubre la combinación
    const selectLevel = $("#selectLevel");
    const selectDifficulty = $("#selectDifficulty");
    selectLevel.value = state.filters.educational_level;
    selectDifficulty.value = state.filters.difficulty;

    const updatePoolInfo = () => {
      const info = $("#poolInfo");
      if (!info) return;
      if (!state.casesReady) { info.textContent = ""; return; }
      const n = CaseDB.getPoolSize({
        educational_level: selectLevel.value,
        difficulty: selectDifficulty.value
      });
      info.textContent = n > 0
        ? `${n} caso${n === 1 ? "" : "s"} del banco clínico con estos filtros`
        : "⚠️ Sin casos reales para esta combinación: se jugarán casos sintéticos";
      info.classList.toggle("pool-info--warn", n === 0);
    };
    selectLevel.onchange = updatePoolInfo;
    selectDifficulty.onchange = updatePoolInfo;
    ensureCasesLoaded().then(updatePoolInfo);

    $("#btnStart").onclick = () => {
      root.classList.add("fade-out", "screen-transition");
      setTimeout(() => startTurn(false, false), 400);
    };

    $("#btnStudyMode").onclick = () => {
      root.classList.add("fade-out", "screen-transition");
      setTimeout(() => startTurn(true, false), 400);
    };

    if (failedList.length > 0) {
      $("#btnMenuReviewFailed").onclick = () => {
        root.classList.add("fade-out", "screen-transition");
        setTimeout(() => startTurn(true, true), 400);
      };
    }
  }

  function renderGameOver() {
    const modal = $("#modalRoot");

    if (!state.studyMode) {
      Economy.registerGame(state.maxStreak);
    }
    const stats = Economy.getStats();
    const achievements = Economy.checkAchievements();
    const unlocked = Economy.getUnlockedAchievements();

    const failedList = getFailedCases();
    const dueList = getDueFailedCases();
    const showReviewBtn = failedList.length > 0;

    modal.innerHTML = `
      <div class="modal">
        <div class="modalCard game-over-card">
          <div style="font-size:48px;">💀</div>
          <div class="hero-title" style="color:#ff0055;">GUARDIA TERMINADA</div>
          <div style="color:rgba(255,255,255,0.7); margin-bottom:10px;">El servicio ha colapsado.</div>
          
          <div class="stat-grid">
             <div class="stat-box">
               <div class="stat-value">${state.maxStreak}</div>
               <div class="stat-label">Mejor Racha</div>
             </div>
             <div class="stat-box">
               <div class="stat-value">${Economy.getCoins()}</div>
               <div class="stat-label">Monedas Totales</div>
             </div>
          </div>
          
          ${unlocked.length ? `
            <div style="margin:10px 0;">
              <div class="stat-label" style="color:#ffd700;">LOGROS OBTENIDOS</div>
              <div class="achievement-list">
                ${unlocked.map(a => `
                  <div class="achievement-badge" title="${escapeHtml(a.name)}">${escapeHtml(a.icon)}</div>
                `).join("")}
              </div>
            </div>
          ` : ""}

          <div class="stat-label">Rango Actual: ${Economy.getRank()}</div>
          
          <div style="display:grid; gap:10px; margin-top:20px;">
            <button class="btn-action" id="btnRestart">Nueva Guardia</button>
            ${showReviewBtn ? `
              <button class="btn-action" id="btnReviewFailed" 
                style="background:${dueList.length > 0 ? 'linear-gradient(135deg, var(--miami-cyan), var(--miami-purple))' : 'rgba(255, 255, 255, 0.06)'}; 
                box-shadow: ${dueList.length > 0 ? '0 0 15px rgba(0, 243, 255, 0.4)' : 'none'}; 
                border: ${dueList.length > 0 ? 'none' : '1px dashed rgba(255, 255, 255, 0.15)'}; 
                color: ${dueList.length > 0 ? '#fff' : 'rgba(255,255,255,0.4)'};"
                ${dueList.length === 0 ? 'disabled' : ''}>
                ${dueList.length > 0 ? `Repasar Errores (${dueList.length} ${dueList.length === 1 ? "listo" : "listos"} / ${failedList.length} total)` : `Repaso al día (${failedList.length} en maestría)`}
              </button>
            ` : ""}
            <button class="option-btn" id="btnMenu" style="justify-content:center; text-align:center;">Volver al Menú</button>
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
          <div style="color:rgba(255,255,255,0.7); margin-bottom:10px;">Has repasado y corregido todos tus casos fallados de la base de datos real.</div>
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

  async function ensureCasesLoaded() {
    if (state.casesReady) return true;
    try {
      await CaseDB.init();
      state.casesReady = true;
      state.useGenerator = false;
      return true;
    } catch (err) {
      console.error(err);
      state.useGenerator = true;
      return false;
    }
  }

  async function startTurn(studyMode = false, reviewMode = false) {
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
    state.bossMood = "normal";
    state.hintUsedInTurn = false;
    state.solvedCasesCount = 0;
    state.currentTaskIndex = 0;

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

    // Reset visual effects
    document.body.classList.remove("hot-zone-active", "time-critical");

    $("#hudRoot").innerHTML = "";
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

    const hearts = state.studyMode ? "💖 ♾️" : "💖".repeat(state.lives);
    const streakLabel = state.streak >= 3 ? "RACHA" : "COMBO";
    
    const isEduDoc = state.current?.case_type === "documento_educativo";
    const timeLabel = state.studyMode ? 'MODO ESTUDIO' : (isEduDoc ? 'LECTURA LIBRE' : 'TIEMPO');

    const res = state.resident || ROSTER[0];

    hud.innerHTML = `
      <div class="miami-card">
        <div class="hudRow">
          <div class="hudBox">
            <div class="avatar" id="resBox">${Avatars.resident(res.name, state.residentMood, res.grad)}</div>
            <div>
              <div class="badge">${escapeHtml(res.title)} ${escapeHtml(res.name)}</div>
              <div style="font-weight:900;">${hearts}</div>
            </div>
          </div>

          <div class="track" aria-label="tiempo">
            <div class="bar" id="tBar" style="width:100%"></div>
            <div class="track-label">${timeLabel}</div>
          </div>

          <div class="hudBox">
            <div>
              <div class="badge">Dr. Celada</div>
              <div style="font-weight:900; font-style:italic;">${getBossStatus()}</div>
              <div style="color:rgba(255,43,214,.9);font-weight:900;">🪙 ${Economy.getCoins()} · ${escapeHtml(Economy.getRank())}</div>
            </div>
            <div class="avatar" id="bossBox">${Avatars.boss(state.bossMood)}</div>
          </div>
        </div>
        <div class="hudMeta">
          <div class="combo-chip" id="comboChip" style="${state.studyMode ? 'opacity:0.4;' : ''}">
            <span class="combo-label">${streakLabel}</span>
            <span class="combo-value">x${state.streak}</span>
          </div>
          <div class="powerups-row" id="pwrRow">
             <button class="btn-powerup" id="btnHint" ${Economy.getCoins() < 50 || state.hintUsedInTurn ? 'disabled' : ''} title="Descartar una opción incorrecta">
               <span>💡</span> Pista (50)
             </button>
             <button class="btn-powerup" id="btnBuyLife" ${Economy.getCoins() < 100 || state.lives >= GAME_CONFIG.maxLives ? 'disabled' : ''} title="Recuperar una vida">
               <span>❤️</span> +Vida (100)
             </button>
             <button class="btn-powerup" id="btnBuyTime" ${Economy.getCoins() < 30 || state.studyMode || isEduDoc ? 'disabled' : ''} title="Añadir 30 segundos al reloj">
               <span>⏱️</span> +30s (30)
             </button>
             <button class="btn-powerup" id="btnSoundToggle" title="Activar/Silenciar sonido">
               <span>${state.soundEnabled ? '🔊' : '🔇'}</span>
             </button>
             <button class="btn-powerup" id="btnAutoToggle" title="Auto-avance de retroalimentación">
               <span>${state.autoAdvance ? '⏱️ Auto' : '⏸️ Manual'}</span>
             </button>
             <button class="btn-powerup" id="btnMenuFromGame" title="Volver al menú principal">
               <span>🏠</span>
             </button>
          </div>
          <div class="combo-chip combo-chip--alt" style="${state.studyMode ? 'opacity:0.4;' : ''}">
            <span class="combo-label">MEJOR</span>
            <span class="combo-value">x${state.maxStreak}</span>
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
        localStorage.setItem('psy_pref_sound', state.soundEnabled);
        renderHUD();
        playTone(660, 0.05);
      };
    }

    const autoBtn = $("#btnAutoToggle");
    if (autoBtn) {
      autoBtn.onclick = () => {
        state.autoAdvance = !state.autoAdvance;
        localStorage.setItem('psy_pref_autoadvance', state.autoAdvance);
        renderHUD();
        playTone(660, 0.05);
      };
    }

    const menuBtn = $("#btnMenuFromGame");
    if (menuBtn) {
      menuBtn.onclick = () => {
        clearInterval(state.timer);
        clearTimeout(state.recentFeedbackTimer);
        document.body.classList.remove("hot-zone-active", "time-critical");
        ScreenManager.showMenu();
      };
    }
  }

  function useHint() {
    if (state.hintUsedInTurn || !Economy.spend(50)) return;
    state.hintUsedInTurn = true;
    
    const distractors = document.querySelectorAll('.option-btn[data-ok="0"]:not(.hint-used)');
    if (distractors.length > 0) {
      const target = distractors[Math.floor(Math.random() * distractors.length)];
      target.classList.add("hint-used");
      target.disabled = true;
      playTone(600, 0.05);
    }
    renderHUD(); // Update buttons and coins
  }

  function buyLife() {
    if (state.lives >= GAME_CONFIG.maxLives || !Economy.spend(100)) return;
    state.lives++;
    playTone(880, 0.1);
    renderHUD();
  }

  function buyTime() {
    if (state.studyMode || state.current?.case_type === "documento_educativo" || !Economy.spend(30)) return;
    state.timeLeft = Math.min(state.timeLeft + 30, state.turnSeconds);
    playTone(880, 0.1);
    renderHUD();
  }

  function pickTask(caseObj, index = 0) {
    const t = (caseObj?.tasks && caseObj.tasks[index]) ? caseObj.tasks[index] : null;
    const base = {
      instruction: "Analiza el caso y responde.",
      expected_answer: "Conducta adecuada",
      distractors: ["Opción A", "Opción B", "Opción C"],
      rationale: "Justificación clínica."
    };
    
    if (!t) return base;
    
    // Consecuencias de Guardia (Branching Scenarios)
    if (state.decompensated && index > 0) {
      const adapted = { ...base, ...t };
      const prefix = "🚨 [URGENCIA: ¡El paciente se ha descompensado debido a tu conducta anterior! Realiza una maniobra de rescate]\n\n";
      if (adapted.question) {
        adapted.question = prefix + adapted.question;
      } else if (adapted.instruction) {
        adapted.instruction = prefix + adapted.instruction;
      }
      return adapted;
    }
    
    return { ...base, ...t, question: t.question || "" };
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

    const options = [
      { t: task.expected_answer, ok: true },
      ...(Array.isArray(task.distractors) ? task.distractors : []).map(d => ({ t: d, ok: false }))
    ];
    // Fisher–Yates: barajado uniforme (sort(random-0.5) sesga la posición de la correcta)
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Badge showing case / task progress or Educational Doc
    const tasksCount = c.tasks ? c.tasks.length : 1;
    let progressBadge = "";
    if (c.case_type === "documento_educativo") {
      progressBadge = "Lectura Didáctica";
    } else {
      progressBadge = tasksCount > 1
        ? `Pregunta ${state.currentTaskIndex + 1}/${tasksCount}`
        : `Caso ${state.solvedCasesCount + 1}`;
    }
    // Transparencia: avisar cuando el caso no proviene del banco clínico real
    const isSynthetic = c.metadata?.is_real_data === false || String(c.case_id || "").startsWith("MODULAR_");
    if (isSynthetic) progressBadge += " · Sintético";

    const ecgClass = getPatientEcgClass(c);
    const ecgSvg = `
      <svg viewBox="0 0 100 30" class="ecg-svg" aria-hidden="true">
        <path d="M 0 15 L 30 15 L 35 12 L 40 18 L 45 15 L 48 5 L 52 28 L 56 15 L 60 17 L 65 15 L 100 15" pathLength="100" class="ecg-line ecg-${ecgClass}"></path>
      </svg>
    `;

    // El residente presenta el caso (solo en la primera tarea, no en documentos didácticos)
    const res = state.resident || ROSTER[0];
    const presentLine = (state.currentTaskIndex === 0 && c.case_type !== "documento_educativo")
      ? getResidentPresentLine(ecgClass)
      : "";

    root.innerHTML = `
      <div class="miami-card case-card">
        <div class="caseHeader" style="display: flex; align-items: center; gap: 16px;">
          ${Avatars.patient(c.case_id, ecgClass)}
          <div style="flex: 1; min-width: 0;">
            <div class="caseTitle" style="font-size: 16px; margin-bottom: 6px;">${escapeHtml(getCaseTitle(c))}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              ${ecgSvg}
              <div class="caseBadge">${escapeHtml(progressBadge)}</div>
            </div>
          </div>
        </div>
        ${presentLine ? `<div class="residentQuote">💬 <strong>${escapeHtml(res.title)} ${escapeHtml(res.name)}:</strong> “${escapeHtml(presentLine)}”</div>` : ""}
        <div class="caseSummary">
          <div class="caseLabel">Lectura rápida</div>
          <div class="caseBody">${escapeHtml(summary)}</div>
        </div>
        ${details ? `<details class="caseDetails"><summary>Ver detalles</summary><div class="caseBody">${escapeHtml(details)}</div></details>` : ""}
        ${questionText ? `<div class="caseQuestion">${escapeHtml(questionText)}</div>` : ""}
        ${consequenceText ? `<div class="caseAside">${escapeHtml(consequenceText)}</div>` : ""}
      </div>
      <div class="options">
        ${options.map((o, idx) => `
          <button class="option-btn" data-ok="${o.ok ? "1" : "0"}" data-index="${idx + 1}">
            <span class="option-index">${idx + 1}</span>
            <span class="option-text">${escapeHtml(String(o.t))}</span>
          </button>
        `).join("")}
      </div>
      <div class="options-hint">Atajos: 1-4</div>
    `;

    root.querySelectorAll(".option-btn").forEach(btn => {
      btn.onclick = () => checkAnswer(btn, btn.dataset.ok === "1", task);
    });
  }

  function startTimer() {
    clearInterval(state.timer);
    
    // Si el caso actual es un documento educativo, no iniciamos temporizador
    if (state.current?.case_type === "documento_educativo") {
      const b = $("#tBar");
      if (b) b.style.width = "100%";
      document.body.classList.remove("hot-zone-active", "time-critical");
      return;
    }

    // Dificultad Logarítmica: más fluido y natural
    const reduction = Math.floor(Math.log2(state.streak + 1) * GAME_CONFIG.difficultyScale);
    state.turnSeconds = Math.max(GAME_CONFIG.minTurnSeconds, GAME_CONFIG.baseTurnSeconds - reduction);

    state.timeLeft = state.turnSeconds;
    state.timerStart = Date.now();

    state.timer = setInterval(() => {
      const elapsed = (Date.now() - state.timerStart) / 1000;
      state.timeLeft = Math.max(0, state.turnSeconds - elapsed);
      const pct = (state.timeLeft / state.turnSeconds) * 100;

      const b = $("#tBar");
      if (b) b.style.width = pct + "%";

      const label = b ? b.parentElement.querySelector(".track-label") : null;
      if (label && !state.studyMode) {
        label.textContent = `TIEMPO: ${Math.ceil(state.timeLeft)}s (Dificultad +${Math.floor(state.streak / 3) + 1})`;
      }

      // Hot Zone: Efecto visual sutil cuando queda < 20%
      const isHot = (pct <= 20);
      document.body.classList.toggle("hot-zone-active", isHot);

      // Parpadeo de fondo rojo cuando quedan ≤ 5 segundos
      const isCritical = (state.timeLeft <= 5);
      document.body.classList.toggle("time-critical", isCritical);

      const track = b ? b.closest(".track") : null;
      if (track) track.classList.toggle("track--danger", isCritical);

      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        document.body.classList.remove("hot-zone-active", "time-critical");

        if (!state.studyMode) {
          state.lives -= 1;
          state.streak = 0; // Timeout rompe racha igual que error
          saveFailedCase(state.current?.case_id);
        }

        // Resaltar respuesta correcta visualmente
        document.querySelectorAll(".option-btn").forEach(b => {
          b.disabled = true;
          if (b.dataset.ok === "1") b.classList.add("correct");
        });

        renderHUD();
        // Mostrar siempre la respuesta correcta y su explicación breve;
        // nextCase() dispara el Game Over si ya no quedan vidas.
        showTimeoutFeedback();
      }
    }, 100);
  }

  async function nextCase() {
    if (state.lives <= 0) return handleDeath();
    
    // Cleanup feedback if exists
    clearTimeout(state.recentFeedbackTimer);
    const overlay = $("#modalRoot");
    if (overlay) overlay.innerHTML = "";

    state.resident = pickResident();
    state.residentMood = "normal";
    state.bossMood = state.lives <= 1 ? "angry" : "normal";
    state.hintUsedInTurn = false;
    state.currentTaskIndex = 0; // Reset index for new case
    state.decompensated = false; // Reset descompensación para el nuevo caso

    if (state.reviewMode) {
      const activeFailed = getDueFailedCases();
      if (!activeFailed.length) {
        showReviewSuccess();
        return;
      }
      state.failedCaseIds = activeFailed.map(item => item.caseId);
    }

    try {
      const queryFilters = {
        excludeCaseIds: state.reviewMode ? [] : state.recentCases,
        ...state.filters
      };
      if (state.reviewMode) {
        queryFilters.includeCaseIds = state.failedCaseIds;
      }
      state.current = state.useGenerator ? Generator.createCase(state.filters) : await CaseDB.pickRandomCase(queryFilters);
    } catch(err) {
      if (state.reviewMode) {
        showReviewSuccess();
        return;
      }
      // Pool agotado por las exclusiones recientes: reintentar permitiendo repetir casos
      try {
        state.current = await CaseDB.pickRandomCase({ ...state.filters });
        state.recentCases = [];
      } catch(err2) {
        // No existe ningún caso real con estos filtros: usar el generador SOLO para este turno,
        // sin cambiar state.useGenerator (el banco real sigue disponible para otros filtros).
        console.warn("Sin casos reales para los filtros actuales, generando caso sintético:", err2);
        state.current = Generator.createCase(state.filters);
      }
    }

    if (state.current?.case_id) {
      state.recentCases.unshift(state.current.case_id);
      if (state.recentCases.length > 30) state.recentCases.length = 30;
    }

    renderHUD();
    renderCase();
    
    if (!state.studyMode && state.current?.case_type !== "documento_educativo") {
      startTimer();
    } else {
      clearInterval(state.timer);
      const b = $("#tBar");
      if (b) b.style.width = "100%";
      document.body.classList.remove("hot-zone-active", "time-critical");
    }
  }

  async function advanceNext() {
    if (state.lives <= 0) return handleDeath();

    // Check if there is another task in current case
    state.currentTaskIndex++;
    if (state.current && state.current.tasks && state.currentTaskIndex < state.current.tasks.length) {
      state.hintUsedInTurn = false;
      renderHUD();
      renderCase();
      if (!state.studyMode && state.current?.case_type !== "documento_educativo") {
        startTimer();
      } else {
        clearInterval(state.timer);
        const b = $("#tBar");
        if (b) b.style.width = "100%";
        document.body.classList.remove("hot-zone-active", "time-critical");
      }
    } else {
      // Go to next case
      state.solvedCasesCount++;
      await nextCase();
    }
  }

  function showSmartFeedback(ok, task, selectedText) {
    const root = $("#modalRoot");
    const brief = getBriefFeedback(state.current, task);
    const details = getExplanationPayload(state.current, task, selectedText, ok);
    const hasExplanation = !!state.current?.explanation;

    const whyNotList = state.current?.explanation?.why_not || [];
    const takeHomeText = details.takeHome;

    // Reacción del residente al resultado (racha alta tiene frases propias)
    const res = state.resident || ROSTER[0];
    const reactLine = pickLine(ok ? (state.streak >= 3 ? "okStreak" : "ok") : "error");

    root.innerHTML = `
      <div class="feedback-overlay show" style="border-color:${ok ? "rgba(57,255,20,0.4)" : "rgba(255,0,85,0.4)"}; cursor: default;">
        <div class="feedback-header">
          <div style="font-size:32px;">${ok ? "💎" : "⚠️"}</div>
          <div class="feedback-status" style="color:${ok ? "#39ff14" : "#ff0055"}">
            ${ok ? "EXCELENTE" : "ERROR CLÍNICO"}
          </div>
        </div>
        ${reactLine ? `<div class="feedback-resident">${escapeHtml(res.title)} ${escapeHtml(res.name)}: “${escapeHtml(reactLine)}”</div>` : ""}
        <div class="modalFeedback" style="margin:0; font-size:14px;">${escapeHtml(details.reason || brief)}</div>
        
        <div id="expandedFeedback" style="display:none;">
          ${details.rationale && details.rationale !== details.reason ? `<div class="modalFeedback" style="margin-top:10px; font-size:13px; background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.1);">${escapeHtml(details.rationale)}</div>` : ""}
          ${takeHomeText ? `<div class="feedback-take-home">💡 Para recordar: ${escapeHtml(takeHomeText)}</div>` : ""}
          ${whyNotList.length ? `
            <div style="margin-top:12px;">
              <div class="modalSectionTitle" style="font-size:11px; color:#ff00ff; font-weight:800; letter-spacing:1px; text-transform:uppercase;">¿POR QUÉ OTRAS OPCIONES NO?</div>
              ${whyNotList.map(w => `
                <div class="feedback-why-not-item">
                  <strong>${escapeHtml(w.option)}</strong>: ${escapeHtml(w.reason)}
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>

        <div style="display:flex; gap:10px; margin-top:12px;" id="feedbackControls">
          ${hasExplanation ? `<button class="btn-powerup" id="btnShowMoreFeedback" style="flex:1; justify-content:center;">📖 Ver Explicación</button>` : ""}
          <button class="btn-powerup" id="btnNextFeedback" style="flex:1; justify-content:center; background:linear-gradient(135deg, var(--miami-pink), var(--miami-purple)); color:#fff; border:none; font-weight:800;">Siguiente</button>
        </div>

        <div class="feedback-timer-bar animate-timer" id="feedbackTimerBar" style="background:${ok ? "#39ff14" : "#ff0055"}"></div>
      </div>
    `;

    const timerBar = $("#feedbackTimerBar");

    const advance = () => {
      clearTimeout(state.recentFeedbackTimer);
      root.innerHTML = "";
      advanceNext();
    };

    // If auto-advance is disabled, or we are in study mode, or we are in a time-free document, hide the timer bar
    const useAutoAdvance = state.autoAdvance && !state.studyMode && state.current?.case_type !== "documento_educativo";
    if (!useAutoAdvance) {
      if (timerBar) timerBar.style.display = "none";
    }

    $("#btnNextFeedback").onclick = advance;

    const showMoreBtn = $("#btnShowMoreFeedback");
    if (showMoreBtn) {
      showMoreBtn.onclick = (e) => {
        e.stopPropagation();
        clearTimeout(state.recentFeedbackTimer);
        if (timerBar) timerBar.style.display = "none";
        $("#expandedFeedback").style.display = "block";
        showMoreBtn.style.display = "none";
      };
    }

    if (useAutoAdvance) {
      state.recentFeedbackTimer = setTimeout(() => {
        advance();
      }, GAME_CONFIG.advanceDelayMs);
    }
  }

  function showTimeoutFeedback() {
    const task = pickTask(state.current, state.currentTaskIndex);
    const brief = getBriefFeedback(state.current, task);
    const root = $("#modalRoot");

    const res = state.resident || ROSTER[0];
    const timeoutLine = pickLine("timeout");

    root.innerHTML = `
      <div class="feedback-overlay show" style="border-color:rgba(255,165,0,0.4);">
        <div class="feedback-header">
          <div style="font-size:32px;">⏰</div>
          <div class="feedback-status" style="color:#ffa500;">TIEMPO AGOTADO</div>
        </div>
        ${timeoutLine ? `<div class="feedback-resident">${escapeHtml(res.title)} ${escapeHtml(res.name)}: “${escapeHtml(timeoutLine)}”</div>` : ""}
        <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.5); margin-bottom:4px;">Respuesta correcta</div>
        <div class="modalFeedback" style="margin:0; font-size:14px; border-color:rgba(57,255,20,0.3); color:#caffbf;">${escapeHtml(task.expected_answer)}</div>
        <div class="modalFeedback" style="margin-top:8px; font-size:13px; background:rgba(255,255,255,0.02); border-color:rgba(255,255,255,0.08);">${escapeHtml(brief)}</div>
        <div class="feedback-timer-bar animate-timer" style="background:#ffa500;"></div>
      </div>
    `;

    state.recentFeedbackTimer = setTimeout(() => {
      root.innerHTML = "";
      nextCase();
    }, GAME_CONFIG.advanceDelayMs);
  }

  function handleDeath() {
    clearInterval(state.timer);
    document.body.classList.remove("time-critical");
    if (state.soundEnabled) playTone(150, 0.4);
    // Wait a sec then show Game Over
    setTimeout(() => renderGameOver(), 600);
  }

  function checkAnswer(btn, ok, task) {
    clearInterval(state.timer);
    document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
    document.body.classList.remove("time-critical");

    const isEduDoc = state.current?.case_type === "documento_educativo";

    if (ok) {
      btn.classList.add("correct");
      if (!state.studyMode && !isEduDoc) {
        state.streak++;
        state.maxStreak = Math.max(state.maxStreak, state.streak);
        Economy.add(25 + (state.streak * 5), 50);
      }
      state.residentMood = "happy";
      if (state.soundEnabled) playTone(880, 0.12);

      // Promocionar nivel de maestría en repaso espaciado al responder bien
      promoteFailedCase(state.current?.case_id);
      state.decompensated = false; // ¡El paciente ha sido estabilizado!
    } else {
      btn.classList.add("incorrect");
      // Revelar cuál era la opción correcta (igual que en timeout)
      document.querySelectorAll('.option-btn[data-ok="1"]').forEach(b => b.classList.add("correct"));
      if (!state.studyMode && !isEduDoc) {
        state.lives--;
        state.streak = 0;
      }
      state.residentMood = "shock";
      state.bossMood = "angry";
      if (state.soundEnabled) playTone(220, 0.2);

      // Guardar caso real en la lista de fallados al errar
      saveFailedCase(state.current?.case_id);
      
      // Si tiene más tareas el caso actual, marcar como descompensado para la siguiente tarea
      if (state.current && state.current.tasks && state.currentTaskIndex + 1 < state.current.tasks.length) {
        state.decompensated = true;
      }
    }

    renderHUD();

    // Mostrar la retroalimentación SIEMPRE, incluso al perder la última vida:
    // es el caso con mayor valor didáctico. advanceNext() dispara el Game Over
    // al avanzar (manual o auto) cuando lives <= 0.
    const selectedTextEl = btn.querySelector('.option-text');
    const selectedText = selectedTextEl ? selectedTextEl.innerText : btn.innerText;
    setTimeout(() => showSmartFeedback(ok, task, selectedText), GAME_CONFIG.modalDelayMs);
  }

  function init() {
    ScreenManager.showMenu();
    window.addEventListener("keydown", (e) => {
      if (e.key === "d") return; // debug
      const idx = parseInt(e.key);
      if (!isNaN(idx)) {
        const b = document.querySelector(`.option-btn[data-index="${idx}"]`);
        if (b && !b.disabled) b.click();
      }
    });
  }

  let audioCtx;
  function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  function playTone(f, d = 0.1) {
    if (!state.soundEnabled) return;
    if (!audioCtx) ensureAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = f;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + d);
    o.stop(audioCtx.currentTime + d + 0.1);
  }

  return { init };
})();

window.addEventListener("DOMContentLoaded", () => Game.init());
