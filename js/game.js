"use strict";

/* Mini-economía local (no depende de nada) */
const Economy = (() => {
  const KEY = "psycase_demo_econ_v1";
  const state = JSON.parse(localStorage.getItem(KEY) || '{"coins":0,"xp":0}');
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function add(coins=0, xp=0){ state.coins += coins; state.xp += xp; save(); }
  function getCoins(){ return state.coins; }
  function getRank(){
    const xp = state.xp;
    if (xp >= 600) return "Jefe";
    if (xp >= 300) return "Adjunto";
    if (xp >= 150) return "R2";
    if (xp >= 50) return "R1";
    return "Interno";
  }
  return { add, getCoins, getRank };
})();

/* Avatares (placeholder simple). Si ya tienes SVGs, sustitúyelos aquí. */
const Avatars = {
  resident(name, mood="normal"){
    const face = mood === "happy" ? "😄" : mood === "shock" ? "😱" : "🙂";
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:30px;">${face}</div>`;
  },
  boss(mood="normal"){
    const face = mood === "angry" ? "😡" : "🧐";
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:30px;">${face}</div>`;
  }
};

const Game = (() => {
  const state = {
    lives: 3,
    timeLeft: 30,
    timer: null,
    current: null,
    resident: "Aguilar"
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

  async function startTurn(){
    state.lives = 3;
    await CaseDB.loadAll();
    nextCase();
  }

  function renderHUD(){
    const hud = $("#hudRoot");
    if (!hud) return;

    const hearts = "💖".repeat(state.lives);
    const bossMood = state.lives <= 1 ? "angry" : "normal";
    const resMood = "normal";

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
    state.timeLeft = 30;

    state.timer = setInterval(() => {
      state.timeLeft -= 0.1;
      const pct = Math.max(0, (state.timeLeft / 30) * 100);
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

  function nextCase(){
    if (state.lives <= 0) return renderMenu();

    state.resident = Math.random() > 0.5 ? "Aguilar" : "Solis";
    state.current = CaseDB.pickRandomCase({}); // si quieres filtros, los conectamos luego

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
      Economy.add(25, 50);
      const resBox = $("#resBox");
      if (resBox) resBox.innerHTML = Avatars.resident(state.resident, "happy");
    } else {
      btn.classList.add("incorrect");
      state.lives -= 1;
      const resBox = $("#resBox");
      if (resBox) resBox.innerHTML = Avatars.resident(state.resident, "shock");
      const bossBox = $("#bossBox");
      if (bossBox) bossBox.innerHTML = Avatars.boss("angry");
    }

    renderHUD();

    if (state.lives <= 0) return renderMenu();
    setTimeout(() => showModal(ok, task), 450);
  }

  function init(){
    renderMenu();
  }

  return { init };
})();

window.addEventListener("DOMContentLoaded", () => Game.init());
