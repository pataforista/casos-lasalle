"use strict";
/**
 * fix_whynot_dedup.js
 *
 * Depura las listas `explanation.why_not` de cada caso:
 *  - Deja EXACTAMENTE una entrada por distractor (etiqueta = texto exacto del distractor).
 *  - Prefiere la razón clínica específica sobre el texto genérico autogenerado ("boilerplate").
 *  - Reetiqueta entradas abreviadas (p.ej. "Alzheimer") al texto exacto del distractor
 *    ("Enfermedad de Alzheimer") para que la retroalimentación por opción funcione en la UI.
 *
 * Uso:
 *   node tools/fix_whynot_dedup.js           (dry-run, solo reporta)
 *   node tools/fix_whynot_dedup.js --write    (escribe data/cases_v1.json)
 */
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");
const casesPath = path.join(__dirname, "..", "data", "cases_v1.json");
const cases = JSON.parse(fs.readFileSync(casesPath, "utf8"));

const BOILER = "no es correcta en esta presentación clínica";
const STOP = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "con", "sin", "por",
  "para", "que", "y", "o", "en", "al", "su", "sus", "the", "a"
]);

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const low = (s) => norm(s).toLowerCase();
const isBoiler = (r) => String(r || "").includes(BOILER);

// Alias curados para abreviaturas/siglas sin solape léxico con el distractor.
// clave = etiqueta abreviada (lowercase) -> token que debe aparecer en el distractor.
const ALIAS = {
  "tept": "postraumático",
  "snm": "neuroléptico",
  "tp límite": "límite",
  "hipomanía": "hipomaníaco",
  "maternity blues": "blues",
  "paperas": "paperas",
  "alzheimer": "alzheimer"
};

function sigTokens(s) {
  return low(s)
    .replace(/[^a-zñáéíóúü0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

// ¿La etiqueta `opt` se refiere al distractor `dist`?
function refersTo(opt, dist) {
  const eo = low(opt), ed = low(dist);
  if (!eo || !ed) return false;
  if (eo === ed) return true;
  const ot = sigTokens(opt);
  const dt = new Set(sigTokens(dist));
  // subconjunto de tokens significativos
  if (ot.length && ot.every((t) => dt.has(t))) return true;
  // alias curados (siglas/abreviaturas)
  const aliasTok = ALIAS[eo];
  if (aliasTok && dt.has(aliasTok)) return true;
  return false;
}

const report = [];
let casesChanged = 0;
let droppedGood = [];

for (const c of cases) {
  const wn = c.explanation && Array.isArray(c.explanation.why_not) ? c.explanation.why_not : null;
  if (!wn || !wn.length) continue;

  const dist = [];
  (c.tasks || []).forEach((t) => (t.distractors || []).forEach((d) => {
    if (!dist.some((x) => low(x) === low(d))) dist.push(d);
  }));
  if (!dist.length) continue;

  const usedEntries = new Set();
  const newWn = [];

  for (const d of dist) {
    // candidatos que se refieren a este distractor
    const cands = wn
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => refersTo(w.option, d));
    if (!cands.length) continue;

    // preferir razón NO boilerplate; entre ellas, la más larga (más específica)
    const good = cands.filter(({ w }) => !isBoiler(w.reason));
    let chosen;
    if (good.length) {
      chosen = good.sort((a, b) => String(b.w.reason).length - String(a.w.reason).length)[0];
    } else {
      chosen = cands[0];
    }
    cands.forEach(({ i }) => usedEntries.add(i));
    newWn.push({ option: norm(d), reason: norm(chosen.w.reason) });
  }

  // razones buenas que quedaron sin mapear (se perderían)
  wn.forEach((w, i) => {
    if (!usedEntries.has(i) && !isBoiler(w.reason)) {
      droppedGood.push(`${c.case_id}: "${w.option}"`);
    }
  });

  const before = JSON.stringify(wn);
  const after = JSON.stringify(newWn);
  if (before !== after) {
    casesChanged++;
    report.push({ id: c.case_id, from: wn.length, to: newWn.length });
    if (WRITE) c.explanation.why_not = newWn;
  }
}

console.log(`Casos con why_not modificado: ${casesChanged}`);
report.forEach((r) => console.log(`  ${r.id}: ${r.from} -> ${r.to} entradas`));
console.log(`\nRazones BUENAS sin mapear (se descartarían): ${droppedGood.length}`);
droppedGood.forEach((d) => console.log("  -", d));

if (WRITE) {
  fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2), "utf8");
  console.log("\n✅ Escrito data/cases_v1.json");
} else {
  console.log("\n(dry-run) usa --write para aplicar");
}
