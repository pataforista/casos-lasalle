"use strict";

/**
 * manifest.js — formato único del manifest de casos.
 *
 * POR QUÉ EXISTE ESTE MÓDULO
 * Tres herramientas escribían data/manifest_v1.json y cada una se inventaba su
 * propia forma. update_cases.js llegó a dejar el índice como un solo envoltorio
 * {pack, cases:[{id,title}]} apuntando a un pack inexistente, y como
 * js/caseLoader.js espera una lista plana de casos con case_id y pack, el
 * resultado fue que getPoolSize() devolvía 1, pickRandomCase() no encontraba
 * nunca el caso y la partida caía siempre al generador sintético: los 94 casos
 * reales quedaron inalcanzables sin que nada avisara.
 *
 * A partir de aquí el formato vive en un solo sitio y todo el que escriba el
 * manifest pasa por assertLoadable(), que reproduce lo que el loader exige.
 *
 * CONTRATO (lo que js/caseLoader.js necesita para funcionar):
 *   {
 *     version, updated,
 *     counts: { total, real, synthetic, ... },
 *     packs:  { real: "packs/<archivo>.json", synth: ["packs/…"] },
 *     index:  [ { case_id, pack, difficulty, educational_level, ... }, … ]
 *   }
 *   - index es PLANO: una entrada por caso, no por pack.
 *   - cada entrada lleva `pack` con la ruta relativa a data/.
 *   - pickRandomCase() filtra por difficulty / educational_level / is_real_data,
 *     así que esos campos deben venir en el índice, no sólo en el pack.
 */

const fs = require("fs");
const path = require("path");

function uniq(a) {
  return Array.from(new Set((a || []).filter(Boolean)));
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Etiquetas HiTOP/RDoC que el índice expone para filtrar sin abrir el pack. */
function collectLabelsFromCase(c) {
  const hitop = [];
  const rdoc = [];
  for (const ch of Array.isArray(c.source_chunks) ? c.source_chunks : []) {
    if (ch?.labels) {
      if (Array.isArray(ch.labels.hitop)) hitop.push(...ch.labels.hitop);
      if (Array.isArray(ch.labels.rdoc)) rdoc.push(...ch.labels.rdoc);
    }
    if (ch?.label_refs) {
      if (Array.isArray(ch.label_refs.hitop)) hitop.push(...ch.label_refs.hitop);
      if (Array.isArray(ch.label_refs.rdoc)) rdoc.push(...ch.label_refs.rdoc);
    }
  }
  return { hitop: uniq(hitop), rdoc: uniq(rdoc) };
}

function isReal(c) {
  return !!(c && c.metadata && c.metadata.is_real_data === true);
}

/** Una entrada de índice para un caso, apuntando al pack que lo contiene. */
function buildIndexEntry(c, packRelPath) {
  const labels = collectLabelsFromCase(c);
  return {
    case_id: c.case_id,
    title: c.title || "",
    difficulty: c.difficulty || "",
    educational_level: c.educational_level || "",
    case_type: c.case_type || "",
    is_real_data: isReal(c),
    hitop: labels.hitop,
    rdoc: labels.rdoc,
    pack: packRelPath.startsWith("packs/") ? packRelPath : `packs/${packRelPath}`
  };
}

/**
 * Construye el manifest completo.
 * @param {{realPack?: {file: string, cases: object[]}, synthPacks?: {file: string, cases: object[]}[], version?: string, packSize?: number}} opts
 */
function buildManifest(opts) {
  const { realPack = null, synthPacks = [], version = "v1", packSize = 25 } = opts;

  const index = [];
  if (realPack) {
    for (const c of realPack.cases) index.push(buildIndexEntry(c, realPack.file));
  }
  for (const p of synthPacks) {
    for (const c of p.cases) index.push(buildIndexEntry(c, p.file));
  }

  const realCount = index.filter(e => e.is_real_data).length;

  return {
    version,
    updated: today(),
    counts: {
      total: index.length,
      real: realCount,
      synthetic: index.length - realCount,
      synth_packs: synthPacks.length,
      pack_size: packSize
    },
    packs: {
      real: realPack ? `packs/${realPack.file}` : "",
      synth: synthPacks.map(p => `packs/${p.file}`)
    },
    index
  };
}

/**
 * Comprueba que el manifest es legible por js/caseLoader.js. Lanza si no.
 * Se llama antes de escribir: más vale que falle la herramienta a que la app
 * se quede sin banco de casos en silencio.
 *
 * @param {object} manifest
 * @param {string} [dataDir] si se pasa, verifica además que los packs existan
 */
function assertLoadable(manifest, dataDir) {
  const problems = [];

  if (!manifest || typeof manifest !== "object") {
    throw new Error("Manifest no es un objeto.");
  }
  if (!Array.isArray(manifest.index)) {
    problems.push("index debe ser un array (js/caseLoader.js lo exige).");
  } else {
    if (!manifest.index.length) problems.push("index está vacío.");
    const seen = new Set();
    manifest.index.forEach((it, i) => {
      if (!it || typeof it !== "object") {
        problems.push(`index[${i}] no es un objeto.`);
        return;
      }
      // El fallo histórico: entradas por pack en vez de por caso.
      if (Array.isArray(it.cases)) {
        problems.push(
          `index[${i}] agrupa casos en un campo "cases". El índice debe ser plano: ` +
          `una entrada por caso con case_id y pack.`
        );
        return;
      }
      if (!it.case_id) problems.push(`index[${i}] sin case_id.`);
      if (!it.pack) problems.push(`index[${i}] (${it.case_id || "?"}) sin campo pack.`);
      if (it.case_id) {
        if (seen.has(it.case_id)) problems.push(`case_id duplicado en index: ${it.case_id}`);
        seen.add(it.case_id);
      }
    });
  }

  const packs = manifest.packs || {};
  const declared = [];
  if (packs.real) declared.push(packs.real);
  for (const p of Array.isArray(packs.synth) ? packs.synth : []) declared.push(p);
  if (!declared.length) problems.push("packs.real / packs.synth no declaran ningún pack.");

  // Todo pack referido desde el índice debe estar declarado y existir en disco.
  if (Array.isArray(manifest.index)) {
    const used = uniq(manifest.index.map(it => it && it.pack));
    for (const p of used) {
      if (!declared.includes(p)) problems.push(`index usa el pack "${p}" pero packs{} no lo declara.`);
    }
  }
  if (dataDir) {
    for (const p of declared) {
      const abs = path.resolve(dataDir, p);
      if (!fs.existsSync(abs)) problems.push(`El pack declarado no existe en disco: ${p}`);
    }
  }

  if (problems.length) {
    throw new Error(
      "El manifest no es legible por js/caseLoader.js:\n  - " + problems.join("\n  - ")
    );
  }
  return true;
}

/** Escribe el manifest sólo si pasa el contrato. */
function writeManifest(manifestPath, manifest, dataDir) {
  assertLoadable(manifest, dataDir || path.dirname(path.resolve(manifestPath)));
  const abs = path.resolve(manifestPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(manifest, null, 2), "utf-8");
  return abs;
}

module.exports = {
  buildIndexEntry,
  buildManifest,
  assertLoadable,
  writeManifest,
  collectLabelsFromCase,
  isReal,
  today,
  uniq
};
