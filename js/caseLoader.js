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

    // Un fallo (p. ej. primera visita sin red) no puede quedar cacheado: antes
    // la promesa rechazada se devolvía para siempre y el banco real ya no se
    // cargaba aunque volviera la conexión.
    initPromise.catch(() => { initPromise = null; });
    return initPromise;
  }

  /* ------------------------------------------------------------
     Carga de pack (lazy, con cache)
     ------------------------------------------------------------ */
  async function loadPack(packPath) {
    const cleanPath = String(packPath).replace(/^\.?\//, "").replace(/^data\//, "");
    if (!/^packs\/[a-zA-Z0-9_\-]+\.json$/.test(cleanPath)) {
      throw new Error(`Ruta de pack no permitida: ${cleanPath}`);
    }
    if (loadedPacks.has(cleanPath)) {
      return loadedPacks.get(cleanPath);
    }

    const packPromise = (async () => {
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
     Filtros (una sola implementación para elegir caso y para contar)
     ------------------------------------------------------------ */
  function isRealEntry(c) {
    return (c.metadata?.is_real_data ?? c.is_real_data) === true;
  }

  function filterPool(filters = {}) {
    let pool = manifestIndex;

    if (filters.onlyReal === true) pool = pool.filter(isRealEntry);
    if (filters.onlySynthetic === true) pool = pool.filter(c => !isRealEntry(c));
    if (filters.difficulty) pool = pool.filter(c => c.difficulty === filters.difficulty);
    if (filters.educational_level) pool = pool.filter(c => c.educational_level === filters.educational_level);

    if (Array.isArray(filters.includeCaseIds)) {
      const includeSet = new Set(filters.includeCaseIds);
      pool = pool.filter(c => includeSet.has(c.case_id));
    }

    const excludeCaseIds = new Set(filters.excludeCaseIds || []);
    if (excludeCaseIds.size) pool = pool.filter(c => !excludeCaseIds.has(c.case_id));

    return pool;
  }

  /* ------------------------------------------------------------
     Selección aleatoria de caso
     ------------------------------------------------------------ */
  async function pickRandomCase(filters = {}) {
    if (!manifestIndex.length) {
      throw new Error("CaseDB no inicializado. Llama a CaseDB.init() primero.");
    }

    const pool = filterPool(filters);

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
     Consultas sin cargar packs
     ------------------------------------------------------------ */
  function getPoolSize(filters = {}) {
    if (!manifestIndex.length) return 0;
    return filterPool(filters).length;
  }

  // ¿Sigue existiendo este caso en el banco? El repaso lo usa para descartar
  // errores guardados de casos que se retiraron del dataset.
  function hasCase(caseId) {
    return manifestIndex.some(c => c.case_id === caseId);
  }

  /* ------------------------------------------------------------
     API pública
     ------------------------------------------------------------ */
  return {
    init,
    pickRandomCase,
    getPoolSize,
    hasCase,
    isReady: () => manifestIndex.length > 0
  };
})();
