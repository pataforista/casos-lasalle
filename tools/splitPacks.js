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
// El formato del manifest vive en un solo sitio: ver tools/lib/manifest.js.
const { buildManifest, writeManifest, isReal } = require("./lib/manifest");

function readJson(p) { return JSON.parse(fs.readFileSync(path.resolve(p), "utf-8")); }
function writeJson(p, obj) {
  const abs = path.resolve(p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), "utf-8");
}

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

    (isReal(c) ? real : synth).push(c);
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

  // El índice y su validación salen de tools/lib/manifest.js: writeManifest()
  // se niega a escribir algo que js/caseLoader.js no sepa leer.
  const manifest = buildManifest({
    realPack: { file: realPackName, cases: real },
    synthPacks: synthPacks.map((p, idx) => ({ file: synthNames[idx], cases: p })),
    version,
    packSize
  });

  // Nombre EXACTO que usa tu loader:
  const manifestPath = path.join(outDir, `manifest_${version}.json`);
  writeManifest(manifestPath, manifest, outDir);

  // Conveniencia: copiar a manifest_v1.json si version=v1
  if (version === "v1") {
    writeManifest(path.join(outDir, "manifest_v1.json"), manifest, outDir);
  }

  console.log("✅ Packs + manifest generados");
  console.log(`   ${manifest.index.length} casos (${real.length} reales, ${synth.length} sintéticos)`);
  console.log("Manifest:", path.resolve(version === "v1" ? path.join(outDir, "manifest_v1.json") : manifestPath));
}

try { main(); } catch (e) {
  console.error("❌", e.message);
  process.exit(2);
}
