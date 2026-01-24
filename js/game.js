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
    // Unique ID for gradients to prevent conflicts if multiple avatars render
    const uid = Math.random().toString(36).substr(2, 5);
    const gradId = `grad_${uid}`;
    
    // Gradient definitions based on type
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
          <!-- Face Base -->
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
      happy: { // Acierto
        eyes: `<path d="M30 45 Q35 40 40 45" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>
               <path d="M60 45 Q65 40 70 45" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>`,
        mouth: `<path d="M35 60 Q50 75 65 60" fill="#ff6b6b" stroke="none"/>`, // Open mouth smile
        grad: "resident_happy",
        anim: "bounce" // CSS class expected
      },
      shock: { // Error
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
      <!-- Eyes -->
      ${config.eyes}
      <!-- Cheeks -->
      <circle cx="25" cy="55" r="4" fill="rgba(255,100,100,0.3)" />
      <circle cx="75" cy="55" r="4" fill="rgba(255,100,100,0.3)" />
      <!-- Mouth -->
      ${config.mouth}
    `;

    return this._generate(svgContent, config.grad, config.anim, initial);
  },

  boss(mood = "normal") {
    const faces = {
      normal: {
        eyes: `<rect x="25" y="42" width="50" height="8" rx="2" fill="#111"/>`, // Visor
        mouth: `<line x1="40" y1="70" x2="60" y2="70" stroke="#111" stroke-width="3" stroke-linecap="round"/>`
      },
      angry: { // Error grave
        eyes: `<rect x="25" y="42" width="50" height="8" rx="2" fill="#ff0044"/>
               <path d="M25 35 L50 45 L75 35" fill="none" stroke="#111" stroke-width="2"/>`, // Angry brows
        mouth: `<path d="M40 70 Q50 65 60 70" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>`
      }
    };

    const config = faces[mood] || faces.normal;
    // Boss uses same gradient always for consistency, or we could vary it
    const svgContent = `
      <!-- Boss Visor/Eyes -->
      ${config.eyes}
      ${mood === 'normal' ? '' : '<path d="M85 20 L95 10" stroke="#ff0044" stroke-width="4" />'} <!-- Stress mark -->
      <!-- Mouth -->
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
    recentCases: []
  };

  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function getBriefFeedback(task) {
    const raw = String(task?.rationale || "").trim();
    if (!raw) {
      return "Evalúa el riesgo inmediato y prioriza lo defendible con la información disponible.";
    }
    const match = raw.match(/[^.!?]+[.!?]/);
    const sentence = match ? match[0] : raw;
    const trimmed = sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
    return trimmed;
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

    if (ok && !reason) {
      reason = rationale;
    }

    return {
      reason,
      rationale,
      takeHome
    };
  }

  function getCaseTitle(caseObj) {
    const fallback = "Caso clínico";
    if (!caseObj) return fallback;
    if (caseObj.display_title) return String(caseObj.display_title);
    return fallback;
  }

  function normalizeCaseText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/\s+\)/g, ")")
      .replace(/\(\s+/g, "(")
      .trim();
  }

  function splitCaseText(text) {
    const clean = normalizeCaseText(text);
    if (!clean) return { summary: "", details: "" };

    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    let summary = sentences.slice(0, 2).join(" ").trim();
    let details = sentences.slice(2).join(" ").trim();

    if (!summary) summary = clean;
    if (!details && clean.length > 240) {
      summary = `${clean.slice(0, 240).trim()}…`;
      details = clean.slice(240).trim();
    }
    if (summary.length > 280) {
      summary = `${summary.slice(0, 277).trim()}…`;
    }

    return { summary, details };
  }

  function renderMenu(){
    const hud = $("#hudRoot");
    const caseRoot = $("#caseRoot");
    const modal = $("#modalRoot");
    if (modal) modal.innerHTML = "";

    if (hud) {
      hud.innerHTML = `
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
      `;
    }

    if (caseRoot) {
      const residentQuote = NARRATIVE.residents[Math.floor(Math.random() * NARRATIVE.residents.length)];
      caseRoot.innerHTML = `
        <div class="miami-card">
          <div class="narrative-title">${escapeHtml(NARRATIVE.title)}</div>
          <div class="narrative-body">${escapeHtml(NARRATIVE.intro)}</div>
          <details class="caseDetails">
            <summary>Ver reglas rápidas</summary>
            <ul class="rules-list">
              ${NARRATIVE.rules.map(rule => `<li>${escapeHtml(rule)}</li>`).join("")}
            </ul>
          </details>
          <div class="narrative-quote">${escapeHtml(residentQuote)}</div>
          <div class="narrative-footer">${escapeHtml(NARRATIVE.boss)}</div>
        </div>
      `;
    }

    const btn = $("#btnStart");
    if (btn) btn.onclick = () => startTurn();
  }

  async function ensureCasesLoaded(){
    if (state.casesReady) return true;
    try {
      await CaseDB.init();
      state.casesReady = true;
      state.useGenerator = false;
      return true;
    } catch (err) {
      if (typeof logDebug === "function") {
        logDebug(`[cases] init failed: ${String(err)}`);
      }
      state.useGenerator = true;
      return false;
    }
  }

  async function startTurn(){
    ensureAudio();
    playTone(520, 0.08);
    state.lives = GAME_CONFIG.maxLives;
    state.streak = 0;
    state.maxStreak = 0;
    state.recentCases = [];
    state.residentIndex = 0;
    await ensureCasesLoaded();
    await nextCase();
  }

  function renderHUD(){
    const hud = $("#hudRoot");
    if (!hud) return;

    const hearts = "💖".repeat(state.lives);
    const bossMood = state.lives <= 1 ? "angry" : "normal";
    const resMood = "normal";
    const streakLabel = state.streak >= 3 ? "RACHA" : "COMBO";

    hud.innerHTML = `
      <div class="miami-card">
        <div class="hudRow">
          <div class="hudBox">
            <div class="avatar" id="resBox">${Avatars.resident(state.resident, resMood)}</div>
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
            <div class="avatar" id="bossBox">${Avatars.boss(bossMood)}</div>
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

  function pickTask(caseObj){
    // Tomamos la 1a tarea si existe; si no, fabricamos una “tarea demo” mínima
    const t = (caseObj.tasks && caseObj.tasks[0]) ? caseObj.tasks[0] : null;
    const base = {
      instruction: "Analiza el caso y responde según la información disponible.",
      expected_answer: "Conducta más adecuada",
      distractors: ["Distractor A", "Distractor B", "Distractor C"],
      rationale: "Justificación breve basada en signos clínicos, contexto y riesgo."
    };
    if (!t) return base;
    return {
      ...base,
      ...t,
      question: t.question || ""
    };
  }

  function renderCase(){
    const root = $("#caseRoot");
    if (!root || !state.current) return;

    const c = state.current;
    const chunks = Array.isArray(c.source_chunks) ? c.source_chunks : [];
    const text = chunks
      .map(x => normalizeCaseText(x.text_content))
      .filter(Boolean)
      .join("\n\n") || "";

    const task = pickTask(c);
    const bodyText = text || task.instruction || "";
    const { summary, details } = splitCaseText(bodyText);
    const questionText = normalizeCaseText(task.question || task.instruction || "");
    const consequenceText = state.streak >= 3 ? NARRATIVE.consequence : "";

    const options = [
      { t: task.expected_answer, ok: true },
      ...(Array.isArray(task.distractors) ? task.distractors : []).map(d => ({ t: d, ok:false }))
    ].sort(() => Math.random() - 0.5);

    const caseNumber = state.recentCases.length || 1;

    root.innerHTML = `
      <div class="miami-card case-card">
        <div class="caseHeader">
          <div class="caseTitle">${escapeHtml(getCaseTitle(c))}</div>
          <div class="caseBadge">Caso ${caseNumber}</div>
        </div>
        <div class="caseSummary">
          <div class="caseLabel">Lectura rápida</div>
          <div class="caseBody">${escapeHtml(summary || bodyText)}</div>
        </div>
        ${details ? `
          <details class="caseDetails">
            <summary>Ver detalles clínicos</summary>
            <div class="caseBody">${escapeHtml(details)}</div>
          </details>
        ` : ""}
        ${questionText ? `<div class="caseQuestion">${escapeHtml(questionText)}</div>` : ""}
        ${consequenceText ? `<div class="caseAside">${escapeHtml(consequenceText)}</div>` : ""}
      </div>
      <div class="options">
        ${options.map((o, idx) => `
          <button class="option-btn" data-ok="${o.ok ? "1":"0"}" data-index="${idx + 1}">
            <span class="option-index">${idx + 1}</span>
            <span class="option-text">${escapeHtml(String(o.t))}</span>
          </button>
        `).join("")}
      </div>
      <div class="options-hint">Atajos: teclas 1-4 para responder rápido.</div>
    `;

    root.querySelectorAll(".option-btn").forEach(btn => {
      btn.onclick = () => checkAnswer(btn, btn.dataset.ok === "1", task);
    });
  }

  function startTimer(){
    clearInterval(state.timer);
    state.timeLeft = GAME_CONFIG.turnSeconds;
    state.timerStart = Date.now();

    state.timer = setInterval(() => {
      const elapsed = (Date.now() - state.timerStart) / 1000;
      state.timeLeft = Math.max(0, GAME_CONFIG.turnSeconds - elapsed);
      const pct = Math.max(0, (state.timeLeft / GAME_CONFIG.turnSeconds) * 100);
      const b = $("#tBar");
      if (b) b.style.width = pct + "%";
      const track = b ? b.closest(".track") : null;
      if (track) {
        track.classList.toggle("track--danger", state.timeLeft <= 5);
      }

      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        state.lives -= 1;
        if (state.lives <= 0) return renderMenu();
        nextCase();
      }
    }, 100);
  }

  async function nextCase(){
    if (state.lives <= 0) return renderMenu();

    state.resident = state.residents[state.residentIndex];
    state.residentIndex = (state.residentIndex + 1) % state.residents.length;
    try {
      if (state.useGenerator) {
        state.current = Generator.createCase();
      } else {
        state.current = await CaseDB.pickRandomCase({
          excludeCaseIds: state.recentCases
        }); // si quieres filtros, los conectamos luego
      }
    } catch (err) {
      if (typeof logDebug === "function") {
        logDebug(`[cases] pick failed: ${String(err)}`);
      }
      state.useGenerator = true;
      state.current = Generator.createCase();
    }

    if (state.current?.case_id) {
      state.recentCases.unshift(state.current.case_id);
      state.recentCases = state.recentCases.slice(0, 8);
    }

    renderHUD();
    renderCase();
    startTimer();
  }

  function showModal(ok, task, selectedText){
    const modal = $("#modalRoot");
    if (!modal) return;
    const briefFeedback = getBriefFeedback(task);
    const details = getExplanationPayload(state.current, task, selectedText, ok);
    const reasonText = details.reason || briefFeedback;

    modal.innerHTML = `
      <div class="modal">
        <div class="modalCard" style="border-color:${ok ? "rgba(120,255,140,.55)" : "rgba(255,80,80,.65)"}">
          <div class="modalContent">
            <div style="font-size:64px; margin-bottom:10px;">${ok ? "💎" : "⚠️"}</div>
            <div style="font-weight:900; font-size:36px; font-style:italic; color:${ok ? "rgba(120,255,140,.95)" : "rgba(255,80,80,.95)"}">
              ${ok ? "BRILLANTE" : "ERROR"}
            </div>
            <div class="modalNote">${escapeHtml(ok ? "Decisión defendible con la información disponible." : "La omisión también es una decisión.")}</div>
            <div class="modalSection">
              <div class="modalSectionTitle">Razón</div>
              <div class="modalFeedback">${escapeHtml(reasonText)}</div>
            </div>
            ${details.rationale ? `
              <details class="modalDetails">
                <summary>Ver explicación completa</summary>
                <div class="modalFull">${escapeHtml(details.rationale)}</div>
              </details>
            ` : ""}
            ${details.takeHome ? `<div class="take-home">Take home: ${escapeHtml(details.takeHome)}</div>` : ""}
          </div>
          <button class="btn-action" id="btnContinue">Continuar</button>
        </div>
      </div>
    `;

    const btn = $("#btnContinue");
    if (btn) btn.onclick = () => {
      modal.innerHTML = "";
      nextCase();
    };
  }

  function checkAnswer(btn, ok, task){
    clearInterval(state.timer);
    document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
    const selectedText = btn?.querySelector(".option-text")?.textContent || btn?.textContent || "";

    if (ok) {
      btn.classList.add("correct");
      state.streak += 1;
      state.maxStreak = Math.max(state.maxStreak, state.streak);
      const bonus = Math.min(75, state.streak * 5);
      Economy.add(25 + bonus, 50);
      const resBox = $("#resBox");
      if (resBox) resBox.innerHTML = Avatars.resident(state.resident, "happy");
      playTone(880, 0.12);
    } else {
      btn.classList.add("incorrect");
      state.lives -= 1;
      state.streak = 0;
      const resBox = $("#resBox");
      if (resBox) resBox.innerHTML = Avatars.resident(state.resident, "shock");
      const bossBox = $("#bossBox");
      if (bossBox) bossBox.innerHTML = Avatars.boss("angry");
      playTone(220, 0.16);
    }

    renderHUD();

    if (state.lives <= 0) return renderMenu();
    setTimeout(() => {
      if (state.lives > 0) showModal(ok, task, selectedText);
    }, GAME_CONFIG.modalDelayMs);
  }

  function init(){
    renderMenu();
    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "d") return;
      const modal = $("#modalRoot");
      if (modal && modal.querySelector(".modal")) return;
      const targetIndex = parseInt(event.key, 10);
      if (Number.isNaN(targetIndex)) return;
      const btn = document.querySelector(`.option-btn[data-index="${targetIndex}"]`);
      if (btn && !btn.disabled) btn.click();
    });
  }

  let audioContext = null;

  function ensureAudio() {
    if (audioContext) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext = new Context();
  }

  function playTone(freq, duration = 0.12) {
    ensureAudio();
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    osc.stop(audioContext.currentTime + duration + 0.02);
  }

  return { init };
})();

window.addEventListener("DOMContentLoaded", () => Game.init());
