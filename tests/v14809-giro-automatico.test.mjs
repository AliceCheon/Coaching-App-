import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.10: il giro Automatica→Manuale→Automatica avviene DA SOLO ---
// La modalità manuale è un override di giorno: cambiando giorno l'app torna
// automaticamente su Automatica (con la scelta manuale ripulita), così la fase
// riparte sempre dal programma attivo — senza che Alice riswitchi a mano.

// 1. Guardie statiche: normalizzatore, scrittura della data al passaggio in
//    manuale, chiamata nel contesto e al boot.
assert.match(mainJs, /function normalizeManualContextForDate\(\)/);
assert.match(mainJs, /if \(state\.training\?\.contextMode !== "manual"\) return false;/);
assert.match(mainJs, /state\.training\.manualModeDate = input\.value === "manual" \? \(state\.training\.date \|\| todayInput\(\)\) : "";/);
assert.match(mainJs, /normalizeManualContextForDate\(\);\s*\n\s*const date = state\.training\.date \|\| todayInput\(\);/);
assert.match(mainJs, /try \{ normalizeManualContextForDate\(\); \} catch \(error\) \{\} \/\/ v148\.09/);

// 2. Verifica VIVA: l'app montata in VM, il caso reale del telefono.
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
new vm.Script(applicationScript, { filename: "v14810-giro-automatico.js" }).runInContext(context);

const out = vm.runInContext(`(() => {
  const esito = {};
  const oggi = todayInput();
  const parti = oggi.split("-").map(Number);
  const ieri = (() => { const d = new Date(parti[0], parti[1] - 1, parti[2]); d.setDate(d.getDate() - 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
  const snapshot = {
    profile: { name: "Alice", theme: "dark" },
    training: { contextMode: "manual", manualModeDate: ieri, manualPhase: "Intensificazione", manualSessionCode: "Z9", manualWeek: 3, date: ieri, phaseFilter: "Intensificazione" },
    programs: [{ id: "int-ao", phase: "Intensità Agosto-Ottobre", status: "active", name: "Intensità Agosto-Ottobre", sheets: [{ code: "C", name: "Scheda C", order: 0, exercises: [{ name: "Hip_Thrust", sets: "3", reps: "8 - X - X" }] }] }],
    meta: { schemaVersion: DATA_SCHEMA_VERSION, updatedAt: new Date().toISOString() }
  };
  state = migrateStateSchema(JSON.parse(JSON.stringify(snapshot)));
  // l'avvio avanza la data a oggi (come fa l'app al boot)…
  state.training.date = todayInput();
  // …e Alice non tocca NIENTE: il giro di ritorno avviene da solo
  const ctx = currentTrainingContext();
  esito.tornaAutoDaSolo = state.training.contextMode === "auto";
  esito.faseDalProgrammaAttivo = ctx.phase === "Intensità Agosto-Ottobre";
  esito.manualePulito = !state.training.manualPhase && !state.training.manualSessionCode && !state.training.manualWeek && !state.training.manualModeDate;
  esito.sessioneETimanaGiuste = !!ctx.session && ctx.week > 0;
  // invece OGGI la scelta manuale resta (override del giorno)
  state.training.contextMode = "manual";
  state.training.manualModeDate = oggi;
  state.training.manualPhase = "Intensificazione";
  state.training.manualSessionCode = "C";
  const ctxOggi = currentTrainingContext();
  esito.manualeDiOggiResta = state.training.contextMode === "manual" && ctxOggi.phase === "Intensificazione";
  return esito;
})()`, context);

assert.equal(out.tornaAutoDaSolo, true, "il manuale scaduto deve tornare automatico da solo");
assert.equal(out.faseDalProgrammaAttivo, true, "la fase deve ripartire dal programma attivo");
assert.equal(out.manualePulito, true, "la scelta manuale di ieri va ripulita");
assert.equal(out.sessioneETimanaGiuste, true, "sessione e settimana dal programma attivo");
assert.equal(out.manualeDiOggiResta, true, "il manuale di OGGI resta (override del giorno)");

console.log(JSON.stringify({ ok: true, v: "v148.10", giro: "Automatica→Manuale→Automatica automatico" }));
