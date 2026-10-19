#!/usr/bin/env node
"use strict";

/**
 * editDoc.js — EDITAR_JUEGO.md ⇄ juego.
 *
 * EDITAR_JUEGO.md es la fuente de verdad de todo lo que se ajusta sin
 * programar: números de la guardia, precios, residentes, frases, pase de
 * visita, briefing del menú y título/dificultad de cada caso. Este script lo
 * convierte en:
 *   - js/content.js            (GAME_CONFIG, NARRATIVE, BOSS_ROUNDS, ROSTER, RESIDENT_LINES)
 *   - data/cases_v1.json       (display_title y difficulty de cada caso)
 *   - data/packs + manifest    (vía tools/splitPacks.js, sólo si cambiaron casos)
 *   - sw.js                    (sube CACHE_VERSION si cambió js/content.js)
 * y vuelve a escribir el documento normalizado, refrescando las notas de
 * sólo lectura (respuesta esperada, aviso de spoiler).
 *
 * Uso:
 *   node tools/editDoc.js apply    # aplica el documento (npm run apply)
 *   node tools/editDoc.js check    # falla si documento y juego no coinciden
 *   node tools/editDoc.js export   # reescribe el documento desde el juego
 *
 * Los errores se explican en castellano con la línea del documento: el
 * documento lo edita gente que no tiene por qué saber JavaScript.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DOC = path.join(ROOT, "EDITAR_JUEGO.md");
const CONTENT = path.join(ROOT, "js/content.js");
const CASES = path.join(ROOT, "data/cases_v1.json");
const SW = path.join(ROOT, "sw.js");
const SPRITES = path.join(ROOT, "assets/sprites");

/* ------------------------------------------------------------------ */
/* Esquema: qué se puede editar y cómo se llama en el documento        */
/* ------------------------------------------------------------------ */

const CONFIG_FIELDS = [
  { key: "maxLives",         label: "Vidas al empezar",                         min: 1,   max: 9,     int: true,  hint: "Entre 1 y 9." },
  { key: "startCoins",       label: "Monedas de un jugador nuevo",              min: 0,   max: 5000,  int: true,  hint: "Sólo afecta a quien juega por primera vez." },
  { key: "baseTurnSeconds",  label: "Segundos por pregunta",                    min: 10,  max: 300,   int: true,  hint: "Reloj completo, sin racha." },
  { key: "minTurnSeconds",   label: "Segundos mínimos con racha larga",         min: 5,   max: 300,   int: true,  hint: "La racha nunca baja el reloj de aquí." },
  { key: "difficultyScale",  label: "Cuánto aprieta la racha al reloj",         min: 0,   max: 20,    int: false, hint: "0 = la racha no acorta el reloj. 4,5 = actual." },
  { key: "advanceDelayMs",   label: "Milisegundos antes del avance automático", min: 1000, max: 20000, int: true, hint: "3500 = 3,5 segundos para leer la retroalimentación." },
  { key: "modalDelayMs",     label: "Pausa antes de mostrar la retroalimentación (ms)", min: 0, max: 3000, int: true, hint: "Deja ver qué opción era la correcta." },
  { key: "baseReward",       label: "Monedas por acierto",                      min: 0,   max: 1000,  int: true,  hint: "Antes de bonos." },
  { key: "baseXP",           label: "Experiencia por acierto",                  min: 0,   max: 1000,  int: true,  hint: "La experiencia sube el rango (R1 → LEYENDA)." },
  { key: "speedBonusMax",    label: "Bono máximo por rapidez",                  min: 0,   max: 1000,  int: true,  hint: "Monedas extra si respondes con el reloj intacto." },
  { key: "fastThreshold",    label: "Reloj restante para contar como reflejo",  min: 0,   max: 1,     int: false, hint: "Entre 0 y 1. 0,6 = con el 60 % del reloj aún por gastar." },
  { key: "streakStep",       label: "Aciertos seguidos para subir el multiplicador", min: 1, max: 20, int: true, hint: "Cada escalón suma ×0,5." },
  { key: "maxMultiplier",    label: "Multiplicador máximo",                     min: 1,   max: 10,    int: false, hint: "3 = la racha triplica como mucho." },
  { key: "signFine",         label: "Multa por firmar una nota equivocada",     min: 0,   max: 1000,  int: true,  hint: "Firmar dobla lo ganado si aciertas." },
  { key: "casesPerRound",    label: "Pacientes por pase de visita",             min: 1,   max: 50,    int: true,  hint: "Cada cuántos pacientes evalúa el Dr. Celada." },
  { key: "costs.hint",       label: "Precio de la pista",                       min: 0,   max: 1000,  int: true,  hint: "Descarta una opción incorrecta." },
  { key: "costs.life",       label: "Precio de una vida",                       min: 0,   max: 5000,  int: true,  hint: "" },
  { key: "costs.time",       label: "Precio del tiempo extra",                  min: 0,   max: 1000,  int: true,  hint: "" },
  { key: "timeBoostSeconds", label: "Segundos que compra el tiempo extra",      min: 5,   max: 300,   int: true,  hint: "" }
];

