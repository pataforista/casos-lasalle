#!/usr/bin/env node
"use strict";

/**
 * validateAllPacks.js
 *
 * Uso:
 *   node tools/validateAllPacks.js ./data/manifest_v1.json
 *
 * Valida:
 * - Packs existentes + parseables
 * - Case IDs únicos globales (entre packs)
 * - task_id únicos globales
 * - chunk_id presentes (duplicados globales = WARN)
 * - Campos mínimos por caso
 * - Integridad manifest.index <-> packs
 */

const fs = require("fs");
const path = require("path");

const ALLOWED_DIFFICULTIES = new Set(["facil", "media", "dificil"]);
const ALLOWED_LEVELS = new Set(["licenciatura", "residencia", "especialidad"]);
const ALLOWED_CASE_TYPES = new Set(["razonamiento_clinico", "documento_educativo"]);

function readJson(filePath) {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, "utf-8");
  try { return JSON.parse(raw); }
  catch (e) { throw new Error(`JSON inválido en ${abs}: ${e.message}`); }
}
function isNonEmptyString(x) { return typeof x === "string" && x.trim().length > 0; }
function arr(x) { return Array.isArray(x) ? x : []; }

function reporter() {
  const issues = [];
  const order = { ERROR: 0, WARN: 1, INFO: 2 };
  const add = (severity, code, message, pointer = "") => issues.push({ severity, code, message, pointer });
  const print = () => {
    issues.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
    const counts = { ERROR: 0, WARN: 0, INFO: 0 };
    for (const i of issues) counts[i.severity] = (counts[i.severity] || 0) + 1;

    console.log("\n=== PACK VALIDATION REPORT ===");
    console.log(`ERROR: ${counts.ERROR} | WARN: ${counts.WARN} | INFO: ${counts.INFO}\n`);
    for (const i of issues) {
      const loc = i.pointer ? ` @ ${i.pointer}` : "";
      console.log(`[${i.severity}] ${i.code}${loc}\n  ${i.message}\n`);
    }
    return counts;
  };
  return { add, print };
}

function validateCaseMinimal(c, ptr, rep) {
  if (!c || typeof c !== "object") { rep.add("ERROR", "CASE_NOT_OBJECT", "Caso no es objeto.", ptr); return; }

  if (!isNonEmptyString(c.case_id)) rep.add("ERROR", "MISSING_CASE_ID", "Falta case_id.", `${ptr}/case_id`);
  if (!isNonEmptyString(c.case_type)) rep.add("ERROR", "MISSING_CASE_TYPE", "Falta case_type.", `${ptr}/case_type`);
  if (!isNonEmptyString(c.educational_level)) rep.add("ERROR", "MISSING_LEVEL", "Falta educational_level.", `${ptr}/educational_level`);
  if (!isNonEmptyString(c.difficulty)) rep.add("ERROR", "MISSING_DIFFICULTY", "Falta difficulty.", `${ptr}/difficulty`);

  if (isNonEmptyString(c.difficulty) && !ALLOWED_DIFFICULTIES.has(c.difficulty)) {
    rep.add("WARN", "DIFFICULTY_UNKNOWN", `difficulty no reconocido: "${c.difficulty}"`, `${ptr}/difficulty`);
  }
  if (isNonEmptyString(c.educational_level) && !ALLOWED_LEVELS.has(c.educational_level)) {
    rep.add("WARN", "LEVEL_UNKNOWN", `educational_level no reconocido: "${c.educational_level}"`, `${ptr}/educational_level`);
  }
  if (isNonEmptyString(c.case_type) && !ALLOWED_CASE_TYPES.has(c.case_type)) {
    rep.add("WARN", "CASE_TYPE_UNKNOWN", `case_type no reconocido: "${c.case_type}"`, `${ptr}/case_type`);
  }

  const chunks = arr(c.source_chunks);
  if (!chunks.length) rep.add("ERROR", "NO_SOURCE_CHUNKS", "source_chunks vacío.", `${ptr}/source_chunks`);

  const tasks = arr(c.tasks);
  if (!tasks.length) rep.add("ERROR", "NO_TASKS", "tasks vacío (debe existir ≥1).", `${ptr}/tasks`);
}

