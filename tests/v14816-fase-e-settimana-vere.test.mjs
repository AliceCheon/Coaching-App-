import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.20 · il programma che Alice sta allenando torna ATTIVO ---
// Alice: "in automatico o 'Intensificazione' o 'B program 1' a caso, e settimana 8 invece
// di 7: devo mettere sempre il manuale". Causa: dopo i "torna a bozza" non resta quasi mai
// un programma marcato attivo, quindi la fase in automatico ripiegava sull'ultima scelta
// MANUALE e le schede venivano da un programma che non stava allenando.
// Cura dal lato del DATO (la catena di derivazione resta quella sorvegliata dai test):
// l'ultimo allenamento dice qual è il programma vero e quel programma torna "attivo".

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
new vm.Script(vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart, { filename: "v14820.js" }).runInContext(context);

const esito = vm.runInContext(`(() => {
  const out = {};
  const scheda = (code) => ({ id: "sheet-" + code, code, letter: code, order: code.charCodeAt(0) - 64, name: "Scheda " + code, exercises: [{ id: "ex-" + code, name: "Hip_Thrust", prescription: { sets: 3, reps: "8" } }] });
  const programma = (id, phase, updatedAt) => ({ id, name: phase, phase, status: "available", updatedAt, sheets: [scheda("A"), scheda("B")] });

  // Nessun programma "attivo" (i "torna a bozza"), fossile manuale su "B program 1",
  // e l'ULTIMO ALLENAMENTO è su "Intensità Agosto-Ottobre": è quello il programma vero.
  state.programs = [programma("p-b1", "B program 1", "2026-07-01T00:00:00.000Z"), programma("p-int", "Intensità Agosto-Ottobre", "2026-09-01T00:00:00.000Z")];
  state.profile.phaseStart = "2026-09-01"; state.profile.phaseLength = 12;
  state.training.contextMode = "auto"; state.training.sessionName = "auto"; state.training.date = todayInput();
  state.training.phaseFilter = "B program 1"; state.training.manualPhase = "B program 1";
  state.training.sessions = [{ id: 1700000000001, source: "App", status: "completed", phase: "Intensità Agosto-Ottobre", dateInput: "2026-10-10", sessionCode: "B", week: 7, exercises: [] }];

  out.primaFase = effectiveTrainingPhase();
  out.riparato = ensureActiveProgramFromLastWorkout();
  out.faseDopo = effectiveTrainingPhase();
  out.phaseFilterDopo = state.training.phaseFilter;
  out.attivo = (state.programs.find((row) => String(row.status) === "active") || {}).phase || null;
  const contesto = currentTrainingContext();
  out.scheda = contesto.session ? contesto.session.code : null;
  out.esercizi = contesto.session ? (contesto.session.exercises || []).length : 0;
  out.settimana = contesto.week;
  // idempotente: la seconda volta non cambia più nulla
  out.secondaVolta = ensureActiveProgramFromLastWorkout();
  // in MANUALE non si tocca niente e la scelta di Alice resta sovrana
  state.training.contextMode = "manual"; state.training.manualModeDate = state.training.date; state.training.manualPhase = "Intensificazione";
  out.manualeNonTocca = ensureActiveProgramFromLastWorkout();
  out.manualeVince = effectiveTrainingPhase() === "Intensificazione";
  return out;
})()`, context);

assert.equal(esito.primaFase, "B program 1", "precondizione: senza riparazione la fase è il fossile manuale");
assert.equal(esito.riparato, true, "il programma dell'ultimo allenamento deve tornare attivo");
assert.equal(esito.attivo, "Intensità Agosto-Ottobre", "deve essere attivo il programma allenato, non il fossile");
assert.equal(esito.faseDopo, "Intensità Agosto-Ottobre", "in automatico la fase è quella del programma vero");
assert.equal(esito.phaseFilterDopo, "Intensità Agosto-Ottobre", "anche il ripiego phaseFilter si riallinea");
assert.ok(esito.scheda, "il contesto deve risolvere una scheda");
assert.ok(esito.esercizi >= 1, "la scheda risolta deve portare esercizi");
assert.ok(Number.isFinite(esito.settimana) && esito.settimana >= 1 && esito.settimana <= 12, "settimana sensata (era: " + esito.settimana + ")");
assert.equal(esito.secondaVolta, false, "la riparazione è idempotente");
assert.equal(esito.manualeNonTocca, false, "in manuale non si tocca il programma attivo");
assert.equal(esito.manualeVince, true, "in manuale la scelta di Alice resta sovrana");

// guardie statiche
assert.match(mainJs, /function ensureActiveProgramFromLastWorkout\(\)/);
assert.match(mainJs, /function latestSessionPhase\(\)/);
assert.match(mainJs, /try \{ ensureActiveProgramFromLastWorkout\(\); \} catch \(error\) \{\} \/\/ v148\.18/);
assert.match(mainJs, /: \(activePhase \|\| state\.training\?\.phaseFilter \|\| "Intensificazione"\)/);

console.log(JSON.stringify({ ok: true, v: "v148.20", prima: esito.primaFase, dopo: esito.faseDopo, attivo: esito.attivo, settimana: esito.settimana }));