const LINE_GROUPS = [
  { key: "presentNormal", label: "Presenta un paciente estable" },
  { key: "presentTachy",  label: "Presenta un paciente agitado" },
  { key: "presentBrady",  label: "Presenta un paciente hipoactivo" },
  { key: "ok",            label: "Tras un acierto" },
  { key: "okStreak",      label: "Tras un acierto en racha (3 o más)" },
  { key: "okSigned",      label: "Tras acertar con la nota firmada" },
  { key: "error",         label: "Tras un error" },
  { key: "errorSigned",   label: "Tras fallar con la nota firmada" },
  { key: "timeout",       label: "Cuando se agota el reloj" },
  { key: "decompensated", label: "Cuando el paciente se descompensa" },
  { key: "rescued",       label: "Cuando el paciente se estabiliza" }
];

// Nombres amables para las poses del sprite y el color del pase de visita.
const MOODS = {
  normal: "normal", habla: "speaking", piensa: "thinking", aprueba: "ok",
  euforia: "streak", preocupado: "worried", shock: "shock", agotado: "exhausted",
  sorprendido: "surprised", enojado: "angry"
};
const TONES = { perfecto: "perfect", bueno: "good", regular: "ok", malo: "bad" };
const DIFFICULTIES = { "fácil": "facil", "media": "media", "difícil": "dificil" };

const invert = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const MOOD_NAMES = invert(MOODS);
const TONE_NAMES = invert(TONES);
const DIFF_NAMES = invert(DIFFICULTIES);

/* ------------------------------------------------------------------ */
/* Lectura del estado actual del juego                                 */
/* ------------------------------------------------------------------ */

function readContent() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(CONTENT, "utf8") +
    ";this.out={GAME_CONFIG,NARRATIVE,BOSS_ROUNDS,ROSTER,RESIDENT_LINES};", ctx);
  return JSON.parse(JSON.stringify(ctx.out));
}

const readCases = () => JSON.parse(fs.readFileSync(CASES, "utf8"));

function getPath(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setPath(obj, dotted, value) {
  const keys = dotted.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) o = o[k] = o[k] || {};
  o[keys[keys.length - 1]] = value;
}

/* ------------------------------------------------------------------ */
/* Ayudas para la persona que revisa (notas de sólo lectura)           */
/* ------------------------------------------------------------------ */

const STOP = new Set(["paciente", "pacientes", "manejo", "clinica", "clinico", "caso", "criterios",
  "trastorno", "diagnostico", "evaluacion", "inicial", "primera", "linea", "sobre", "entre",
  "desde", "hasta", "mayor", "menor", "contra", "tratamiento"]);

function words(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 5 && !STOP.has(w));
}

