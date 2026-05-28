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

const Avatars = {
  _generate(svgContent, gradientId, animation, badge) {
    const uid = Math.random().toString(36).substr(2, 5);
    const gradId = `grad_${uid}`;

    const gradients = {
      resident: `
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#84fab0" />
          <stop offset="100%" stop-color="#8fd3f4" />
        </linearGradient>`,
      resident_happy: `
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fccb90" />
          <stop offset="100%" stop-color="#d57eeb" />
        </linearGradient>`,
      resident_error: `
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0c3fc" />
          <stop offset="100%" stop-color="#8ec5fc" />
        </linearGradient>`,
      boss: `
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5576c" />
          <stop offset="100%" stop-color="#f093fb" />
        </linearGradient>`
    };

    const selectedGrad = gradients[gradientId] || gradients.resident;

    return `
      <div class="kawaii-avatar ${animation ? animation : ''}" style="background: transparent;">
        <svg viewBox="0 0 100 100" class="avatar-svg" style="width:100%; height:100%; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
          <defs>${selectedGrad}</defs>
          <rect x="10" y="10" width="80" height="80" rx="25" fill="url(#${gradId})" stroke="rgba(255,255,255,0.8)" stroke-width="3" />
          ${svgContent}
        </svg>
        ${badge ? `<div class="kawaii-tag">${badge}</div>` : ""}
      </div>
    `;
  },

  resident(name, mood = "normal") {
    const faces = {
      normal: {
        eyes: `<circle cx="35" cy="45" r="5" fill="#111"/><circle cx="65" cy="45" r="5" fill="#111"/>`,
        mouth: `<path d="M40 65 Q50 70 60 65" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>`,
        grad: "resident"
      },
      happy: {
        eyes: `<path d="M30 45 Q35 40 40 45" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>
               <path d="M60 45 Q65 40 70 45" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>`,
        mouth: `<path d="M35 60 Q50 75 65 60" fill="#ff6b6b" stroke="none"/>`,
        grad: "resident_happy",
        anim: "bounce"
      },
      shock: {
        eyes: `<line x1="30" y1="40" x2="40" y2="50" stroke="#111" stroke-width="3"/><line x1="40" y1="40" x2="30" y2="50" stroke="#111" stroke-width="3"/>
               <line x1="60" y1="40" x2="70" y2="50" stroke="#111" stroke-width="3"/><line x1="70" y1="40" x2="60" y2="50" stroke="#111" stroke-width="3"/>`,
        mouth: `<circle cx="50" cy="65" r="6" fill="none" stroke="#111" stroke-width="3"/>`,
        grad: "resident_error",
        anim: "shake"
      }
    };

    const config = faces[mood] || faces.normal;
    const initial = name ? name[0].toUpperCase() : "R";

    const svgContent = `
      ${config.eyes}
      <circle cx="25" cy="55" r="4" fill="rgba(255,100,100,0.3)" />
      <circle cx="75" cy="55" r="4" fill="rgba(255,100,100,0.3)" />
      ${config.mouth}
    `;

    return this._generate(svgContent, config.grad, config.anim, initial);
  },

  boss(mood = "normal") {
    const faces = {
      normal: {
        eyes: `<rect x="25" y="42" width="50" height="8" rx="2" fill="#111"/>`,
        mouth: `<line x1="40" y1="70" x2="60" y2="70" stroke="#111" stroke-width="3" stroke-linecap="round"/>`
      },
      angry: {
        eyes: `<rect x="25" y="42" width="50" height="8" rx="2" fill="#ff0044"/>
               <path d="M25 35 L50 45 L75 35" fill="none" stroke="#111" stroke-width="2"/>`,
        mouth: `<path d="M40 70 Q50 65 60 70" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>`
      }
    };

    const config = faces[mood] || faces.normal;
    const svgContent = `
      ${config.eyes}
      ${mood === 'normal' ? '' : '<path d="M85 20 L95 10" stroke="#ff0044" stroke-width="4" />'}
      ${config.mouth}
    `;

    return this._generate(svgContent, "boss", mood === 'angry' ? 'shake' : '', "BOSS");
  }
};

