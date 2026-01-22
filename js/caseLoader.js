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
      if (loadedPacks.has(packPath)) {
        return loadedPacks.get(packPath);
      }
  
      const packPromise = (async () => {
        const res = await fetch(`./data/${packPath}`);
        if (!res.ok) {
          throw new Error(`No se pudo cargar pack: ${packPath}`);
        }
  
        const cases = await res.json();
        if (!Array.isArray(cases)) {
          throw new Error(`Pack inválido: ${packPath}`);
        }
  
        return cases;
      })();
  
      loadedPacks.set(packPath, packPromise);
  
      try {
        const cases = await packPromise;
        loadedPacks.set(packPath, cases);
        return cases;
      } catch (err) {
        loadedPacks.delete(packPath);
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
  
      if (filters.onlyReal === true) {
        pool = pool.filter(c => c.metadata?.is_real_data === true);
      }
  
      if (filters.onlySynthetic === true) {
        pool = pool.filter(c => c.metadata?.is_real_data === false);
      }
  
      if (!pool.length) {
        throw new Error("No hay casos que cumplan los filtros");
      }
  
      const meta = pool[Math.floor(Math.random() * pool.length)];
  
      if (!meta.pack) {
        throw new Error(`Caso ${meta.case_id} sin campo pack`);
      }
  
      const packCases = await loadPack(meta.pack);
      const fullCase = packCases.find(c => c.case_id === meta.case_id);
  
      if (!fullCase) {
        throw new Error(
          `Caso ${meta.case_id} no encontrado en ${meta.pack}`
        );
      }
  
      return {
        ...meta,
        ...fullCase
      };
    }
  
    /* ------------------------------------------------------------
       API pública
       ------------------------------------------------------------ */
    return {
      init,
      pickRandomCase
    };
  })();
  