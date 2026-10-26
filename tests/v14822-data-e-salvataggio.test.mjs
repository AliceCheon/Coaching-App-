import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const flowJs = fs.readFileSync(path.join(root, "workout-flow-v147.js"), "utf8");

// --- v148.22 · LA DATA DEL GIORNO E LA CHIAVE DEL SALVATAGGIO ---
// Alice: "ho registrato il workout D il 24 ottobre ma nel Logbook esce al 22,
// prima del workout C" e "arrivo alla fine, clicco termina e mi dice 'inserisci
// almeno una nota o un carico' come se non avessi scritto nulla".
//
// Due cause, una radice sola: `state.training.date` veniva scritta a "oggi" SOLO
// al boot (la PWA non si riavvia in standby → resta al giorno di apertura), e il
// salvataggio rileggeva le bozze con `currentTrainingContext()` mentre la
// schermata le scriveva con il contesto APPUNTATO al workout. Cambiando data (o
// scheda) le due chiavi `data|scheda|esercizio` non coincidevano più: il workout
// nasceva con la data vecchia e, alla fine, il salvataggio guardava in una
// cartella vuota. Questo test fallisce sulla v148.21.

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
new vm.Script(vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart, { filename: "v14828.js" }).runInContext(context);

const esito = vm.runInContext(`(() => {
  const out = {};
  // "Oggi" è il 24 ottobre 2026, l'app è viva dal 22.
  todayInput = () => "2026-10-24";

  // 1) app rimasta aperta dal 22, nessun workout in corso -> si riallinea a oggi
  state.training.date = "2026-10-22";
  state.training.todayStamp = "2026-10-22";
  state.training.activeWorkout = null;
  out.movedToToday = refreshTrainingDateOnDayChange() === true && state.training.date === "2026-10-24";

  // 2) seconda chiamata dello stesso giorno: nessun movimento, nessun render in più
  out.idempotent = refreshTrainingDateOnDayChange() === false && state.training.date === "2026-10-24";

  // 3) data scelta A MANO per una seduta arretrata: non va sovrascritta
  state.training.date = "2026-10-10";
  state.training.todayStamp = "2026-10-24";
  out.manualKept = refreshTrainingDateOnDayChange() === false && state.training.date === "2026-10-10";

  // 4) workout in corso: la data appuntata non si tocca a metà allenamento
  state.training.date = "2026-10-22";
  state.training.todayStamp = "2026-10-22";
  state.training.activeWorkout = { id: "w1", status: "active", date: "2026-10-22", sessionCode: "D", logs: {} };
  out.activeUntouched = refreshTrainingDateOnDayChange() === false && state.training.date === "2026-10-22";

  // 5) la chiave del salvataggio: kg e note scritti nel WORKOUT vengono letti
  //    anche se il contesto ricalcolato punta a un'altra data/scheda.
  const ex = { id: "ex-d", name: "Leg curl", prescription: { sets: 3, reps: "8" } };
  state.training.activeWorkout = {
    id: "w2", status: "active", date: "2026-10-22", sessionCode: "D",
    logs: { "0:leg curl": { kg: ["40", "42", "40"], reps: ["8", "8", "7"], rpe: ["", "", ""], rir: ["", "", ""], note: "spalle ok, buone sensazioni" } }
  };
  state.training.draft = {};
  state.training.noteDraft = {};
  const pinned = { date: "2026-10-22", phase: "Intensita", week: 3, session: { id: "sheet-d", code: "D", name: "Scheda D", exercises: [ex] } };
  const moved = { date: "2026-10-24", phase: "Intensita", week: 3, session: { id: "sheet-c", code: "C", name: "Scheda C", exercises: [ex] } };
  out.valuesFromWorkout = JSON.stringify(workoutSetValuesForSave(pinned, ex)) === JSON.stringify(["40", "42", "40"]);
  out.noteFromWorkout = workoutNoteForSave(pinned, ex) === "spalle ok, buone sensazioni";
  // Prove del bug vecchio: con la chiave sbagliata non si leggeva nulla.
  out.oldKeyWasEmpty = draftSetsFor(moved, ex).every((value) => !value);
  out.valuesSurviveContextShift = JSON.stringify(workoutSetValuesForSave(moved, ex)) === JSON.stringify(["40", "42", "40"]);
  return out;
})()`, context);

assert.equal(esito.movedToToday, true, "la data deve riallinearsi a oggi quando l'app resta aperta da giorni");
assert.equal(esito.idempotent, true, "richiamata nello stesso giorno non deve cambiare nulla");
assert.equal(esito.manualKept, true, "una data scelta a mano non deve essere sovrascritta");
assert.equal(esito.activeUntouched, true, "durante un workout in corso la data appuntata non si tocca");
assert.equal(esito.valuesFromWorkout, true, "kg/serie devono essere letti dal workout in corso");
assert.equal(esito.noteFromWorkout, true, "la nota scritta deve essere letta dal workout in corso");
assert.equal(esito.oldKeyWasEmpty, true, "il contesto ricalcolato con altra data/scheda non vede le bozze (radice del bug)");
assert.equal(esito.valuesSurviveContextShift, true, "il salvataggio non deve dipendere dal contesto ricalcolato");

// Il flusso allenamento deve passare il PROPRIO contesto appuntato al salvataggio.
assert.ok(/saveWorkoutSession\(context\)/.test(flowJs), "workout-flow: il salvataggio deve usare il contesto appuntato");
assert.ok(/saveWorkoutSession\(overrideContext = null\)/.test(mainJs), "app-main: saveWorkoutSession deve accettare il contesto del workout");
assert.ok(/overrideContext \|\| currentTrainingContext\(\)/.test(mainJs), "app-main: fallback al contesto corrente quando manca l'override");
assert.ok(/currentLog\.note = event\.target\.value/.test(flowJs), "workout-flow: la nota deve viaggiare dentro il workout in corso");
// La coda non deve lasciare operazioni orfane in "syncing".
assert.ok(/row\.status === "syncing"/.test(mainJs), "app-main: le operazioni rimaste in syncing vanno riprese");

console.log(JSON.stringify({ ok: true, ...esito }));
