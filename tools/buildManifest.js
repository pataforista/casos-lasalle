#!/usr/bin/env node
"use strict";

/**
 * buildManifest.js
 *
 * Reconstruye data/manifest_v1.json a partir de un pack ya existente, sin
 * volver a repartir los casos. Úsalo cuando sólo se ha editado el contenido de
 * un pack y hay que refrescar el índice.
 *
 * Si lo que quieres es repartir cases_v1.json en packs desde cero, la
 * herramienta es splitPacks.js.
 *
 * Uso:
 *   node tools/buildManifest.js [--pack=packs/cases_real_v1.json] [--data=./data] [--version=v1]
 *
 * ANTES: generaba un índice sin el campo `pack`, que js/caseLoader.js exige
 * (`if (!meta.pack) throw`). Un manifest así dejaba la app sin banco de casos.
 * Ahora el formato lo fija tools/lib/manifest.js y se valida antes de escribir.
 */

const fs = require("fs");
const path = require("path");
const { buildManifest, writeManifest } = require("./lib/manifest");

function parseFlags(argv) {
  const flags = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      flags[k] = v === undefined ? true : v;
    }
  }
  return flags;
}

function main() {
  const flags = parseFlags(process.argv.slice(2));

  const dataDir = path.resolve(flags.data || "./data");
  const version = flags.version || "v1";
  const packRel = String(flags.pack || "packs/cases_real_v1.json").replace(/^\.?\//, "");
  const packFile = packRel.replace(/^packs\//, "");
  const packAbs = path.join(dataDir, "packs", packFile);

  if (!fs.existsSync(packAbs)) {
    throw new Error(
      `No existe el pack ${packAbs}.\n` +
      `   Pásalo con --pack=packs/<archivo>.json o genera los packs con splitPacks.js.`
    );
  }

  const cases = JSON.parse(fs.readFileSync(packAbs, "utf-8"));
  if (!Array.isArray(cases)) throw new Error(`El pack ${packRel} debe ser un array JSON.`);

  const manifest = buildManifest({
    realPack: { file: packFile, cases },
    synthPacks: [],
    version
  });

  const out = writeManifest(path.join(dataDir, `manifest_${version}.json`), manifest, dataDir);
  console.log(`✅ Manifest generado: ${out}`);
  console.log(`   ${manifest.index.length} casos indexados desde packs/${packFile}`);
}

try { main(); } catch (e) {
  console.error("❌", e.message);
  process.exit(2);
}
