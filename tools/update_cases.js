/**
 * update_cases.js — migración puntual del banco de casos.
 *
 * Aplica modified_cases.json sobre el pack real: elimina 8 casos, reemplaza los
 * corregidos y añade los nuevos.
 *
 * CUIDADO: reescribe el banco clínico. Por eso es dry-run por defecto y sólo
 * escribe con --write.
 *
 * Uso:
 *   node tools/update_cases.js            (informa, no escribe)
 *   node tools/update_cases.js --write    (aplica)
 *
 * HISTORIAL: esta herramienta dejó la app sin banco de casos. Escribía el pack
 * como cases_real_v1_final.json (nombre que nunca se versionó) y machacaba el
 * manifest con un índice de la forma [{pack, cases:[{id,title}]}], que
 * js/caseLoader.js no sabe leer: getPoolSize() devolvía 1 y todas las partidas
 * caían al generador sintético. Ahora escribe sobre el pack canónico y el
 * manifest lo construye tools/lib/manifest.js, que valida antes de guardar.
 */

const fs = require('fs');
const path = require('path');
const { buildManifest, writeManifest } = require('./lib/manifest');

const WRITE = process.argv.includes('--write');

const dataDir = path.join(__dirname, '..', 'data');
const REAL_PACK_FILE = 'cases_real_v1.json';
const originalPackPath = path.join(dataDir, 'packs', REAL_PACK_FILE);
const modifiedCasesPath = path.join(__dirname, 'modified_cases.json');
// Se escribe sobre el pack canónico: un "…_final.json" aparte era justo lo que
// dejaba al manifest apuntando a un archivo que no existía en el repositorio.
const finalPackPath = originalPackPath;
const manifestPath = path.join(dataDir, 'manifest_v1.json');

// The 8 cases to eliminate as explicitly stated by the user
const idsToRemove = [
  "EDU_02_CLASS",
  "REAL_GEN_HIST_001_B",
  "REAL_GEN_SCH_002_B",
  "REAL_GEN_ADHD_002_B",
  "REAL_GEN_DELIR_002_B",
  "REAL_GEN_BIP_002_B",
  "REAL_GEN_ASD_002_B",
  "REAL_GEN_PTSD_002_B"
];

function run() {
  console.log("Loading original cases...");
  const originalCases = JSON.parse(fs.readFileSync(originalPackPath, 'utf8'));
  console.log(`Loaded ${originalCases.length} original cases.`);

  console.log("Loading modified cases...");
  const modifiedCases = JSON.parse(fs.readFileSync(modifiedCasesPath, 'utf8'));
  console.log(`Loaded ${modifiedCases.length} modified cases.`);

  let finalCases = [];
  let replacedCount = 0;
  let removedCount = 0;
  let addedCount = 0;

  // Process original cases
  for (const c of originalCases) {
    if (idsToRemove.includes(c.case_id)) {
      removedCount++;
      continue; // Skip, do not include
    }

    // Check if this case was modified
    const modifiedMatch = modifiedCases.find(mc => mc.case_id === c.case_id);
    if (modifiedMatch) {
      finalCases.push(modifiedMatch);
      replacedCount++;
    } else {
      finalCases.push(c);
    }
  }

  // Add any NEW cases from modifiedCases that weren't in original (like HOSP_021_TDPM)
  for (const mc of modifiedCases) {
    if (idsToRemove.includes(mc.case_id)) {
      continue; // do not add if it's meant to be eliminated
    }
    const exists = finalCases.find(fc => fc.case_id === mc.case_id);
    if (!exists) {
      finalCases.push(mc);
      addedCount++;
    }
  }

  console.log(`Removed: ${removedCount}`);
  console.log(`Replaced: ${replacedCount}`);
  console.log(`Added: ${addedCount}`);
  console.log(`Final case count: ${finalCases.length}`);

  // Validate for duplicates
  const idSet = new Set();
  let hasDuplicates = false;
  for (const c of finalCases) {
    if (idSet.has(c.case_id)) {
      console.error(`ERROR: Duplicate case_id found: ${c.case_id}`);
      hasDuplicates = true;
    }
    idSet.add(c.case_id);
  }

  if (hasDuplicates) {
    console.error("Aborting due to duplicates.");
    process.exit(1);
  }

  // El manifest se arma con el formato único y se valida antes de tocar disco,
  // así que un fallo aquí deja los datos como estaban.
  const manifest = buildManifest({
    realPack: { file: REAL_PACK_FILE, cases: finalCases },
    synthPacks: [],
    version: 'v1'
  });

  if (!WRITE) {
    console.log(`\n(dry-run) Se escribirían ${finalCases.length} casos en packs/${REAL_PACK_FILE}`);
    console.log(`(dry-run) y ${manifest.index.length} entradas en manifest_v1.json.`);
    console.log('(dry-run) Usa --write para aplicar. Reescribe el banco clínico.');
    return;
  }

  fs.writeFileSync(finalPackPath, JSON.stringify(finalCases, null, 2));
  console.log(`Saved final pack to ${finalPackPath}`);

  writeManifest(manifestPath, manifest, dataDir);
  console.log(`Saved manifest to ${manifestPath}`);
}

run();
