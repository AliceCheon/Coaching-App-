import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.17 · in AUTOMATICO fase e settimana vengono dal PROGRAMMA, non da un fossile ---
// Alice: "in automatico non mi dà mai la seduta giusta: o Intensificazione o B program 1 a
// caso, e mi segna settimana 8 invece della 7; per questo devo mettere sempre il manuale".
// Causa: `effectiveTrainingPhase()` in automatico ripiegava su `state.training.phaseFilter`,
// scritto SOLO dal selettore manuale, e `currentTrainingContext()` risolveva le schede solo
// dal programma ESPLICITAMENTE attivo: senza, `programSheets` restava vuoto e la settimana
// cadeva sulla fase sbagliata.

const vmLibs = await Promise.all([
  "exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js",
  "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js",
  "coach-ai3-programming.js", "coach-studio.js", "plate-calculator.js"
].map((p) => fs.readFileSync(path.join(root, p), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const bootPart = mainJs.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const storage = new Map();
const ls = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k), key: (i) => Array.from(storage.keys())[i], get length() { return storage.size; } };
const drawing = new Proxy({}, { get(t, k) { if (k === "measureText") return () => ({ width: 10 }); return () => {}; }, set() { return true; } });
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, replaceChildren() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, getBoundingClientRect() { return { width: 320, height: 180 }; }, getContext() { return drawing; }, innerHTML: "", textContent: "", value: "", checked: false, hidden: false };
const documentFake = { getElementById() { return { ...element }; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {}, hidden: false, visibilityState: "visible" };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent,
  localStorage: ls, sessionStorage: ls, document: documentFake, navigator: { onLine: false }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} },
  URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, caches: { open: async () => ({ put: async () => {}, match: async () => undefined }) },
  setTimeout(fn, ms) { return globalThis.setTimeout(fn, Math.min(Number(ms) || 0, 10)); }, clearTimeout(id) { globalThis.clearTimeout(id); }, requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; },
  addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: true }; }, window: null, globalThis: null };
context.window = context; context.globalThis = context;
vm.createContext(context);
new vm.Script(vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart, { filename: "v14817.js" }).runInContext(context);

const esito = vm.runInContext(`(() => {
  const out = {};
  const scheda = (code, nome) => ({ id: "sheet-" + code, code, letter: code, order: code.charCodeAt(0) - 64, name: nome, exercises: [{ id: "ex-" + code, name: "Hip_Thrust", prescription: { sets: 3, reps: "8" } }] });
  const programma = (id, phase, updatedAt, extra = {}) => ({ id, name: phase, phase, status: "available", updatedAt, sheets: [scheda("A", "Scheda A"), scheda("B", "Scheda B")], ...extra });

  // Nessun programma marcato "attivo" (la storia dei "torna a bozza"): il fossile manuale
  // phaseFilter punta al programma SBAGLIATO e più vecchio.
  state.programs = [
    programma("p-b1", "B program 1", "2026-07-01T00:00:00.000Z"),
    programma("p-int", "Intensità Agosto-Ottobre", "2026-10-09T00:00:00.000Z")
  ];
  state.training.contextMode = "auto";
  state.training.sessionName = "auto";
  state.training.date = todayInput();
  state.training.phaseFilter = "B program 1";   // FOSSILE: ultima scelta manuale
  state.training.manualPhase = "B program 1";

  out.faseEfficace = effectiveTrainingPhase();
  const contesto = currentTrainingContext();
  out.faseContesto = contesto.phase;
  out.scheda = contesto.session ? contesto.session.code : null;
  out.esercizi = contesto.session ? (contesto.session.exercises || []).length : 0;
  out.settimana = contesto.week;
  out.faseScelta = contesto.phase === "Intensità Agosto-Ottobre" && !!contesto.session;

  // Un programma marcato ATTIVO vince su tutto (automatico)
  state.programs = state.programs.map((programma) => programma.id === "p-b1" ? { ...programma, status: "active", active: true } : programma);
  out.programmaAttivoVince = effectiveTrainingPhase() === "B program 1";

  // MANUALE: la scelta di Alice resta sovrana
  state.training.contextMode = "manual";
  state.training.manualModeDate = state.training.date;
  state.training.manualPhase = "Intensificazione";
  out.manualeVince = effectiveTrainingPhase() === "Intensificazione";
  return out;
})()`, context);

assert.equal(esito.faseEfficace, "Intensità Agosto-Ottobre", "in automatico la fase deve venire dal programma, non dal fossile phaseFilter");
assert.equal(esito.faseContesto, "Intensità Agosto-Ottobre", "il contesto deve usare la stessa fase");
assert.ok(esito.scheda, "in automatico deve esserci una scheda (prima restava senza: programSheets vuoto)");
assert.ok(esito.esercizi >= 1, "la scheda risolta deve portare i suoi esercizi");
assert.ok(esito.settimana > 0 && esito.settimana <= 12, "la settimana deve essere un numero sensato");
assert.equal(esito.faseScelta, true, "fase e scheda devono essere coerenti col programma giusto");
assert.equal(esito.programmaAttivoVince, true, "un programma marcato attivo deve vincere sulla recenza");
assert.equal(esito.manualeVince, true, "in manuale la scelta di Alice resta sovrana");

// guardie statiche
assert.match(mainJs, /const phasedProgram = activeProgram \|\| activeTrainingProgram\(\);/);
assert.match(mainJs, /: \(phasedActivePhase \|\| activePhase \|\| "Intensificazione"\)/);
assert.match(mainJs, /const activeProgram = explicitActiveTrainingProgram\(\);/); // v148.17: bacino schede invariato
assert.doesNotMatch(mainJs, /: \(activePhase \|\| state\.training\?\.phaseFilter \|\| "Intensificazione"\)/);

console.log(JSON.stringify({ ok: true, v: "v148.17", faseEfficace: esito.faseEfficace, scheda: esito.scheda, settimana: esito.settimana, manualeVince: esito.manualeVince }));