const Game = (() => {
  const state = {
    lives: GAME_CONFIG.maxLives,
    timeLeft: GAME_CONFIG.turnSeconds,
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
    resident: "Aguilar",
    residentIndex: 0,
    turnSeconds: GAME_CONFIG.baseTurnSeconds, // Dinámico
    residents: ["Aguilar", "Solis"],
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
      // Normalizar registros antiguos (que eran solo strings) a objetos de Repaso Espaciado
      return raw.map(item => {
        if (typeof item === 'string') {
          return { caseId: item, level: 0, nextReview: 0 };
        }
        return item;
      });
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
    if (!caseId || !caseId.startsWith("REAL_")) return; // Solo guardar casos clínicos reales para el repaso
    let failed = getFailedCases();
    let existing = failed.find(item => item.caseId === caseId);
    if (!existing) {
      failed.push({ caseId, level: 0, nextReview: Date.now() });
    } else {
      // Si ya existía, pero se volvió a fallar, se reinicia el nivel de maestría y se programa inmediato
      existing.level = 0;
      existing.nextReview = Date.now();
    }
    localStorage.setItem('psycase_failed_cases', JSON.stringify(failed));
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
      localStorage.setItem('psycase_failed_cases', JSON.stringify(failed));
    }
  }

  function getBriefFeedback(caseObj, task) {
    const rationale = caseObj?.explanation?.rationale || task?.rationale || "";
    if (!rationale) return "Evalúa el riesgo inmediato y prioriza lo defendible.";
    const firstSentence = rationale.match(/[^.!?]+[.!?]/);
    return firstSentence ? firstSentence[0] : rationale.slice(0, 160) + "…";
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

  function splitCaseText(text) {
    const clean = normalizeCaseText(text);
    if (!clean) return { summary: "", details: "" };
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
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
            ${dueList.length > 0 ? `📖 Repasar Errores (${dueList.length} listos / ${failedList.length} total)` : `✅ Repaso al día (${failedList.length} en maestría)`}
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
      </div>

      <div class="miami-card">
        <div class="narrative-title">${escapeHtml(NARRATIVE.welcomeTitle)}</div>
        <ul class="rules-list">
           ${NARRATIVE.rules.slice(0, 3).map(r => `<li>${escapeHtml(r)}</li>`).join("")}
        </ul>
      </div>
    `;

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
                  <div class="achievement-badge" title="${a.name}">${a.icon}</div>
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
                ${dueList.length > 0 ? `Repasar Errores (${dueList.length} listos / ${failedList.length} total)` : `Repaso al día (${failedList.length} en maestría)`}
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
      location.reload();
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
      location.reload();
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
    state.residentIndex = 0;
    state.residentMood = "normal";
    state.bossMood = "normal";
    state.hintUsedInTurn = false;
    state.solvedCasesCount = 0;
    state.currentTaskIndex = 0;

    // Read filters
    const selectLevel = $("#selectLevel");
    const selectDifficulty = $("#selectDifficulty");
    state.filters.educational_level = selectLevel ? selectLevel.value : "";
    state.filters.difficulty = selectDifficulty ? selectDifficulty.value : "";

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

    hud.innerHTML = `
      <div class="miami-card">
        <div class="hudRow">
          <div class="hudBox">
            <div class="avatar" id="resBox">${Avatars.resident(state.resident, state.residentMood)}</div>
            <div>
              <div class="badge">Dra. ${escapeHtml(state.resident)}</div>
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
              <div style="font-weight:900; font-style:italic;">${state.studyMode ? 'EDUCANDO' : (state.lives <= 1 ? "¡FURIOSO!" : "VIGILANDO")}</div>
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
             <button class="btn-powerup" id="btnHint" ${Economy.getCoins() < 50 || state.hintUsedInTurn ? 'disabled' : ''}>
               <span>💡</span> Consultar (50)
             </button>
             <button class="btn-powerup" id="btnSoundToggle" title="Activar/Silenciar sonido">
               <span>${state.soundEnabled ? '🔊' : '🔇'}</span>
             </button>
             <button class="btn-powerup" id="btnAutoToggle" title="Auto-avance de retroalimentación">
               <span>${state.autoAdvance ? '⏱️ Auto' : '⏸️ Manual'}</span>
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
    ].sort(() => Math.random() - 0.5);

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

    const ecgClass = getPatientEcgClass(c);
    const ecgSvg = `
      <svg viewBox="0 0 100 30" class="ecg-svg" aria-hidden="true">
        <path d="M 0 15 L 30 15 L 35 12 L 40 18 L 45 15 L 48 5 L 52 28 L 56 15 L 60 17 L 65 15 L 100 15" class="ecg-line ${ecgClass}"></path>
      </svg>
    `;

    root.innerHTML = `
      <div class="miami-card case-card">
        <div class="caseHeader">
          <div class="caseTitle">${escapeHtml(getCaseTitle(c))}</div>
          ${ecgSvg}
          <div class="caseBadge">${escapeHtml(progressBadge)}</div>
        </div>
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
        state.lives -= 1;
        
        // Guardar caso en la lista de fallados
        saveFailedCase(state.current?.case_id);

        renderHUD();
        if (state.lives <= 0) {
          handleDeath();
        } else {
          // Time out moves to next case
          nextCase();
        }
      }
    }, 100);
  }

  async function nextCase() {
    if (state.lives <= 0) return handleDeath();
    
    // Cleanup feedback if exists
    clearTimeout(state.recentFeedbackTimer);
    const overlay = $("#modalRoot");
    if (overlay) overlay.innerHTML = "";

    state.resident = state.residents[state.residentIndex];
    state.residentIndex = (state.residentIndex + 1) % state.residents.length;
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
      console.warn("Error loading filtered cases from DB, falling back to Generator:", err);
      if (state.reviewMode) {
        showReviewSuccess();
        return;
      }
      state.useGenerator = true;
      state.current = Generator.createCase(state.filters);
    }

    if (state.current?.case_id) {
      state.recentCases.unshift(state.current.case_id);
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

    root.innerHTML = `
      <div class="feedback-overlay show" style="border-color:${ok ? "rgba(57,255,20,0.4)" : "rgba(255,0,85,0.4)"}; cursor: default;">
        <div class="feedback-header">
          <div style="font-size:32px;">${ok ? "💎" : "⚠️"}</div>
          <div class="feedback-status" style="color:${ok ? "#39ff14" : "#ff0055"}">
            ${ok ? "EXCELENTE" : "ERROR CLÍNICO"}
          </div>
        </div>
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

    if (state.lives <= 0) {
      setTimeout(handleDeath, 800);
    } else {
      // Correct option text extraction
      const selectedTextEl = btn.querySelector('.option-text');
      const selectedText = selectedTextEl ? selectedTextEl.innerText : btn.innerText;

      setTimeout(() => showSmartFeedback(ok, task, selectedText), GAME_CONFIG.modalDelayMs);
    }
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