// Palabras del título que también aparecen en alguna respuesta esperada:
// si el título las dice, probablemente regala la respuesta.
function spoilerWords(c) {
  const title = new Set(words(c.display_title || c.title));
  const answers = new Set((c.tasks || []).flatMap(t => words(t.expected_answer)));
  // Raíz común de 6 letras: "psicosis" / "psicotico", "mania" / "maniaco".
  const stems = new Set([...answers].map(w => w.slice(0, 6)));
  return [...title].filter(w => answers.has(w) || stems.has(w.slice(0, 6)));
}

/* ------------------------------------------------------------------ */
/* Exportar: juego → documento                                         */
/* ------------------------------------------------------------------ */

function fmtNum(n) {
  return String(n).replace(".", ",");
}

function exportDoc(content, cases, notes) {
  const cfg = content.GAME_CONFIG;
  const o = [];
  const spoilers = cases.filter(c => spoilerWords(c).length);

  o.push("# Editar el juego");
  o.push("");
  o.push("Este documento **es** la configuración del juego. Cambia un número o una frase, guarda, y el juego cambia.");
  o.push("");
  o.push("**Cómo editarlo desde el móvil:** abre este archivo en github.com → ✏️ (lápiz) → cambia lo que quieras → *Commit changes*. En un minuto GitHub aplica el cambio solo y deja un commit «Aplicar EDITAR_JUEGO.md». Si algo está mal escrito, la acción de GitHub sale en rojo con la línea exacta y el juego no cambia.");
  o.push("");
  o.push("**Reglas para no romper nada:**");
  o.push("");
  o.push("- Cambia sólo lo que va **después de los dos puntos** (`- **Etiqueta:** valor`). No cambies las etiquetas en negrita.");
  o.push("- Las líneas con sangría (las que empiezan con espacios, en gris al verlo) son **notas de ayuda**: se regeneran solas, editarlas no cambia nada.");
  o.push("- Los decimales pueden ir con coma (`4,5`) o punto (`4.5`).");
  o.push("- Para añadir una frase, añade otra línea `- …` en su grupo. Para quitarla, borra la línea (cada grupo necesita al menos una).");
  o.push("- Escribe notas libres para el equipo al final, en **Notas de revisión**: es lo único que se conserva tal cual.");
  o.push("");

  // 1. Ajustes
  o.push("<!-- sección: ajustes -->");
  o.push("## 1. Ajustes de la guardia");
  o.push("");
  for (const f of CONFIG_FIELDS) {
    o.push(`- **${f.label}:** ${fmtNum(getPath(cfg, f.key))}`);
    if (f.hint) o.push(`  - ${f.hint}`);
  }
  o.push("");

  // 2. Briefing
  o.push("<!-- sección: briefing -->");
  o.push("## 2. Briefing del menú (lo que dice el Dr. Celada)");
  o.push("");
  o.push(`- **Presentación:** ${content.NARRATIVE.intro}`);
  for (const r of content.NARRATIVE.rules) o.push(`- **Regla:** ${r}`);
  o.push(`- **Cierre:** ${content.NARRATIVE.consequence}`);
  o.push("  - `{pase}` se sustituye por el número de «Pacientes por pase de visita».");
  o.push("");

  // 3. Residentes
  o.push("<!-- sección: residentes -->");
  o.push("## 3. Residentes");
  o.push("");
  o.push("Cada bloque es un residente. Para añadir uno, copia un bloque entero: el sprite debe existir en `assets/sprites/`.");
  o.push("");
  for (const r of content.ROSTER) {
    o.push(`### ${r.title} ${r.name}`);
    o.push(`- **Frase propia:** ${r.signature}`);
    o.push(`- **Sprite:** ${r.sprite}`);
    o.push("");
  }

  // 4. Frases
  o.push("<!-- sección: frases -->");
  o.push("## 4. Frases de los residentes");
  o.push("");
  o.push("El juego elige una al azar de cada grupo, sin repetir la última.");
  o.push("");
  for (const g of LINE_GROUPS) {
    o.push(`### ${g.label} <!-- ${g.key} -->`);
    for (const line of content.RESIDENT_LINES[g.key] || []) o.push(`- ${line}`);
    o.push("");
  }

  // 5. Pase de visita
  o.push("<!-- sección: pase -->");
  o.push("## 5. Pase de visita del Dr. Celada");
  o.push("");
  o.push("Un nivel por bloque, del mejor al peor. **Desde** es el porcentaje mínimo de aciertos del bloque. Tiene que haber un nivel «Desde: 0 %».");
  o.push("");
  for (const t of content.BOSS_ROUNDS) {
    o.push(`### ${t.label}`);
    o.push(`- **Desde:** ${Math.round(t.min * 100)} %`);
    o.push(`- **Bono:** ${t.bonus}`);
    o.push(`- **Devuelve una vida:** ${t.heal ? "sí" : "no"}`);
    o.push(`- **Cara:** ${MOOD_NAMES[t.mood] || t.mood}`);
    o.push(`- **Color:** ${TONE_NAMES[t.tone] || t.tone}`);
    for (const l of t.lines) o.push(`- **Frase:** ${l}`);
    o.push("");
  }
  o.push(`  - Caras posibles: ${Object.keys(MOODS).join(", ")}.`);
  o.push(`  - Colores posibles: ${Object.keys(TONES).join(", ")}.`);
  o.push("");

  // 6. Casos
  o.push("<!-- sección: casos -->");
  o.push("## 6. Casos: título y dificultad");
  o.push("");
  o.push("El título es lo primero que ve el jugador. **No debe nombrar el diagnóstico si el diagnóstico es la respuesta.** Los casos con ⚠️ tienen palabras del título que también aparecen en la respuesta esperada: revísalos primero.");
  o.push("");
  o.push(`Dificultades posibles: ${Object.keys(DIFFICULTIES).join(", ")}.`);
  o.push("");
  o.push(`**Resumen:** ${cases.length} casos · ${spoilers.length} con posible spoiler · ` +
    Object.keys(DIFFICULTIES).map(d => `${cases.filter(c => c.difficulty === DIFFICULTIES[d]).length} ${d}`).join(" · "));
  o.push("");
  for (const c of cases) {
    const sw = spoilerWords(c);
    o.push(`### ${sw.length ? "⚠️ " : ""}${c.case_id}`);
    o.push(`- **Título:** ${c.display_title || c.title || ""}`);
    o.push(`- **Dificultad:** ${DIFF_NAMES[c.difficulty] || c.difficulty}`);
    (c.tasks || []).forEach((t, i) => {
      o.push(`  - Respuesta ${i + 1}: ${String(t.expected_answer || "").replace(/\s+/g, " ")}`);
    });
    if (sw.length) o.push(`  - ⚠️ El título comparte con la respuesta: ${sw.join(", ")}`);
    o.push("");
  }

  o.push("<!-- sección: notas -->");
  o.push("## Notas de revisión");
  o.push("");
  o.push(notes && notes.trim() ? notes.trim() : "_Escribe aquí comentarios para el equipo. Esta sección se conserva tal cual._");
  o.push("");
  return o.join("\n");
}

