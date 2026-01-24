"use strict";

const GAME_CONFIG = {
  maxLives: 3,
  turnSeconds: 30,
  modalDelayMs: 450
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
    resident: "Aguilar",
    residentIndex: 0,
    residents: ["Aguilar", "Solis"],
    casesReady: false,
    useGenerator: false,
    streak: 0,
    maxStreak: 0,
    recentCases: [],
    residentMood: "normal",
    bossMood: "normal"
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

  function getBriefFeedback(task) {
    const raw = String(task?.rationale || "").trim();
    if (!raw) return "Evalúa el riesgo inmediato y prioriza lo defendible.";
    const match = raw.match(/[^.!?]+[.!?]/);
    return match ? match[0] : raw.slice(0, 160) + "…";
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

    root.innerHTML = `
      <div class="miami-card hero-card">
        <div class="hero-title">PsyCase</div>
        <div class="hero-subtitle">Guardia crítica · decide en segundos</div>
        <div class="hero-grid">
          <div class="hero-pill">⏱️ Tiempo real</div>
          <div class="hero-pill">🩺 Decisiones clínicas</div>
          <div class="hero-pill">🔥 Rachas y recompensas</div>
        </div>
        <button class="btn-action" id="btnStart">Iniciar turno</button>
        <div class="hero-meta">
          <span>Rango: ${escapeHtml(Economy.getRank())}</span>
          <span>🪙 ${Economy.getCoins()}</span>
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
      // Manual fade out before starting
      root.classList.add("fade-out", "screen-transition");
      setTimeout(() => startTurn(), 400);
    };
  }

  function renderGameOver() {
    const modal = $("#modalRoot");

    Economy.registerGame(state.maxStreak);
    const stats = Economy.getStats();
    const achievements = Economy.checkAchievements();
    const unlocked = Economy.getUnlockedAchievements();

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
            <button class="option-btn" id="btnMenu" style="justify-content:center; text-align:center;">Volver al Menú</button>
          </div>
        </div>
      </div>
    `;

    $("#btnRestart").onclick = () => {
      modal.innerHTML = "";
      startTurn();
    };
    $("#btnMenu").onclick = () => {
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

  async function startTurn() {
    ensureAudio();
    playTone(520, 0.08);

    // Reset state
    state.lives = GAME_CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.recentCases = [];
    state.residentIndex = 0;
    state.residentMood = "normal";
    state.bossMood = "normal";

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

    const hearts = "💖".repeat(state.lives);
    const streakLabel = state.streak >= 3 ? "RACHA" : "COMBO";

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
            <div class="track-label">TIEMPO</div>
          </div>

          <div class="hudBox">
            <div>
              <div class="badge">Dr. Celada</div>
              <div style="font-weight:900; font-style:italic;">${state.lives <= 1 ? "¡FURIOSO!" : "VIGILANDO"}</div>
              <div style="color:rgba(255,43,214,.9);font-weight:900;">🪙 ${Economy.getCoins()} · ${escapeHtml(Economy.getRank())}</div>
            </div>
            <div class="avatar" id="bossBox">${Avatars.boss(state.bossMood)}</div>
          </div>
        </div>
        <div class="hudMeta">
          <div class="combo-chip">
            <span class="combo-label">${streakLabel}</span>
            <span class="combo-value">x${state.streak}</span>
          </div>
          <div class="combo-chip combo-chip--alt">
            <span class="combo-label">MEJOR</span>
            <span class="combo-value">x${state.maxStreak}</span>
          </div>
        </div>
      </div>
    `;
  }

  function pickTask(caseObj) {
    const t = (caseObj.tasks && caseObj.tasks[0]) ? caseObj.tasks[0] : null;
    const base = {
      instruction: "Analiza el caso y responde.",
      expected_answer: "Conducta adecuada",
      distractors: ["Opción A", "Opción B", "Opción C"],
      rationale: "Justificación clínica."
    };
    return t ? { ...base, ...t, question: t.question || "" } : base;
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
    const task = pickTask(c);
    const bodyText = text || task.instruction;
    const { summary, details } = splitCaseText(bodyText);
    const questionText = normalizeCaseText(task.question || task.instruction);
    const consequenceText = state.streak >= 3 ? NARRATIVE.consequence : "";

    const options = [
      { t: task.expected_answer, ok: true },
      ...(Array.isArray(task.distractors) ? task.distractors : []).map(d => ({ t: d, ok: false }))
    ].sort(() => Math.random() - 0.5);

    root.innerHTML = `
      <div class="miami-card case-card">
        <div class="caseHeader">
          <div class="caseTitle">${escapeHtml(getCaseTitle(c))}</div>
          <div class="caseBadge">Caso ${state.recentCases.length || 1}</div>
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
    state.timeLeft = GAME_CONFIG.turnSeconds;
    state.timerStart = Date.now();

    state.timer = setInterval(() => {
      const elapsed = (Date.now() - state.timerStart) / 1000;
      state.timeLeft = Math.max(0, GAME_CONFIG.turnSeconds - elapsed);
      const pct = (state.timeLeft / GAME_CONFIG.turnSeconds) * 100;

      const b = $("#tBar");
      if (b) b.style.width = pct + "%";

      // Update timer visual alarm
      const track = b ? b.closest(".track") : null;
      if (track) track.classList.toggle("track--danger", state.timeLeft <= 5);

      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        state.lives -= 1;
        renderHUD(); // update hearts
        if (state.lives <= 0) {
          handleDeath();
        } else {
          // Timeout penalty move? No, just lose life and next case? 
          // Logic choice: Timeout = wrong answer essentially.
          // We'll skip to next case for flow.
          nextCase();
        }
      }
    }, 100);
  }

  async function nextCase() {
    // If lives already zero (double check), die.
    if (state.lives <= 0) return handleDeath();

    state.resident = state.residents[state.residentIndex];
    state.residentIndex = (state.residentIndex + 1) % state.residents.length;
    state.residentMood = "normal";
    state.bossMood = state.lives <= 1 ? "angry" : "normal";

    try {
      state.current = state.useGenerator ? Generator.createCase() : await CaseDB.pickRandomCase({ excludeCaseIds: state.recentCases });
    } catch {
      state.useGenerator = true;
      state.current = Generator.createCase();
    }

    if (state.current?.case_id) {
      state.recentCases.unshift(state.current.case_id);
    }

    renderHUD();
    renderCase();
    startTimer();
  }

  function showModal(ok, task, selectedText) {
    const modal = $("#modalRoot");
    const brief = getBriefFeedback(task);
    const details = getExplanationPayload(state.current, task, selectedText, ok);

    modal.innerHTML = `
      <div class="modal">
        <div class="modalCard" style="border-color:${ok ? "rgba(120,255,140,.55)" : "rgba(255,80,80,.65)"}">
          <div class="modalContent">
             <div style="font-size:64px; text-align:center;">${ok ? "💎" : "⚠️"}</div>
             <div style="text-align:center; font-weight:900; font-size:32px; color:${ok ? "#78ff8c" : "#ff5050"}">
               ${ok ? "BRILLANTE" : "ERROR"}
             </div>
             <div class="modalNote" style="text-align:center;">${escapeHtml(ok ? "Bien razonado." : "Cuidado con los detalles.")}</div>
             <div class="modalFeedback">${escapeHtml(details.reason || brief)}</div>
             ${details.rationale ? `<details class="modalDetails"><summary>Explicación</summary><div class="modalFull">${escapeHtml(details.rationale)}</div></details>` : ""}
          </div>
          <button class="btn-action" id="btnContinue">Continuar</button>
        </div>
      </div>
    `;

    $("#btnContinue").onclick = () => {
      modal.innerHTML = "";
      nextCase();
    };
  }

  function handleDeath() {
    clearInterval(state.timer);
    playTone(150, 0.4);
    // Wait a sec then show Game Over
    setTimeout(() => renderGameOver(), 600);
  }

  function checkAnswer(btn, ok, task) {
    clearInterval(state.timer);
    document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);

    if (ok) {
      btn.classList.add("correct");
      state.streak++;
      state.maxStreak = Math.max(state.maxStreak, state.streak);
      Economy.add(25 + (state.streak * 5), 50);
      state.residentMood = "happy";
      playTone(880, 0.12);
    } else {
      btn.classList.add("incorrect");
      state.lives--;
      state.streak = 0;
      state.residentMood = "shock";
      state.bossMood = "angry";
      playTone(220, 0.2);
    }

    renderHUD();

    if (state.lives <= 0) {
      setTimeout(handleDeath, 800);
    } else {
      setTimeout(() => showModal(ok, task, btn?.innerText), GAME_CONFIG.modalDelayMs);
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
