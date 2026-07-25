#!/usr/bin/env node
"use strict";

/**
 * check_img.js — imprime las dimensiones de las hojas de sprites.
 *
 * Uso:
 *   node tools/check_img.js [directorio]     (por defecto assets/sprites_src)
 *
 * Sirve para comprobar de un vistazo que las hojas mantienen la proporción de
 * la rejilla 5x2 antes de procesarlas con pixelate_and_keyout.py y
 * normalize_sprites.py.
 */

const fs = require("fs");
const path = require("path");

// Rutas relativas a la raíz del repositorio, no al directorio de trabajo: antes
// sólo funcionaba si lo lanzabas desde la raíz.
const repoRoot = path.join(__dirname, "..");
const dir = path.resolve(repoRoot, process.argv[2] || "assets/sprites_src");

const COLS = 5;
const ROWS = 2;

function pngSize(file) {
  const b = fs.readFileSync(file);
  // Firma PNG + IHDR: ancho y alto son enteros big-endian de 32 bits en los
  // offsets 16 y 20. Se leen con readUInt32BE y no con DataView(b.buffer),
  // porque Node reutiliza un ArrayBuffer compartido para los archivos pequeños
  // y sin el byteOffset se leerían bytes de otro archivo.
  if (b.length < 24 || b.toString("ascii", 1, 4) !== "PNG") return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function main() {
  if (!fs.existsSync(dir)) {
    console.error(`❌ No existe el directorio ${dir}`);
    process.exit(2);
  }

  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith(".png")).sort();
  if (!files.length) {
    console.log(`(sin PNG en ${dir})`);
    return;
  }

  let warnings = 0;
  for (const f of files) {
    const size = pngSize(path.join(dir, f));
    if (!size) { console.log(`${f}: no parece un PNG válido`); warnings++; continue; }

    const cellW = size.w / COLS;
    const cellH = size.h / ROWS;
    const ratio = cellW / cellH;
    // Las celdas deben salir prácticamente cuadradas; si no, la hoja no está en
    // la rejilla 5x2 que espera el juego.
    const ok = Math.abs(ratio - 1) < 0.05;
    if (!ok) warnings++;
    console.log(
      `${f.padEnd(22)} ${size.w}x${size.h}  celda ${cellW.toFixed(0)}x${cellH.toFixed(0)}` +
      `  ${ok ? "✓ rejilla 5x2" : `⚠ celda no cuadrada (ratio ${ratio.toFixed(2)})`}`
    );
  }

  if (warnings) console.log(`\n⚠ ${warnings} hoja(s) fuera de la rejilla 5x2 esperada.`);
}

main();
