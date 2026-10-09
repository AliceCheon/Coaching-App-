import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.11 "AVVIO VERO": il primo render del telefono è già quello giusto ---
// Sintomo Alice: apro l'app → workout con le rip di luglio ("12+4+2") → dopo ~3
// minuti arriva la sync e "Arrivato nuovo allenamento" → finalmente quello giusto.
// Cioè: il CLOUD è giusto, ma il telefono disegna subito la COPIA LOCALE stantia
// (programma attivo semi-nato con patina diversa, non riparato perché l'id non
// combaciava col seed). La riparazione ora becca anche le copie con la STESSA
// FASE e origine dal seed ("imported"); i custom della coach restano intatti.

// 1. Riparazione per fase (solo programmi nati dal seed).
assert.match(mainJs, /const samePhaseImported = !!seedPhase && program\.phase === seedPhase && program\.source !== "custom";/);
assert.match(mainJs, /const sameSeed = program\.id === seeded\.id;/);

// 2. I numeri sul grafico a onde (valore sopra ogni punto, S1..Sn sotto).
assert.match(mainJs, /ctx\.fillText\(String\(value\), X\(w\), Y\(value\) - 9\);/);

// 3. Verifica VIVA in VM.
const vmLibs = await Promise.all(["exercise-library-19.8.js","master-exercise-library.js","app-config-v144.js","athlete-context.js","coach-ai-engine-2.js","knowledge-graph.js","decision-rules.js","decision-engine.js","coach-ai3-programming.js","coach-studio.js"].map((p) => fs.readFileSync(path.join(root, p), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const applicationScript = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + mainJs.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const storage = new Map();
const localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {} };
const document = { getElementById() { return element; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: element, documentElement: element, addEventListener() {} };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {}, location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null };
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(applicationScript, { filename: "v14811-avvio-vero.js" }).runInContext(context);

const out = vm.runInContext(`(() => {
  const esito = {};
  const seededAO = buildProgramsFromLegacy(PROGRAM_LIBRARY, []).map(consolidateLegacyWeeklyProgram).find((program) => program.phase === "Intensità Agosto-Ottobre");
  esito.seedEsiste = !!seededAO?.id;
  if (!esito.seedEsiste) return esito;
  const seedHip = (seededAO.sheets || []).flatMap((sheet) => sheet.exercises || []).find((exercise) => exercise.name === "Hip_Thrust");
  // il TELEFONO: programma attivo con patina diversa (id NON del seed), stessa fase,
  // origine dal seed, numeri di luglio
  const telefono = [{ id: "legacy-copia-luglio", phase: "Intensità Agosto-Ottobre", source: "imported", status: "active", active: true, nome: "Intensità Agosto-Ottobre", createdAt: "2026-07-01", sheets: [{ code: "C", name: "Scheda C", order: 0, exercises: [{ name: "Hip_Thrust", sets: "3", reps: "12+4+2", note: "vecchio" }] }] }];
  // un CUSTOM della coach con la stessa fase: NON deve essere toccato
  const custom = [{ id: "custom-coach", phase: "Intensità Agosto-Ottobre", source: "custom", status: "available", sheets: [{ code: "X1", name: "Mia scheda", order: 0, exercises: [{ name: "Mio esercizio", sets: "9", reps: "99" }] }] }];
  const lista = [...telefono, ...custom];
  const stamp = new Date().toISOString();
  esito.riparate = repairSeededProgramContent(lista, seededAO, stamp);
  const riparato = lista[0];
  const hip = (riparato.sheets || []).flatMap((sheet) => sheet.exercises || []).find((exercise) => exercise.name === "Hip_Thrust");
  esito.numeriLuglioSpariti = hip?.reps !== "12+4+2" && String(hip?.reps) === String(seedHip?.reps);
  esito.attivoPreso = riparato.status === "active" && riparato.active === true && riparato.createdAt === "2026-07-01";
  const intatto = lista[1];
  esito.customIntatto = intatto.sheets[0].exercises[0].reps === "99";
  return esito;
})()`, context);

assert.equal(out.seedEsiste, true, "il seed AO deve esistere");
assert.equal(out.riparate, true, "la copia-telefono con patina diversa deve essere riparata");
assert.equal(out.numeriLuglioSpariti, true, "le rip di luglio devono tornare al workbook");
assert.equal(out.attivoPreso, true, "status attivo, nome e creazione restano");
assert.equal(out.customIntatto, true, "il custom della coach NON viene toccato");

console.log(JSON.stringify({ ok: true, v: "v148.11", avvio: "vero al primo render" }));
