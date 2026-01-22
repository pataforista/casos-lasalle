"use strict";

const GAME_CONFIG = {
  maxLives: 3,
  turnSeconds: 30,
  modalDelayMs: 450
};

const Avatars = {
  _generate(emoji, color, animation, badge = "") {
    return `
      <div class="kawaii-avatar" style="background: ${color}; animation-name: ${animation};">
        ${emoji}
        ${badge ? `<div class="kawaii-tag">${badge}</div>` : ""}
      </div>
    `;
  },
  resident(name, mood = "normal") {
    const moodConfig = {
      happy: { emoji: "🥰", color: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", anim: "float" },
      shock: { emoji: "😱", color: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", anim: "shake" },
      normal: { emoji: "😺", color: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", anim: "float" },
      sad: { emoji: "🥺", color: "linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)", anim: "float" }
    };
    const config = moodConfig[mood] || moodConfig.normal;
    const initial = name ? name[0].toUpperCase() : "R";
    return this._generate(config.emoji, config.color, config.anim, initial);
  },
  boss(mood = "normal") {
    const moodConfig = {
      angry: { emoji: "🤬", color: "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)", anim: "shake" },
      normal: { emoji: "😎", color: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", anim: "float" },
      sus: { emoji: "🧐", color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", anim: "pulse" }
    };
    const config = moodConfig[mood] || moodConfig.normal;
    return this._generate(config.emoji, config.color, config.anim, "👑");
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
    casesReady: false,
    useGenerator: false,
    streak: 0,
    maxStreak: 0
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
      caseRoot.innerHTML = `
        <div class="miami-card">
          <div style="color:rgba(0,243,255,.9);font-weight:900;">Demo integrada (modo modular)</div>
          <div style="color:rgba(255,255,255,.75);margin-top:8px;">
            Inicia un turno para ver HUD, timer, vidas, feedback y economía como en tu demo.
          </div>
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
    if (!t) {
      return {
        instruction: "Elige la opción más probable.",
        expected_answer: "Respuesta correcta (demo)",
        distractors: ["Distractor A", "Distractor B", "Distractor C"],
        rationale: "Explicación demo: aquí va la racional clínica."
      };
    }
    return t;
  }

  function renderCase(){
    const root = $("#caseRoot");
    if (!root || !state.current) return;

    const c = state.current;
    const chunks = Array.isArray(c.source_chunks) ? c.source_chunks : [];
    const text = chunks.map(x => x.text_content).filter(Boolean).join("\n\n") || "";

    const task = pickTask(c);

    const options = [
      { t: task.expected_answer, ok: true },
      ...(Array.isArray(task.distractors) ? task.distractors : []).map(d => ({ t: d, ok:false }))
    ].sort(() => Math.random() - 0.5);

    root.innerHTML = `
      <div class="miami-card">
        <div class="caseTitle">${escapeHtml(c.title || c.case_id || "Caso")}</div>
        <div class="caseBody">${escapeHtml(text || task.instruction || "")}</div>
      </div>
      <div class="options">
        ${options.map(o => `<button class="option-btn" data-ok="${o.ok ? "1":"0"}">${escapeHtml(String(o.t))}</button>`).join("")}
      </div>
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

    state.resident = Math.random() > 0.5 ? "Aguilar" : "Solis";
    try {
      if (state.useGenerator) {
        state.current = Generator.createCase();
      } else {
        state.current = await CaseDB.pickRandomCase({}); // si quieres filtros, los conectamos luego
      }
    } catch (err) {
      if (typeof logDebug === "function") {
        logDebug(`[cases] pick failed: ${String(err)}`);
      }
      state.useGenerator = true;
      state.current = Generator.createCase();
    }

    renderHUD();
    renderCase();
    startTimer();
  }

  function showModal(ok, task){
    const modal = $("#modalRoot");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal">
        <div class="modalCard" style="border-color:${ok ? "rgba(120,255,140,.55)" : "rgba(255,80,80,.65)"}">
          <div style="font-size:64px; margin-bottom:10px;">${ok ? "💎" : "⚠️"}</div>
          <div style="font-weight:900; font-size:36px; font-style:italic; color:${ok ? "rgba(120,255,140,.95)" : "rgba(255,80,80,.95)"}">
            ${ok ? "BRILLANTE" : "ERROR"}
          </div>
          <div style="margin-top:12px; color:rgba(255,255,255,.82); line-height:1.5; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.10); padding:12px; border-radius:18px;">
            ${escapeHtml(task.rationale || "")}
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
  }

  return { init };
})();

window.addEventListener("DOMContentLoaded", () => Game.init());