/* ------------------------------------------------------------------ */
/* Importar: documento → juego                                         */
/* ------------------------------------------------------------------ */

class DocError extends Error {}

function parseDoc(text) {
  const errors = [];
  const fail = (lineNo, msg) => errors.push(`línea ${lineNo}: ${msg}`);

  // Partir por secciones marcadas con <!-- sección: x -->
  const sections = {};
  let current = null;
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const m = raw.match(/^<!--\s*secci[oó]n:\s*([a-z]+)\s*-->\s*$/);
    if (m) {
      current = m[1];
      sections[current] = [];
      return;
    }
    if (current) sections[current].push({ text: raw, no: i + 1 });
  });

  for (const s of ["ajustes", "briefing", "residentes", "frases", "pase", "casos"]) {
    if (!sections[s]) errors.push(`falta la marca <!-- sección: ${s} -->. No borres los comentarios que separan las secciones.`);
  }
  if (errors.length) throw new DocError(errors.join("\n"));

  // Sólo cuentan las viñetas sin sangría; lo indentado son notas.
  const field = (ln) => {
    const m = ln.text.match(/^-\s+(?:\*\*)?([^:*]+?)\s*:(?:\*\*)?\s*(.*)$/);
    return m ? { label: m[1].trim(), value: m[2].trim(), no: ln.no } : null;
  };
  const isBullet = (ln) => /^-\s+/.test(ln.text);
  const heading = (ln) => {
    const m = ln.text.match(/^###\s+(.*?)\s*(?:<!--\s*([\w]+)\s*-->)?\s*$/);
    return m ? { title: m[1].trim(), key: m[2], no: ln.no } : null;
  };
  // Agrupa líneas bajo cada ### de la sección.
  const blocks = (sec) => {
    const out = [];
    for (const ln of sec) {
      const h = heading(ln);
      if (h) { out.push({ ...h, lines: [] }); continue; }
      if (out.length) out[out.length - 1].lines.push(ln);
      else if (isBullet(ln)) fail(ln.no, "esta línea está fuera de cualquier bloque ###.");
    }
    return out;
  };

  const num = (f, spec) => {
    const clean = f.value.replace(/\s*%$/, "").replace(",", ".").trim();
    if (!/^-?\d+(\.\d+)?$/.test(clean)) {
      fail(f.no, `«${f.label}» debe ser un número y dice «${f.value}».`);
      return null;
    }
    const n = Number(clean);
    if (spec) {
      if (spec.int && !Number.isInteger(n)) fail(f.no, `«${f.label}» debe ser un número entero.`);
      if (n < spec.min || n > spec.max) fail(f.no, `«${f.label}» debe estar entre ${fmtNum(spec.min)} y ${fmtNum(spec.max)}; dice ${f.value}.`);
    }
    return n;
  };
  const text1 = (f) => {
    if (!f.value) fail(f.no, `«${f.label}» está vacío.`);
    return f.value;
  };

  // 1. Ajustes
  const config = {};
  const byLabel = new Map(CONFIG_FIELDS.map(f => [f.label.toLowerCase(), f]));
  for (const ln of sections.ajustes) {
    if (!isBullet(ln)) continue;
    const f = field(ln);
    if (!f) { fail(ln.no, "formato esperado: `- **Etiqueta:** valor`."); continue; }
    const spec = byLabel.get(f.label.toLowerCase());
    if (!spec) { fail(f.no, `ajuste desconocido «${f.label}». No cambies las etiquetas en negrita.`); continue; }
    if (getPath(config, spec.key) !== undefined) fail(f.no, `«${f.label}» aparece dos veces.`);
    setPath(config, spec.key, num(f, spec));
  }
  for (const spec of CONFIG_FIELDS) {
    if (getPath(config, spec.key) === undefined) errors.push(`Ajustes: falta «${spec.label}».`);
  }
  if (config.minTurnSeconds > config.baseTurnSeconds) {
    errors.push("Ajustes: «Segundos mínimos con racha larga» no puede ser mayor que «Segundos por pregunta».");
  }

  // 2. Briefing
  const narrative = { intro: "", rules: [], consequence: "" };
  for (const ln of sections.briefing) {
    if (!isBullet(ln)) continue;
    const f = field(ln);
    const label = f && f.label.toLowerCase();
    if (label === "presentación" || label === "presentacion") narrative.intro = text1(f);
    else if (label === "regla") narrative.rules.push(text1(f));
    else if (label === "cierre") narrative.consequence = text1(f);
    else fail(ln.no, "en el briefing sólo valen «Presentación», «Regla» y «Cierre».");
  }
  if (!narrative.intro) errors.push("Briefing: falta «Presentación».");
  if (!narrative.rules.length) errors.push("Briefing: hace falta al menos una «Regla».");
  if (!narrative.consequence) errors.push("Briefing: falta «Cierre».");

  // 3. Residentes
  const roster = [];
  for (const b of blocks(sections.residentes)) {
    const m = b.title.match(/^(Dra?\.)\s+(.+)$/);
    if (!m) { fail(b.no, `el título debe ser «Dr. Nombre» o «Dra. Nombre»; dice «${b.title}».`); continue; }
    const r = { name: m[2].trim(), title: m[1], signature: "", sprite: "" };
    for (const ln of b.lines) {
      if (!isBullet(ln)) continue;
      const f = field(ln);
      const label = f && f.label.toLowerCase();
      if (label === "frase propia") r.signature = text1(f);
      else if (label === "sprite") {
        r.sprite = text1(f);
        if (!/^[\w-]+_atlas\.png$/.test(r.sprite)) fail(f.no, "el sprite debe llamarse `nombre_atlas.png`.");
        else if (!fs.existsSync(path.join(SPRITES, r.sprite))) fail(f.no, `no existe assets/sprites/${r.sprite}.`);
      } else fail(ln.no, "en un residente sólo valen «Frase propia» y «Sprite».");
    }
    if (!r.signature) fail(b.no, `${b.title}: falta «Frase propia».`);
    if (!r.sprite) fail(b.no, `${b.title}: falta «Sprite».`);
    if (roster.some(x => x.name === r.name)) fail(b.no, `hay dos residentes llamados ${r.name}.`);
    roster.push(r);
  }
  if (roster.length < 2) errors.push("Residentes: hacen falta al menos dos (el juego evita repetir el del caso anterior).");

  // 4. Frases
  const residentLines = {};
  const groupKeys = new Set(LINE_GROUPS.map(g => g.key));
  for (const b of blocks(sections.frases)) {
    if (!b.key || !groupKeys.has(b.key)) { fail(b.no, `grupo de frases sin su marca <!-- … --> o desconocido: «${b.title}». No borres el comentario del título.`); continue; }
    residentLines[b.key] = b.lines.filter(isBullet).map(ln => ln.text.replace(/^-\s+/, "").trim()).filter(Boolean);
  }
  for (const g of LINE_GROUPS) {
    if (!residentLines[g.key] || !residentLines[g.key].length) errors.push(`Frases: el grupo «${g.label}» necesita al menos una frase.`);
  }

  // 5. Pase de visita
  const tiers = [];
  for (const b of blocks(sections.pase)) {
    const t = { min: null, label: b.title, mood: "", tone: "", bonus: null, heal: false, lines: [] };
    for (const ln of b.lines) {
      if (!isBullet(ln)) continue;
      const f = field(ln);
      const label = f && f.label.toLowerCase();
      if (label === "desde") { const n = num(f, { min: 0, max: 100, int: false }); if (n !== null) t.min = n / 100; }
      else if (label === "bono") t.bonus = num(f, { min: 0, max: 10000, int: true });
      else if (label === "devuelve una vida") {
        const v = f.value.toLowerCase();
        if (!["sí", "si", "no"].includes(v)) fail(f.no, "«Devuelve una vida» debe ser «sí» o «no».");
        t.heal = v !== "no";
      } else if (label === "cara") {
        t.mood = MOODS[f.value.toLowerCase()];
        if (!t.mood) fail(f.no, `cara desconocida «${f.value}». Posibles: ${Object.keys(MOODS).join(", ")}.`);
      } else if (label === "color") {
        t.tone = TONES[f.value.toLowerCase()];
        if (!t.tone) fail(f.no, `color desconocido «${f.value}». Posibles: ${Object.keys(TONES).join(", ")}.`);
      } else if (label === "frase") t.lines.push(text1(f));
      else fail(ln.no, "en el pase sólo valen «Desde», «Bono», «Devuelve una vida», «Cara», «Color» y «Frase».");
    }
    if (t.min === null) fail(b.no, `${b.title}: falta «Desde».`);
    if (t.bonus === null) fail(b.no, `${b.title}: falta «Bono».`);
    if (!t.lines.length) fail(b.no, `${b.title}: necesita al menos una «Frase».`);
    if (!t.mood) t.mood = "normal";
    if (!t.tone) t.tone = "ok";
    tiers.push(t);
  }
  tiers.sort((a, b) => (b.min ?? 0) - (a.min ?? 0));
  if (!tiers.some(t => t.min === 0)) errors.push("Pase de visita: tiene que haber un nivel con «Desde: 0 %», si no un bloque malo no tendría evaluación.");

  // 6. Casos
  const cases = {};
  for (const b of blocks(sections.casos)) {
    const id = b.title.replace(/^⚠️\s*/, "").trim();
    const c = {};
    for (const ln of b.lines) {
      if (!isBullet(ln)) continue;
      const f = field(ln);
      const label = f && f.label.toLowerCase();
      if (label === "título" || label === "titulo") c.display_title = text1(f);
      else if (label === "dificultad") {
        c.difficulty = DIFFICULTIES[f.value.toLowerCase()] || DIFFICULTIES[f.value.toLowerCase().replace("facil", "fácil").replace("dificil", "difícil")];
        if (!c.difficulty) fail(f.no, `dificultad desconocida «${f.value}». Posibles: ${Object.keys(DIFFICULTIES).join(", ")}.`);
      } else fail(ln.no, "en un caso sólo valen «Título» y «Dificultad».");
    }
    cases[id] = { ...c, no: b.no };
  }

  // Notas: todo lo que va después de la marca, tal cual (sin el título).
  const notes = (sections.notas || []).map(l => l.text).join("\n")
    .replace(/^\s*## Notas de revisión\s*/, "")
    .replace(/^_Escribe aquí comentarios para el equipo\. Esta sección se conserva tal cual\._\s*$/m, "");

  if (errors.length) throw new DocError(errors.join("\n"));

  return {
    content: {
      GAME_CONFIG: config,
      NARRATIVE: narrative,
      BOSS_ROUNDS: tiers,
      ROSTER: roster,
      RESIDENT_LINES: Object.fromEntries(LINE_GROUPS.map(g => [g.key, residentLines[g.key]]))
    },
    cases,
    notes
  };
}

/* ------------------------------------------------------------------ */
/* Escritura                                                           */
/* ------------------------------------------------------------------ */

function renderContent(content) {
  const js = (v) => JSON.stringify(v, null, 2);
  return `"use strict";
/* ============================================================================
   content.js — GENERADO por tools/editDoc.js a partir de EDITAR_JUEGO.md.
   No lo edites a mano: el próximo «npm run apply» lo sobrescribe.
   Para cambiar un número o una frase, edita EDITAR_JUEGO.md.
   ============================================================================ */

const GAME_CONFIG = ${js(content.GAME_CONFIG)};

const NARRATIVE = ${js(content.NARRATIVE)};

const BOSS_ROUNDS = ${js(content.BOSS_ROUNDS)};

const ROSTER = ${js(content.ROSTER)};

const RESIDENT_LINES = ${js(content.RESIDENT_LINES)};
`;
}

function applyCases(allCases, edits) {
  const errors = [];
  const ids = new Set(allCases.map(c => c.case_id));
  for (const [id, e] of Object.entries(edits)) {
    if (!ids.has(id)) errors.push(`línea ${e.no}: no existe ningún caso «${id}». No cambies los identificadores de los casos.`);
  }
  for (const id of ids) if (!edits[id]) errors.push(`Casos: falta el bloque de «${id}». Borrar un caso del documento no lo borra del juego.`);
  if (errors.length) throw new DocError(errors.join("\n"));

  let changed = 0;
  const next = allCases.map(c => {
    const e = edits[c.case_id];
    const out = { ...c };
    if (e.display_title !== undefined && e.display_title !== (c.display_title || c.title)) { out.display_title = e.display_title; changed++; }
    if (e.difficulty && e.difficulty !== c.difficulty) { out.difficulty = e.difficulty; changed++; }
    return out;
  });
  return { next, changed };
}

function bumpCacheVersion() {
  const sw = fs.readFileSync(SW, "utf8");
  const m = sw.match(/CACHE_VERSION = "psycase-v(\d+)\.(\d+)\.(\d+)"/);
  if (!m) throw new Error("No encuentro CACHE_VERSION en sw.js");
  const v = `psycase-v${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
  fs.writeFileSync(SW, sw.replace(m[0], `CACHE_VERSION = "${v}"`), "utf8");
  return v;
}

/* ------------------------------------------------------------------ */
/* Comandos                                                            */
/* ------------------------------------------------------------------ */

function currentNotes() {
  if (!fs.existsSync(DOC)) return "";
  try { return parseDoc(fs.readFileSync(DOC, "utf8")).notes; } catch { return ""; }
}

function cmdExport() {
  fs.writeFileSync(DOC, exportDoc(readContent(), readCases(), currentNotes()), "utf8");
  console.log("📝 EDITAR_JUEGO.md regenerado desde el juego");
}

function cmdApply() {
  const parsed = parseDoc(fs.readFileSync(DOC, "utf8"));
  // Todo se valida antes de escribir: o se aplica entero o no se toca nada.
  const { next, changed } = applyCases(readCases(), parsed.cases);
  const newContent = renderContent(parsed.content);
  const changes = [];

  if (newContent !== fs.readFileSync(CONTENT, "utf8")) {
    fs.writeFileSync(CONTENT, newContent, "utf8");
    changes.push("js/content.js");
    changes.push(`sw.js (${bumpCacheVersion()})`);
  }

  if (changed) {
    fs.writeFileSync(CASES, JSON.stringify(next, null, 2), "utf8");
    execFileSync(process.execPath, [path.join(__dirname, "splitPacks.js")], { cwd: ROOT, stdio: "ignore" });
    changes.push(`data/ (${changed} ${changed === 1 ? "cambio" : "cambios"} en casos)`);
  }

  // Documento normalizado: refresca avisos de spoiler y respuestas.
  const normalized = exportDoc(readContent(), readCases(), parsed.notes);
  if (normalized !== fs.readFileSync(DOC, "utf8")) {
    fs.writeFileSync(DOC, normalized, "utf8");
    changes.push("EDITAR_JUEGO.md (notas de ayuda)");
  }

  console.log(changes.length ? "✅ Aplicado: " + changes.join(", ") : "✅ Nada que aplicar: el juego ya coincide con EDITAR_JUEGO.md");
}

function cmdCheck() {
  const text = fs.readFileSync(DOC, "utf8");
  const parsed = parseDoc(text);
  const problems = [];
  if (renderContent(parsed.content) !== fs.readFileSync(CONTENT, "utf8")) problems.push("js/content.js no coincide con el documento");
  if (applyCases(readCases(), parsed.cases).changed) problems.push("los casos no coinciden con el documento");
  if (exportDoc(readContent(), readCases(), parsed.notes) !== text) problems.push("el documento tiene formato o notas de ayuda desactualizadas");
  if (problems.length) {
    console.error("❌ EDITAR_JUEGO.md tiene cambios sin aplicar (" + problems.join("; ") + "). Ejecuta: npm run apply");
    process.exit(1);
  }
  console.log("✅ EDITAR_JUEGO.md y el juego coinciden");
}

if (require.main === module) {
  const cmd = process.argv[2] || "apply";
  try {
    if (cmd === "export") cmdExport();
    else if (cmd === "check") cmdCheck();
    else if (cmd === "apply") cmdApply();
    else throw new Error(`Comando desconocido «${cmd}». Usa apply, check o export.`);
  } catch (e) {
    if (e instanceof DocError) {
      console.error("❌ EDITAR_JUEGO.md tiene errores; no se cambió nada:\n" + e.message.split("\n").map(l => "   · " + l).join("\n"));
    } else {
      console.error("❌", e.message);
    }
    process.exit(1);
  }
}

module.exports = { exportDoc, parseDoc, renderContent };
