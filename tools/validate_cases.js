#!/usr/bin/env node
"use strict";

/**
 * validate_cases.js
 *
 * Uso:
 *   node tools/validate_cases.js <input.json> <output.json>
 *
 * Funcionalidades:
 * 1. Valida la estructura completa de cada caso:
 *    - Campos obligatorios (case_id, title, difficulty, educational_level, etc.)
 *    - source_chunks con chunk_id y texto
 *    - tasks con expected_answer, distractors (al menos 2)
 *    - explanation con rationale, take_home, why_not (para cada distractor)
 * 2. Genera un informe de cambios y advertencias.
 * 3. Guarda el JSON anotado.
 */

const fs = require("fs");
const path = require("path");

// ---------- Configuración de mapeos ----------
// (Se eliminó la asignación automática de RDoC/HiTOP para enfoque pregrado)

// ---------- Validación de un caso ----------
function validateCase(caseObj, index, stats) {
  const id = caseObj.case_id || `caso_${index}`;
  let valid = true;

  // Campos obligatorios
  if (!isNonEmptyString(caseObj.case_id)) {
    stats.errors.push(`[${id}] Falta case_id`);
    valid = false;
  }
  if (!isNonEmptyString(caseObj.title)) {
    stats.errors.push(`[${id}] Falta title`);
    valid = false;
  }
  if (!isNonEmptyString(caseObj.difficulty)) {
    stats.errors.push(`[${id}] Falta difficulty`);
    valid = false;
  }
  if (!isNonEmptyString(caseObj.educational_level)) {
    stats.errors.push(`[${id}] Falta educational_level`);
    valid = false;
  }
  if (!isNonEmptyString(caseObj.case_type)) {
    stats.errors.push(`[${id}] Falta case_type`);
    valid = false;
  }

  // source_chunks
  const chunks = caseObj.source_chunks;
  if (!Array.isArray(chunks) || chunks.length === 0) {
    stats.errors.push(`[${id}] source_chunks vacío o no es array`);
    valid = false;
  } else {
    chunks.forEach((ch, ci) => {
      if (!isNonEmptyString(ch.chunk_id)) {
        stats.errors.push(`[${id}] source_chunks[${ci}] falta chunk_id`);
        valid = false;
      }
      if (!isNonEmptyString(ch.text_content)) {
        stats.errors.push(`[${id}] source_chunks[${ci}] falta text_content`);
        valid = false;
      }
    });
  }

  // tasks
  const tasks = caseObj.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    stats.errors.push(`[${id}] tasks vacío`);
    valid = false;
  } else {
    tasks.forEach((task, ti) => {
      if (!isNonEmptyString(task.instruction)) {
        stats.errors.push(`[${id}] tasks[${ti}] falta instruction`);
        valid = false;
      }
      if (!isNonEmptyString(task.expected_answer)) {
        stats.errors.push(`[${id}] tasks[${ti}] falta expected_answer`);
        valid = false;
      }
      const dists = task.distractors;
      if (!Array.isArray(dists) || dists.length < 2) {
        stats.errors.push(`[${id}] tasks[${ti}] distractors debe tener al menos 2 opciones`);
        valid = false;
      }
    });
  }

  // explanation
  const exp = caseObj.explanation;
  if (!exp) {
    stats.errors.push(`[${id}] falta explanation`);
    valid = false;
  } else {
    if (!isNonEmptyString(exp.rationale)) {
      stats.errors.push(`[${id}] explanation.rationale vacío`);
      valid = false;
    }
    if (!isNonEmptyString(exp.take_home)) {
      stats.warnings.push(`[${id}] explanation.take_home vacío`);
    }
    const whyNot = exp.why_not;
    const firstTask = tasks?.[0];
    const distractors = firstTask?.distractors || [];
    if (Array.isArray(whyNot)) {
      const covered = new Set(whyNot.map(w => normalizeText(w.option)));
      for (const dist of distractors) {
        if (!covered.has(normalizeText(dist))) {
          stats.warnings.push(`[${id}] falta why_not para distractor "${dist}"`);
        }
      }
    } else {
      stats.warnings.push(`[${id}] explanation.why_not no es un array`);
    }
  }

  return valid;
}

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
  return String(t || "").toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

// ---------- Anotación de un caso (actualmente no añade hitop/rdoc) ----------
function annotateCase(caseObj) {
  return caseObj;
}

// ---------- Main ----------
function main() {
  const inputPath = process.argv[2] || "./data/cases_v1.json";
  const outputPath = process.argv[3] || "./data/cases_v1_annotated.json";

  console.log(`📖 Leyendo casos desde ${inputPath}...`);
  const cases = readJson(inputPath);
  if (!Array.isArray(cases)) throw new Error("El archivo debe contener un array de casos.");

  const stats = {
    errors: [],
    warnings: [],
    changes: []
  };

  let validCount = 0;
  const annotatedCases = cases.map((c, idx) => {
    const isValid = validateCase(c, idx, stats);
    if (isValid) validCount++;
    
    const annotated = annotateCase(c);
    if (c.source_chunks && annotated.source_chunks) {
      for (let i = 0; i < c.source_chunks.length; i++) {
        const oldLabels = c.source_chunks[i].labels;
        const newLabels = annotated.source_chunks[i].labels;
        if (!oldLabels || JSON.stringify(oldLabels) !== JSON.stringify(newLabels)) {
          stats.changes.push(`${c.case_id || idx}: labels añadidas/actualizadas en chunk ${i}`);
        }
      }
    }
    return annotated;
  });

  console.log("\n📊 VALIDACIÓN Y ANOTACIÓN COMPLETADA");
  console.log(`   Casos procesados: ${annotatedCases.length}`);
  console.log(`   Casos válidos (estructura básica): ${validCount}/${annotatedCases.length}`);
  console.log(`   Errores encontrados: ${stats.errors.length}`);
  console.log(`   Advertencias: ${stats.warnings.length}`);
  console.log(`   Cambios realizados (anotación): ${stats.changes.length}`);

  if (stats.errors.length > 0) {
    console.log("\n❌ ERRORES (primeros 10):");
    stats.errors.slice(0, 10).forEach(e => console.log(`   • ${e}`));
    if (stats.errors.length > 10) console.log(`   ... y ${stats.errors.length - 10} más.`);
  } else {
    console.log("\n✅ Todos los casos pasaron la validación estructural.");
  }

  if (stats.warnings.length > 0) {
    console.log("\n⚠️ ADVERTENCIAS (primeros 10):");
    stats.warnings.slice(0, 10).forEach(w => console.log(`   • ${w}`));
    if (stats.warnings.length > 10) console.log(`   ... y ${stats.warnings.length - 10} más.`);
  }

  if (stats.changes.length > 0) {
    console.log("\n🔧 ANOTACIONES REALIZADAS (primeros 10):");
    stats.changes.slice(0, 10).forEach(c => console.log(`   • ${c}`));
    if (stats.changes.length > 10) console.log(`   ... y ${stats.changes.length - 10} más.`);
  }

  writeJson(outputPath, annotatedCases);
  console.log(`\n💾 Casos anotados guardados en ${outputPath}`);
  console.log("✨ Listo.");
}

try {
  main();
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
