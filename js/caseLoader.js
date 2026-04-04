/* ============================================================================
   Case Loader – PsyCase
   Runtime loader para múltiples packs clínicos
   Fuente de verdad: data/manifest_v1.json (pack = ruta real)
   ============================================================================ */

const CaseDB = (() => {
  const CONFIG = {
    manifestUrl: "./data/manifest_v1.json"
  };

  let manifestIndex = [];
  const loadedPacks = new Map();
  let initPromise = null;

  /* ------------------------------------------------------------
     Inicialización
     ------------------------------------------------------------ */
  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const res = await fetch(CONFIG.manifestUrl);
      if (!res.ok) {
        throw new Error("No se pudo cargar manifest_v1.json");
      }

      const manifest = await res.json();

      if (!manifest.index || !Array.isArray(manifest.index)) {
        throw new Error("Manifest inválido: falta index[]");
      }

      manifestIndex = manifest.index;
      return manifestIndex;
    })();

    return initPromise;
  }

  /* ------------------------------------------------------------
     Carga de pack (lazy, con cache)
     ------------------------------------------------------------ */
  async function loadPack(packPath) {
    const cleanPath = String(packPath).replace(/^\.?\//, "").replace(/^data\//, "");
    if (loadedPacks.has(cleanPath)) {
      return loadedPacks.get(cleanPath);
    }

    const packPromise = (async () => {
      // Si la ruta ya empieza con packs/, se asume relativa a /data/
      const res = await fetch(`./data/${cleanPath}`);
      if (!res.ok) {
        throw new Error(`No se pudo cargar pack: ${cleanPath}`);
      }

      const cases = await res.json();
      if (!Array.isArray(cases)) {
        throw new Error(`Pack inválido: ${cleanPath}`);
      }

      return cases;
    })();

    loadedPacks.set(cleanPath, packPromise);

    try {
      const cases = await packPromise;
      loadedPacks.set(cleanPath, cases);
      return cases;
    } catch (err) {
      loadedPacks.delete(cleanPath);
      throw err;
    }
  }

  /* ------------------------------------------------------------
     Selección aleatoria de caso
     ------------------------------------------------------------ */
  async function pickRandomCase(filters = {}) {
    if (!manifestIndex.length) {
      throw new Error("CaseDB no inicializado. Llama a CaseDB.init() primero.");
    }

    let pool = manifestIndex;
    const excludeCaseIds = new Set(filters.excludeCaseIds || []);

    if (filters.onlyReal === true) {
      pool = pool.filter(c => (c.metadata?.is_real_data ?? c.is_real_data) === true);
    }

    if (filters.onlySynthetic === true) {
      pool = pool.filter(c => (c.metadata?.is_real_data ?? c.is_real_data) === false);
    }

    if (excludeCaseIds.size) {
      pool = pool.filter(c => !excludeCaseIds.has(c.case_id));
    }

    if (!pool.length) {
      throw new Error("No hay casos que cumplan los filtros");
    }

    let remaining = [...pool];
    while (remaining.length) {
      const meta = remaining[Math.floor(Math.random() * remaining.length)];

      if (!meta.pack) {
        throw new Error(`Caso ${meta.case_id} sin campo pack`);
      }

      const packCases = await loadPack(meta.pack);
      const fullCase = packCases.find(c => c.case_id === meta.case_id);

      if (fullCase) {
        return {
          ...meta,
          ...fullCase
        };
      }

      if (typeof logDebug === "function") {
        logDebug(`[cases] Caso ${meta.case_id} no encontrado en ${meta.pack}. Buscando otro...`);
      }
      remaining = remaining.filter(c => c.case_id !== meta.case_id);
    }

    throw new Error("No se encontró un caso válido en los packs disponibles");
  }

  /* ------------------------------------------------------------
     API pública
     ------------------------------------------------------------ */
  return {
    init,
    pickRandomCase
  };
})();
