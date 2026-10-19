#!/usr/bin/env node
"use strict";

/**
 * buildAppMap.js — mantiene vivo el mapa de la aplicación.
 *
 * Regenera el bloque automático de docs/MAPA_APP.md (entre los marcadores
 * <!-- AUTO:START --> y <!-- AUTO:END -->) leyendo el código real, y corre
 * comprobaciones de coherencia que antes sólo se descubrían en producción
 * (un sprite fuera de la caché offline, un script sin precachear…).
 *
 * Uso:
 *   node tools/buildAppMap.js           # reescribe el bloque automático
 *   node tools/buildAppMap.js --check   # no escribe; falla (exit 1) si el
 *                                       # mapa está desactualizado o si una
 *                                       # comprobación de coherencia falla
 *
 * Además compara la huella del runtime con la anotada a mano en
 * docs/GUIA_REVISION.md ("Huella revisada: `…`"). Si no coinciden avisa, sin
 * fallar: el código cambió desde la última revisión humana de la guía.
 *
 * Todo lo generado es determinista (sin fechas) para que --check sea estable.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const MAP_PATH = path.join(ROOT, "docs/MAPA_APP.md");
const GUIDE_PATH = path.join(ROOT, "docs/GUIA_REVISION.md");
const START = "<!-- AUTO:START -->";
const END = "<!-- AUTO:END -->";

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const lines = (txt) => txt.split("\n").length;

// Archivos que forman la app publicada. Si añades uno, añádelo aquí.
const RUNTIME_FILES = [
  "index.html",
  "sw.js",
  "manifest.webmanifest",
  "assets/styles.css",
  ...fs.readdirSync(path.join(ROOT, "js")).filter(f => f.endsWith(".js")).sort().map(f => `js/${f}`)
];

/* ------------------------------------------------------------------ */
/* Lectura del código                                                  */
/* ------------------------------------------------------------------ */

