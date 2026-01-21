#!/usr/bin/env node
"use strict";

/**
 * buildManifest.js
 *
 * Uso:
 *   node tools/buildManifest.js ./data/cases_v1.json ./data/manifest_v1.json
 *
 * Crea un manifest “ligero” SIN packs (si lo quisieras usar),
 * pero en tu arquitectura con packs normalmente usarás splitPacks.js.
 */

const fs = require("fs");
const path = require("path");

function readJson(p) {
  const abs = path.resolve(p);
  return JSON.parse(fs.readFileSync(abs, "utf-8"));
}
function writeJson(p, obj) {
  const abs = path.resolve(p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), "utf-8");
}
function uniq(a) { return Array.from(new Set((a || []).filter(Boolean))); }

function collectLabelsFromCase(c) {
  const hitop = [];
  const rdoc = [];
  const chunks = Array.isArray(c.source_chunks) ? c.source_chunks : [];
  for (const ch of chunks) {
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

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function main() {
  const input = process.argv[2] || "./data/cases_v1.json";
  const output = process.argv[3] || "./data/manifest_v1.json";

  const cases = readJson(input);
  if (!Array.isArray(cases)) throw new Error("cases_v1.json debe ser array.");

  let real = 0, synth = 0;
  const index = [];
  const seen = new Set();

  for (const c of cases) {
    if (!c || typeof c !== "object") continue;
    if (!c.case_id || seen.has(c.case_id)) continue;
    seen.add(c.case_id);

    const isReal = !!(c.metadata && c.metadata.is_real_data === true);
    if (isReal) real++; else synth++;

    const labels = collectLabelsFromCase(c);

    index.push({
      case_id: c.case_id,
      title: c.title || "",
      difficulty: c.difficulty || "",
      educational_level: c.educational_level || "",
      case_type: c.case_type || "",
      is_real_data: isReal,
      hitop: labels.hitop,
      rdoc: labels.rdoc
    });
  }

  const manifest = {
    version: "v1",
    updated: today(),
    counts: { total: index.length, real, synthetic: synth },
    index
  };

  writeJson(output, manifest);
  console.log("✅ Manifest generado:", path.resolve(output));
}

try { main(); } catch (e) {
  console.error("❌", e.message);
  process.exit(2);
}
