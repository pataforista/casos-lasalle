/* ============================================================================
   boot.js — arranque de PsyCase
   - Utilidades globales mínimas (escape, log de depuración, almacenamiento seguro)
   - Captura de errores no controlados
   - Registro del Service Worker y aplicación de actualizaciones

   Vive fuera de index.html para que la CSP no necesite 'unsafe-inline' en
   script-src. Se carga antes que el resto de scripts.
   ============================================================================ */
"use strict";

function _esc(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// localStorage puede lanzar (iframe sandbox, Safari con cookies bloqueadas,
// cuota llena). Un fallo de almacenamiento nunca debe tumbar la partida.
const SafeStore = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, String(value));
      return true;
    } catch {
      return false;
    }
  }
};

// Depuración: tecla D muestra el panel, sólo en localhost.
const _isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";

function logDebug(msg) {
  if (!_isLocal) return;
  const dbg = document.getElementById("debug");
  if (!dbg) return;
  dbg.textContent += (dbg.textContent ? "\n" : "") + msg;
}

window.addEventListener("keydown", (e) => {
  if (!_isLocal || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.toLowerCase() === "d") {
    const dbg = document.getElementById("debug");
    if (dbg) dbg.style.display = (dbg.style.display === "block" ? "none" : "block");
  }
});

window.addEventListener("error", (e) => {
  logDebug("[error] " + (e.message || "unknown") + (e.filename ? ` @ ${e.filename}:${e.lineno}` : ""));
  const root = document.getElementById("caseRoot");
  if (root) {
    root.innerHTML = `<div class="miami-card"><div style="font-weight:900;color:#f472b6;">Error</div>` +
      `<div style="opacity:.85;margin-top:8px;">${_esc(e.message || e)}</div>` +
      `<button class="btn-action" id="btnErrorReload" style="margin-top:14px;">Recargar</button></div>`;
    // Nada de onclick en línea: la CSP (script-src 'self') lo bloquearía.
    const btn = document.getElementById("btnErrorReload");
    if (btn) btn.addEventListener("click", () => location.reload());
  }
});

window.addEventListener("unhandledrejection", (e) => {
  logDebug("[promise] " + String(e.reason || "unhandled"));
});

/* ----------------------------------------------------------------------------
   Service Worker
   Regla: una versión nueva se aplica recargando, pero NUNCA a mitad de una
   guardia. Si llega durante la partida, la recarga espera a que el jugador
   vuelva al menú (game.js llama a PsyBoot.applyPendingUpdate()).
   En la primera visita no hay recarga: clients.claim() también dispara
   controllerchange y antes eso reiniciaba la app recién abierta.
   ---------------------------------------------------------------------------- */
const PsyBoot = {
  updatePending: false,
  inShift: false,
  applyPendingUpdate() {
    if (this.updatePending) window.location.reload();
  }
};

if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      logDebug("[sw] registered");
      // Sin catch, una red caída deja un rechazo sin capturar: es justo el
      // escenario normal de una app pensada para usarse offline.
      reg.update().catch((err) => logDebug("[sw] update failed: " + String(err)));
    } catch (err) {
      logDebug("[sw] register failed: " + String(err));
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    if (PsyBoot.inShift) {
      PsyBoot.updatePending = true;
      logDebug("[sw] actualización lista; se aplicará al volver al menú");
      return;
    }
    refreshing = true;
    window.location.reload();
  });
}