// Funciones y constantes con su línea. Distingue nivel superior (sin
// sangría) de funciones internas de un módulo IIFE (dos espacios).
function outline(rel) {
  const out = [];
  read(rel).split("\n").forEach((line, i) => {
    let m = line.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    if (m) return out.push({ name: m[1] + "()", line: i + 1, scope: "global" });
    m = line.match(/^const\s+([A-Za-z_$][\w$]*)\s*=/);
    if (m) return out.push({ name: m[1], line: i + 1, scope: "global" });
    m = line.match(/^ {2}(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    if (m) return out.push({ name: m[1] + "()", line: i + 1, scope: "inner" });
    m = line.match(/^ {2}const\s+([A-Z_][A-Z0-9_]*|[A-Z][\w]*)\s*=/);
    if (m) return out.push({ name: m[1], line: i + 1, scope: "inner" });
  });
  return out;
}

function swShell() {
  const sw = read("sw.js");
  const block = sw.slice(sw.indexOf("APP_SHELL = ["), sw.indexOf("];", sw.indexOf("APP_SHELL = [")));
  const entries = [...block.matchAll(/"\.\/([^"]*)"/g)].map(m => m[1]);
  const version = (sw.match(/CACHE_VERSION\s*=\s*"([^"]+)"/) || [])[1] || "?";
  return { entries, version };
}

function htmlScripts() {
  return [...read("index.html").matchAll(/<script[^>]+src="\.\/([^"]+)"/g)].map(m => m[1]);
}

function storageKeys() {
  const keys = new Set();
  for (const f of RUNTIME_FILES.filter(f => f.endsWith(".js"))) {
    const src = read(f);
    for (const m of src.matchAll(/(?:SafeStore\.(?:get|set)|localStorage\.(?:getItem|setItem))\(\s*['"]([\w-]+)['"]/g)) keys.add(m[1]);
    for (const m of src.matchAll(/(?:STORAGE_KEY|FAILED_KEY)\s*=\s*['"]([\w-]+)['"]/g)) keys.add(m[1]);
  }
  return [...keys].sort();
}

function spritesReferenced() {
  const src = read("js/game.js");
  return [...new Set([...src.matchAll(/["']([\w-]+_atlas\.png)["']/g)].map(m => m[1]))].sort();
}

// Clases definidas en CSS que no aparecen en ningún archivo del runtime.
// Las que se componen en JS (`ecg-${x}`, `--${tone}`) se reconocen por prefijo.
function unusedCss() {
  const css = read("assets/styles.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const classes = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
  const src = RUNTIME_FILES.filter(f => !f.endsWith(".css")).map(read).join("\n");
  const dynamicPrefixes = [
    ...[...src.matchAll(/["'` ]([a-z][\w-]*-)\$\{/g)].map(m => m[1]),   // `ecg-${x}`
    ...[...src.matchAll(/([a-z][\w-]*-)["']\s*\+/g)].map(m => m[1])      // "float-reward--" + tone
  ];
  return [...classes].filter(c =>
    !src.includes(c) && !dynamicPrefixes.some(p => c.startsWith(p))
  ).sort();
}

function dataStats() {
  const manifest = JSON.parse(read("data/manifest_v1.json"));
  const packFiles = [...new Set(manifest.index.map(e => e.pack))];
  const cases = packFiles.flatMap(p => JSON.parse(read(`data/${p}`)));
  const cell = {};
  for (const c of cases) {
    const k = `${c.educational_level || "?"} · ${c.difficulty || "?"}`;
    cell[k] = (cell[k] || 0) + 1;
  }
  const tasks = cases.flatMap(c => c.tasks || []);
  const prefixes = {};
  for (const c of cases) {
    const p = String(c.case_id).split("_")[0];
    prefixes[p] = (prefixes[p] || 0) + 1;
  }
  return {
    total: cases.length,
    indexed: manifest.index.length,
    packs: packFiles,
    cell,
    prefixes,
    multiTask: cases.filter(c => (c.tasks || []).length > 1).length,
    noDisplayTitle: cases.filter(c => !c.display_title).length,
    tasksWithRationale: tasks.filter(t => t.rationale).length,
    tasks: tasks.length,
    eduDocs: cases.filter(c => c.case_type === "documento_educativo").length
  };
}

function fingerprint() {
  const h = crypto.createHash("sha256");
  for (const f of RUNTIME_FILES) h.update(f + "\0" + read(f) + "\0");
  return h.digest("hex").slice(0, 12);
}

/* ------------------------------------------------------------------ */
/* Comprobaciones de coherencia                                        */
/* ------------------------------------------------------------------ */

function checks() {
  const problems = [];
  const { entries } = swShell();
  const shell = new Set(entries);

  for (const e of entries) {
    if (e && !exists(e)) problems.push(`sw.js precachea "${e}", que no existe: cache.addAll() fallaría y la app quedaría sin modo offline.`);
  }
  for (const s of htmlScripts()) {
    if (!shell.has(s)) problems.push(`index.html carga "${s}" pero sw.js no lo precachea: offline la app no arranca.`);
  }
  for (const sprite of spritesReferenced()) {
    const rel = `assets/sprites/${sprite}`;
    if (!exists(rel)) problems.push(`game.js usa el sprite "${rel}", que no existe.`);
    else if (!shell.has(rel)) problems.push(`El sprite "${rel}" no está en APP_SHELL: offline sale el retrato vacío.`);
  }
  const stats = dataStats();
  if (stats.total !== stats.indexed) {
    problems.push(`El manifest indexa ${stats.indexed} casos pero los packs tienen ${stats.total}. Ejecuta npm run split.`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map(r => `| ${r.join(" | ")} |`)
  ].join("\n");
}

function render() {
  const out = [];
  const { entries, version } = swShell();
  const stats = dataStats();
  const unused = unusedCss();

  out.push("> Bloque generado por `npm run map`. No lo edites a mano: se sobrescribe.");
  out.push("");
  out.push(`**Huella del runtime:** \`${fingerprint()}\` · **CACHE_VERSION:** \`${version}\``);
  out.push("");

  out.push("### Archivos del runtime");
  out.push("");
  out.push(table(["Archivo", "Líneas", "KB"], RUNTIME_FILES.map(f => {
    const txt = read(f);
    return [`\`${f}\``, String(lines(txt)), (Buffer.byteLength(txt) / 1024).toFixed(1)];
  })));
  out.push("");

  out.push("### Índice de símbolos");
  out.push("");
  out.push("Nivel superior y funciones internas de cada módulo, con su línea. Úsalo para saltar directo al código (`archivo:línea`).");
  out.push("");
  for (const f of RUNTIME_FILES.filter(f => f.startsWith("js/") || f === "sw.js")) {
    const items = outline(f);
    if (!items.length) continue;
    out.push(`<details><summary><code>${f}</code> · ${items.length} símbolos</summary>`);
    out.push("");
    out.push(items.map(it => `- \`${f}:${it.line}\` ${it.scope === "inner" ? "↳ " : ""}\`${it.name}\``).join("\n"));
    out.push("");
    out.push("</details>");
    out.push("");
  }

  out.push("### Caché offline (APP_SHELL de `sw.js`)");
  out.push("");
  out.push(entries.map(e => `\`./${e}\``).join(" · "));
  out.push("");

  out.push("### Claves de almacenamiento local");
  out.push("");
  out.push(storageKeys().map(k => `\`${k}\``).join(" · "));
  out.push("");

  out.push("### Banco de casos");
  out.push("");
  out.push(`${stats.total} casos en ${stats.packs.map(p => `\`data/${p}\``).join(", ")} · ${stats.multiTask} con varias preguntas · ${stats.tasks} preguntas en total.`);
  out.push("");
  out.push(table(["Nivel · dificultad", "Casos"], Object.entries(stats.cell).sort().map(([k, v]) => [k, String(v)])));
  out.push("");
  out.push(table(["Prefijo de case_id", "Casos"], Object.entries(stats.prefixes).sort().map(([k, v]) => [`\`${k}_\``, String(v)])));
  out.push("");
  out.push("Deuda editorial medida automáticamente:");
  out.push("");
  out.push(`- Casos sin \`display_title\` neutro: **${stats.noDisplayTitle}**`);
  out.push(`- Preguntas con \`rationale\` propio: **${stats.tasksWithRationale}/${stats.tasks}** (el resto usa el del caso)`);
  out.push(`- Casos \`documento_educativo\`: **${stats.eduDocs}** (el código los soporta: sin reloj, ECG plano)`);
  out.push("");

  out.push("### Coherencia");
  out.push("");
  const problems = checks();
  out.push(problems.length ? problems.map(p => `- ❌ ${p}`).join("\n") : "- ✅ APP_SHELL, scripts de index.html, sprites y manifest coherentes.");
  out.push(unused.length
    ? `- ⚠️ Clases CSS sin uso aparente (${unused.length}): ${unused.map(c => `\`.${c}\``).join(" ")}`
    : "- ✅ Sin clases CSS huérfanas detectables.");

  return { text: out.join("\n"), problems };
}

function splice(doc, block) {
  const a = doc.indexOf(START);
  const b = doc.indexOf(END);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(`docs/MAPA_APP.md no tiene los marcadores ${START} … ${END}`);
  }
  return doc.slice(0, a + START.length) + "\n" + block + "\n" + doc.slice(b);
}

function guideFingerprint() {
  if (!fs.existsSync(GUIDE_PATH)) return null;
  const m = fs.readFileSync(GUIDE_PATH, "utf8").match(/Huella revisada:\s*`([0-9a-f]+)`/);
  return m ? m[1] : null;
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const { text, problems } = render();
  const current = fs.readFileSync(MAP_PATH, "utf8");
  const next = splice(current, text);
  let failed = false;

  if (checkOnly) {
    if (next !== current) {
      console.error("❌ docs/MAPA_APP.md está desactualizado. Ejecuta: npm run map");
      failed = true;
    } else {
      console.log("✅ Mapa al día");
    }
  } else if (next !== current) {
    fs.writeFileSync(MAP_PATH, next, "utf8");
    console.log("🗺️  docs/MAPA_APP.md actualizado");
  } else {
    console.log("🗺️  docs/MAPA_APP.md ya estaba al día");
  }

  if (problems.length) {
    problems.forEach(p => console.error("❌ " + p));
    failed = true;
  }

  const fp = fingerprint();
  const reviewed = guideFingerprint();
  if (reviewed && reviewed !== fp) {
    console.warn(`⚠️  El runtime cambió desde la última revisión anotada (guía: ${reviewed}, actual: ${fp}).`);
    console.warn("    Repasa docs/GUIA_REVISION.md, añade una fila al registro y actualiza la huella.");
  }

  if (failed) process.exit(1);
}

main();
