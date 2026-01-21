#!/usr/bin/env node
"use strict";

/**
 * splitPacks.js
 *
 * Uso:
 *  node tools/splitPacks.js ./data/cases_v1.json ./data --packSize=25 --version=v1
 *
 * Salidas:
 *  ./data/packs/cases_real_<version>.json
 *  ./data/packs/cases_synth_pack01_<version>.json ...
 *  ./data/manifest_v1.json
 */

const fs = require("fs");
const path = require("path");

function readJson(p) { return JSON.parse(fs.readFileSync(path.resolve(p), "utf-8")); }
function writeJson(p, obj) {
  const abs = path.resolve(p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), "utf-8");
}
function uniq(a) { return Array.from(new Set((a || []).filter(Boolean))); }

function parseFlags(argv) {
  const flags = {};
  for (const a of argv) {
    if (a.startsWith("--") && a.includes("=")) {
      const [k, v] = a.slice(2).split("=");
      flags[k] = v;
    }
  }
  return flags;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

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

function chunkIntoPacks(arr, packSize) {
  const packs = [];
  for (let i = 0; i < arr.length; i += packSize) packs.push(arr.slice(i, i + packSize));
  return packs;
}

function main() {
  const argv = process.argv.slice(2);
  const flags = parseFlags(argv);

  const input = argv[0] || "./data/cases_v1.json";
  const outDir = argv[1] || "./data";

  const version = flags.version || "v1";
  const packSize = Math.max(1, parseInt(flags.packSize || "25", 10));

  const cases = readJson(input);
  if (!Array.isArray(cases)) throw new Error("Input debe ser array JSON.");

  // separar y deduplicar por case_id
  const seen = new Set();
  const real = [];
  const synth = [];
  for (const c of cases) {
    if (!c || typeof c !== "object") continue;
    if (!c.case_id || seen.has(c.case_id)) continue;
    seen.add(c.case_id);

    const isReal = !!(c.metadata && c.metadata.is_real_data === true);
    (isReal ? real : synth).push(c);
  }

  const packsDir = path.join(outDir, "packs");
  fs.mkdirSync(path.resolve(packsDir), { recursive: true });

  // pack real
  const realPackName = `cases_real_${version}.json`;
  writeJson(path.join(packsDir, realPackName), real);

  // packs synth
  const synthPacks = chunkIntoPacks(synth, packSize);
  const synthNames = [];
  synthPacks.forEach((p, idx) => {
    const n = String(idx + 1).padStart(2, "0");
    const name = `cases_synth_pack${n}_${version}.json`;
    synthNames.push(name);
    writeJson(path.join(packsDir, name), p);
  });

  // manifest index con campo pack
  const index = [];
  const add = (c, packName) => {
    const labels = collectLabelsFromCase(c);
    index.push({
      case_id: c.case_id,
      title: c.title || "",
      difficulty: c.difficulty || "",
      educational_level: c.educational_level || "",
      case_type: c.case_type || "",
      is_real_data: !!(c.metadata && c.metadata.is_real_data === true),
      hitop: labels.hitop,
      rdoc: labels.rdoc,
      pack: `packs/${packName}`
    });
  };

  real.forEach(c => add(c, realPackName));
  synthPacks.forEach((p, idx) => p.forEach(c => add(c, synthNames[idx])));

  const manifest = {
    version,
    updated: today(),
    counts: {
      total: index.length,
      real: real.length,
      synthetic: synth.length,
      synth_packs: synthNames.length,
      pack_size: packSize
    },
    packs: {
      real: `packs/${realPackName}`,
      synth: synthNames.map(n => `packs/${n}`)
    },
    index
  };

  // Nombre EXACTO que usa tu loader:
  const manifestPath = path.join(outDir, `manifest_${version}.json`);
  writeJson(manifestPath, manifest);

  // Conveniencia: copiar a manifest_v1.json si version=v1
  if (version === "v1") {
    writeJson(path.join(outDir, "manifest_v1.json"), manifest);
  }

  console.log("✅ Packs + manifest generados");
  console.log("Manifest:", path.resolve(version === "v1" ? path.join(outDir, "manifest_v1.json") : manifestPath));
}

try { main(); } catch (e) {
  console.error("❌", e.message);
  process.exit(2);
}
