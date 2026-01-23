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
  _generate(avatar, color, animation, badge = "") {
    return `
      <div class="kawaii-avatar" style="background: ${color}; animation-name: ${animation};">
        ${avatar}
        ${badge ? `<div class="kawaii-tag">${badge}</div>` : ""}
      </div>
    `;
  },
  resident(name, mood = "normal") {
    const moodConfig = {
      happy: { avatar: "resident-smile", color: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", anim: "float" },
      shock: { avatar: "resident-shock", color: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", anim: "shake" },
      normal: { avatar: "resident-neutral", color: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", anim: "float" },
      sad: { avatar: "resident-sad", color: "linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)", anim: "float" }
    };
    const config = moodConfig[mood] || moodConfig.normal;
    const initial = name ? name[0].toUpperCase() : "R";
    const svg = this._renderAvatar(config.avatar);
    return this._generate(svg, config.color, config.anim, initial);
  },
  boss(mood = "normal") {
    const moodConfig = {
      angry: { avatar: "boss-angry", color: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)", anim: "shake" },
      normal: { avatar: "boss-cool", color: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", anim: "float" },
      sus: { avatar: "boss-sus", color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", anim: "pulse" }
    };
    const config = moodConfig[mood] || moodConfig.normal;
    const svg = this._renderAvatar(config.avatar);
    return this._generate(svg, config.color, config.anim, "👑");
  },
  _renderAvatar(type) {
    const faces = {
      "resident-neutral": { mouth: "M20 32h24", brow: "", eyes: "M18 24q4-4 8 0M38 24q4-4 8 0", blush: true },
      "resident-smile": { mouth: "M18 30c6 8 22 8 28 0", brow: "", eyes: "M18 24q4-4 8 0M38 24q4-4 8 0", blush: true },
      "resident-shock": { mouth: "M28 30a6 6 0 1 0 12 0a6 6 0 1 0 -12 0", brow: "M14 18h14M36 18h14", eyes: "M20 24h6M40 24h6" },
      "resident-sad": { mouth: "M18 34c6-6 22-6 28 0", brow: "M14 20h14M36 20h14", eyes: "M18 26q4-4 8 0M38 26q4-4 8 0", blush: true },
      "boss-cool": { mouth: "M18 34h28", brow: "M12 20h18M34 20h18", eyes: "M18 26q4-4 8 0M38 26q4-4 8 0" },
      "boss-angry": { mouth: "M18 34h28", brow: "M12 22l16-6M36 16l16 6", eyes: "M18 28h8M40 28h8" },
      "boss-sus": { mouth: "M20 34h24", brow: "M12 20h16M36 16h16", eyes: "M18 26q4-4 8 0M38 24q4-2 8 2" }
    };
    const face = faces[type] || faces["resident-neutral"];
    return `
      <svg class="avatar-svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="rgba(255,255,255,0.2)"></circle>
        <circle cx="22" cy="38" r="4" fill="${face.blush ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)"}"></circle>
        <circle cx="42" cy="38" r="4" fill="${face.blush ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)"}"></circle>
        <path d="${face.eyes}" stroke="rgba(0,0,0,0.75)" stroke-width="2.4" stroke-linecap="round" fill="none"></path>
        <path d="${face.brow}" stroke="rgba(0,0,0,0.65)" stroke-width="2.2" stroke-linecap="round" fill="none"></path>
        <path d="${face.mouth}" stroke="rgba(0,0,0,0.75)" stroke-width="2.6" stroke-linecap="round" fill="none"></path>
      </svg>
    `;
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
        <div class="miami-card">
          <div>
            <h1 class="titleLogo">PsyCase</h1>
            <div class="subLogo">KAWAII VICE CITY</div>
          </div>
          <div class="hudRow">
          <div class="hudBox">
            <div>
              <div class="badge">Rango</div>
              <div class="value">${escapeHtml(Economy.getRank())}</div>
            </div>
          </div>
            <div class="hudBox">
              <div>
                <div class="badge">Efectivo</div>
              <div class="value">🪙 ${Economy.getCoins()}</div>
            </div>
          </div>
          <button class="btn-action" id="btnStart">Iniciar turno</button>
        </div>
      </div>
      `;
    }

    if (caseRoot) {
      const residentQuote = NARRATIVE.residents[Math.floor(Math.random() * NARRATIVE.residents.length)];
      caseRoot.innerHTML = `
        <div class="miami-card">
          <div class="welcome-title">${escapeHtml(NARRATIVE.welcomeTitle)}</div>
          <div class="welcome-subtitle">${escapeHtml(NARRATIVE.welcomeSubtitle)}</div>
          <ul class="rules-list">
            ${NARRATIVE.rules.map(rule => `<li>${escapeHtml(rule)}</li>`).join("")}
          </ul>
        </div>
        <div class="miami-card">
          <div class="narrative-title">${escapeHtml(NARRATIVE.title)}</div>
          <div class="narrative-body">${escapeHtml(NARRATIVE.intro)}</div>
          <div class="narrative-body">${escapeHtml(NARRATIVE.premise)}</div>
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

  function showModal(ok, task){
    const modal = $("#modalRoot");
    if (!modal) return;
    const briefFeedback = getBriefFeedback(task);

    modal.innerHTML = `
      <div class="modal">
        <div class="modalCard" style="border-color:${ok ? "rgba(120,255,140,.55)" : "rgba(255,80,80,.65)"}">
          <div style="font-size:64px; margin-bottom:10px;">${ok ? "💎" : "⚠️"}</div>
          <div style="font-weight:900; font-size:36px; font-style:italic; color:${ok ? "rgba(120,255,140,.95)" : "rgba(255,80,80,.95)"}">
            ${ok ? "BRILLANTE" : "ERROR"}
          </div>
          <div class="modalNote">${escapeHtml(ok ? "Decisión defendible con la información disponible." : "La omisión también es una decisión.")}</div>
          <div class="modalFeedback">${escapeHtml(briefFeedback)}</div>
          ${task.rationale ? `
            <details class="modalDetails">
              <summary>Ver explicación completa</summary>
              <div class="modalFull">${escapeHtml(task.rationale)}</div>
            </details>
          ` : ""}
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

    if (ok) {
      btn.classList.add("correct");
      state.streak += 1;
      state.maxStreak = Math.max(state.maxStreak, state.streak);
      const bonus = Math.min(75, state.streak * 5);
      Economy.add(25 + bonus, 50);
      const resBox = $("#resBox");
      if (resBox) resBox.innerHTML = Avatars.resident(state.resident, "happy");
    } else {
      btn.classList.add("incorrect");
      state.lives -= 1;
      state.streak = 0;
      const resBox = $("#resBox");
      if (resBox) resBox.innerHTML = Avatars.resident(state.resident, "shock");
      const bossBox = $("#bossBox");
      if (bossBox) bossBox.innerHTML = Avatars.boss("angry");
    }

    renderHUD();

    if (state.lives <= 0) return renderMenu();
    setTimeout(() => {
      if (state.lives > 0) showModal(ok, task);
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

  return { init };
})();

window.addEventListener("DOMContentLoaded", () => Game.init());
