/* ============================================================================
   UI – PsyCase
   Avatares con jerarquía clínica explícita
   ============================================================================ */

const UI = (() => {
  const root = document.getElementById("app");
  if (!root) throw new Error("Elemento #app no encontrado");

  /* ------------------------------------------------------------
     Utilidades de avatar
     ------------------------------------------------------------ */

  function moodColor(mood) {
    return {
      neutral: "#6b7280",
      correct: "#16a34a",
      wrong: "#dc2626"
    }[mood] || "#6b7280";
  }

  function baseAvatar(color, label) {
    return `
      <svg width="80" height="80" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="${color}" />
        <circle cx="35" cy="40" r="5" fill="#fff"/>
        <circle cx="65" cy="40" r="5" fill="#fff"/>
        <path d="M35 65 Q50 75 65 65" stroke="#fff" stroke-width="4" fill="none"/>
        <text x="50" y="95" text-anchor="middle" font-size="10" fill="#fff">
          ${label}
        </text>
      </svg>
    `;
  }

  /* ------------------------------------------------------------
     Avatares (API pública)
     ------------------------------------------------------------ */

  function getAguilar() {
    return baseAvatar(moodColor("neutral"), "Dra. Aguilar");
  }

  function getSolis(mood = "neutral") {
    return baseAvatar(moodColor(mood), "Dra. Solis");
  }

  function getCelada() {
    return baseAvatar(moodColor("neutral"), "Dr. Celada");
  }

  /* ------------------------------------------------------------
     Menú
     ------------------------------------------------------------ */

  function renderMenu(onStart) {
    root.innerHTML = `
      <div class="menu">
        <h1>PsyCase</h1>
        <button id="startBtn">Iniciar</button>
      </div>
    `;
    document
      .getElementById("startBtn")
      .addEventListener("click", () => onStart && onStart());
  }

  /* ------------------------------------------------------------
     Presentación del caso (Aguilar)
     ------------------------------------------------------------ */

  function renderCase({ title, vignette, tasks, onAnswer }) {
    const task = tasks[0];

    root.innerHTML = `
      <div class="case">
        <div class="avatar">${getAguilar()}</div>
        <h2>${title}</h2>
        <p>${vignette || ""}</p>

        <div class="options">
          ${[task.expected_answer, ...task.distractors]
            .sort(() => Math.random() - 0.5)
            .map(
              opt =>
                `<button class="option" data-value="${opt}">${opt}</button>`
            )
            .join("")}
        </div>

        <div id="timer">30</div>
      </div>
    `;

    document.querySelectorAll(".option").forEach(btn => {
      btn.addEventListener("click", () => {
        onAnswer && onAnswer(btn.dataset.value);
      });
    });
  }

  /* ------------------------------------------------------------
     Feedback (Solis + Celada)
     ------------------------------------------------------------ */

  function showFeedback({ correct, rationale, onContinue }) {
    root.innerHTML = `
      <div class="feedback">
        <div class="avatar">
          ${getSolis(correct ? "correct" : "wrong")}
        </div>

        <h2>${correct ? "Correcto" : "Incorrecto"}</h2>

        <div class="avatar">
          ${getCelada()}
        </div>

        <p>${rationale}</p>

        <button id="continueBtn">Continuar</button>
      </div>
    `;

    document
      .getElementById("continueBtn")
      .addEventListener("click", () => onContinue && onContinue());
  }

  /* ------------------------------------------------------------
     Timer
     ------------------------------------------------------------ */

  function updateTimer(time) {
    const el = document.getElementById("timer");
    if (el) el.textContent = time;
  }

  /* ------------------------------------------------------------
     API pública
     ------------------------------------------------------------ */

  return {
    renderMenu,
    renderCase,
    showFeedback,
    updateTimer,
    getAguilar,
    getSolis,
    getCelada
  };
})();