function main() {
  const manifestPath = process.argv[2] || "./data/manifest_v1.json";
  const rep = reporter();

  let manifest;
  try { manifest = readJson(manifestPath); }
  catch (e) { console.error(`❌ ${e.message}`); process.exit(2); }

  const baseDir = path.dirname(path.resolve(manifestPath));

  const packsDeclared = manifest.packs || {};
  const packPaths = [];
  if (isNonEmptyString(packsDeclared.real)) packPaths.push(packsDeclared.real);
  for (const p of arr(packsDeclared.synth)) if (isNonEmptyString(p)) packPaths.push(p);

  if (!packPaths.length) rep.add("ERROR", "NO_PACKS", "Manifest no declara packs (packs.real / packs.synth).", "/packs");

  // index map: case_id -> pack
  const idxArr = arr(manifest.index);
  const indexMap = new Map();
  idxArr.forEach((it, i) => {
    const ptr = `/index/[${i}]`;
    if (!it || typeof it !== "object") return;
    if (!isNonEmptyString(it.case_id)) { rep.add("ERROR", "INDEX_MISSING_CASE_ID", "index item sin case_id.", `${ptr}/case_id`); return; }
    if (!isNonEmptyString(it.pack)) { rep.add("ERROR", "INDEX_MISSING_PACK", `index item sin pack para ${it.case_id}`, `${ptr}/pack`); return; }
    if (indexMap.has(it.case_id)) { rep.add("ERROR", "INDEX_DUP_CASE_ID", `case_id duplicado en index: ${it.case_id}`, `${ptr}/case_id`); return; }
    indexMap.set(it.case_id, { pack: it.pack, ptr });
  });

  const globalCaseIds = new Set();
  const globalTaskIds = new Set();
  const globalChunkIds = new Set();
  const packCaseIndex = new Map();

  for (const relPackPath of packPaths) {
    const absPack = path.resolve(baseDir, relPackPath);
    const packPtr = `/packs/${relPackPath}`;

    if (!fs.existsSync(absPack)) { rep.add("ERROR", "PACK_NOT_FOUND", `Pack no encontrado: ${absPack}`, packPtr); continue; }

    let packData;
    try { packData = readJson(absPack); }
    catch (e) { rep.add("ERROR", "PACK_JSON_INVALID", e.message, packPtr); continue; }

    if (!Array.isArray(packData)) { rep.add("ERROR", "PACK_NOT_ARRAY", "Pack JSON debe ser array.", packPtr); continue; }

    packCaseIndex.set(relPackPath, new Set());

    packData.forEach((c, i) => {
      const ptr = `${packPtr}/[${i}]`;

      validateCaseMinimal(c, ptr, rep);

      if (c && isNonEmptyString(c.case_id)) {
        if (globalCaseIds.has(c.case_id)) rep.add("ERROR", "DUP_CASE_ID_GLOBAL", `case_id duplicado entre packs: ${c.case_id}`, `${ptr}/case_id`);
        else globalCaseIds.add(c.case_id);
        packCaseIndex.get(relPackPath).add(c.case_id);
      }

      for (const t of arr(c?.tasks)) {
        if (!t || typeof t !== "object") continue;
        if (!isNonEmptyString(t.task_id)) continue;
        if (globalTaskIds.has(t.task_id)) rep.add("ERROR", "DUP_TASK_ID_GLOBAL", `task_id duplicado global: ${t.task_id}`, `${ptr}/tasks`);
        else globalTaskIds.add(t.task_id);
      }

      for (const ch of arr(c?.source_chunks)) {
        if (!ch || typeof ch !== "object") continue;
        if (!isNonEmptyString(ch.chunk_id)) { rep.add("ERROR", "MISSING_CHUNK_ID", "chunk_id faltante.", `${ptr}/source_chunks`); continue; }
        if (globalChunkIds.has(ch.chunk_id)) rep.add("WARN", "DUP_CHUNK_ID_GLOBAL", `chunk_id repetido globalmente: ${ch.chunk_id}`, `${ptr}/source_chunks`);
        else globalChunkIds.add(ch.chunk_id);
      }
    });

    rep.add("INFO", "PACK_OK", `Pack cargado: ${relPackPath} (n=${packData.length})`, packPtr);
  }

  // Cross-check: index -> packs
  for (const [caseId, meta] of indexMap.entries()) {
    const pack = meta.pack;
    if (!packCaseIndex.has(pack)) { rep.add("ERROR", "INDEX_PACK_NOT_DECLARED", `index.pack no está en manifest.packs: ${pack}`, meta.ptr); continue; }
    if (!packCaseIndex.get(pack).has(caseId)) rep.add("ERROR", "INDEX_CASE_NOT_IN_PACK", `case_id ${caseId} no está en su pack declarado (${pack}).`, meta.ptr);
  }

  // Cross-check: packs -> index
  const indexIds = new Set(indexMap.keys());
  let missingInIndex = 0;
  for (const id of globalCaseIds) if (!indexIds.has(id)) missingInIndex++;
  if (missingInIndex) rep.add("WARN", "CASES_NOT_IN_INDEX", `Hay ${missingInIndex} case_id en packs que no están en manifest.index.`, "/index");

  rep.add("INFO", "SUMMARY", `Total cases (packs): ${globalCaseIds.size}`, "/");
  rep.add("INFO", "SUMMARY", `Total tasks (global): ${globalTaskIds.size}`, "/");
  rep.add("INFO", "SUMMARY", `Total chunks (global unique): ${globalChunkIds.size}`, "/");

  const counts = rep.print();
  if (counts.ERROR) { console.log("❌ VALIDATION FAILED"); process.exit(1); }
  console.log("✅ VALIDATION OK");
  process.exit(0);
}

try { main(); } catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(2);
}
