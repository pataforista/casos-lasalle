#!/usr/bin/env node
"use strict";

/**
 * enhanceCases.js
 *
 * Uso:
 *   node tools/enhanceCases.js <input.json> <output.json>
 *
 * Mejora los casos clínicos:
 * - Verifica/crea explanation.rationale, take_home, why_not
 * - why_not se completa para cada distractor (si falta)
 * - Si take_home vacío, lo extrae del rationale
 * - Genera informe de cambios
 */

const fs = require("fs");
const path = require("path");

// ---------- Utilidades ----------
function readJson(filePath) {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`JSON inválido en ${abs}: ${e.message}`);
  }
}

function writeJson(filePath, obj) {
  const abs = path.resolve(filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), "utf-8");
}

function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}

function normalizeText(t) {
  return String(t || "").replace(/\s+/g, " ").trim();
}

// Extraer primera oración de un texto
function firstSentence(text) {
  const match = normalizeText(text).match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text.slice(0, 120) + (text.length > 120 ? "..." : "");
}

// Generar razón genérica para un distractor
function genericReason(distractor, correctAnswer) {
  return `"${distractor}" no es la opción correcta porque la conducta esperada es "${correctAnswer}". Esta alternativa podría ser válida en otro contexto clínico, pero no en el caso presentado.`;
}

// ---------- Mejora de un caso ----------
function enhanceCase(caseObj, stats) {
  if (!caseObj || typeof caseObj !== "object") return caseObj;

  let modified = false;

  // 1. Asegurar que existe tasks[0] con expected_answer y distractors
  const tasks = caseObj.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    stats.warnings.push(`Caso ${caseObj.case_id || "?"}: no tiene tasks.`);
    return caseObj;
  }
  const firstTask = tasks[0];
  const correctAnswer = firstTask.expected_answer;
  const distractors = Array.isArray(firstTask.distractors) ? firstTask.distractors : [];

  // 2. Asegurar explanation
  if (!caseObj.explanation) {
    caseObj.explanation = {};
    modified = true;
    stats.changes.push(`${caseObj.case_id}: añadido explanation vacío.`);
  }
  const exp = caseObj.explanation;

  // 2.1 rationale
  if (!isNonEmptyString(exp.rationale)) {
    // Si no hay rationale, usar el take_home o generar uno por defecto
    exp.rationale = exp.take_home || `La respuesta correcta es "${correctAnswer}". Revisa el caso para fundamentar esta decisión.`;
    modified = true;
    stats.changes.push(`${caseObj.case_id}: rationale generado automáticamente.`);
  }

  // 2.2 take_home
  if (!isNonEmptyString(exp.take_home)) {
    // Extraer del rationale la primera oración que sea concisa
    let extracted = firstSentence(exp.rationale);
    if (extracted.length > 100) extracted = extracted.slice(0, 100) + "…";
    exp.take_home = extracted || "Recuerda el fundamento clínico de este caso.";
    modified = true;
    stats.changes.push(`${caseObj.case_id}: take_home generado a partir del rationale.`);
  }

  // 2.3 why_not: debe tener una entrada por cada distractor (y opcionalmente para la correcta? no)
  let whyNot = Array.isArray(exp.why_not) ? exp.why_not : [];
  // Normalizar why_not: limpiar strings
  whyNot = whyNot.map(item => ({
    option: normalizeText(item.option || ""),
    reason: normalizeText(item.reason || "")
  }));

  // Mapa de opciones ya cubiertas en why_not
  const coveredOptions = new Set(whyNot.map(w => normalizeText(w.option)));

  // Añadir entradas faltantes para distractores
  for (const dist of distractors) {
    const normDist = normalizeText(dist);
    if (!coveredOptions.has(normDist)) {
      whyNot.push({
        option: normDist,
        reason: genericReason(normDist, correctAnswer)
      });
      modified = true;
      stats.changes.push(`${caseObj.case_id}: añadido why_not para distractor "${normDist}".`);
    }
  }

  // Opcional: si hay entradas en why_not que ya no están en distractores (por cambio), las conservamos pero avisamos
  const currentDistractorsSet = new Set(distractors.map(normalizeText));
  for (const w of whyNot) {
    if (!currentDistractorsSet.has(w.option) && w.option !== normalizeText(correctAnswer)) {
      stats.warnings.push(`${caseObj.case_id}: why_not para "${w.option}" no coincide con ningún distractor actual.`);
    }
  }

  exp.why_not = whyNot;
  caseObj.explanation = exp;

  // 3. Verificar que source_chunks tenga al menos un chunk
  if (!Array.isArray(caseObj.source_chunks) || caseObj.source_chunks.length === 0) {
    stats.warnings.push(`${caseObj.case_id}: no tiene source_chunks.`);
  }

  // 4. Verificar metadatos (opcional)
  if (!caseObj.metadata) caseObj.metadata = {};
  if (caseObj.metadata.is_real_data === undefined) {
    caseObj.metadata.is_real_data = true;
    modified = true;
    stats.changes.push(`${caseObj.case_id}: is_real_data forzado a true.`);
  }

  return caseObj;
}

// ---------- Main ----------
function main() {
  const inputPath = process.argv[2] || "./data/cases_v1.json";
  const outputPath = process.argv[3] || "./data/cases_v1_enhanced.json";

  console.log(`📖 Leyendo casos desde ${inputPath}...`);
  const cases = readJson(inputPath);
  if (!Array.isArray(cases)) throw new Error("El archivo debe contener un array de casos.");

  const stats = {
    changes: [],
    warnings: []
  };

  const enhancedCases = cases.map(c => enhanceCase(c, stats));

  // Escribir resultado
  writeJson(outputPath, enhancedCases);
  console.log(`✅ Casos mejorados guardados en ${outputPath}`);

  // Informe
  console.log("\n📊 RESUMEN DE MEJORAS:");
  console.log(`  - Casos procesados: ${enhancedCases.length}`);
  console.log(`  - Cambios aplicados: ${stats.changes.length}`);
  console.log(`  - Advertencias: ${stats.warnings.length}`);

  if (stats.changes.length > 0) {
    console.log("\n🔧 Cambios realizados (primeros 10):");
    stats.changes.slice(0, 10).forEach(c => console.log(`   • ${c}`));
    if (stats.changes.length > 10) console.log(`   ... y ${stats.changes.length - 10} más.`);
  }

  if (stats.warnings.length > 0) {
    console.log("\n⚠️ Advertencias (primeros 10):");
    stats.warnings.slice(0, 10).forEach(w => console.log(`   • ${w}`));
    if (stats.warnings.length > 10) console.log(`   ... y ${stats.warnings.length - 10} más.`);
  }

  console.log("\n✨ Listo. Revisa el archivo de salida y ajusta manualmente las razones genéricas si es necesario.");
}

try {
  main();
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
