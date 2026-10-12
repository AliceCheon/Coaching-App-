import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const flowJs = fs.readFileSync(path.join(root, "workout-flow-v147.js"), "utf8");

// --- v148.16: il workout in corso non deve più dipendere dal localStorage PIENO ---
// Alice: "metto il telefono in standby, riapro l'app dopo qualche minuto e il workout
// che stavo facendo è sparito: mi tocca riscrivere serie e note". Causa: lo stato
// serializzato supera la quota di localStorage (~5 MB per origine), quindi la copia
// locale non si aggiornava più; in allenamento l'app scrive SOLO in locale
// (cloud:false), così una scheda scartata in standby perdeva tutto.
// Guardie: copia durabile in IndexedDB + ripristino condiviso + merge che non
// riscrive serie/note di un workout aperto.

const vmLibs = await Promise.all([
  "exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js",
  "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js",
  "coach-ai3-programming.js", "coach-studio.js", "plate-calculator.js"
].map((p) => fs.readFileSync(path.join(root, p), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const bootPart = mainJs.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart + "\n;\n" + flowJs;

// localStorage del telefono: quando la quota è piena rifiuta TUTTO (QuotaExceededError)
let quotaAttiva = true;
let quotaErrors = 0;
const storage = new Map();
const quotaError = () => { const error = new Error("QuotaExceededError"); error.name = "QuotaExceededError"; error.code = 22; return error; };
const localStorageFake = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => { if (quotaAttiva) { quotaErrors += 1; throw quotaError(); } storage.set(key, String(value)); },
  removeItem: (key) => storage.delete(key),
  key: (i) => Array.from(storage.keys())[i],
  get length() { return storage.size; }
};

// IndexedDB finto, condiviso fra "telefono" e "riapertura" (come nel browser)
function makeIndexedDb() {
  const stores = new Map();
  const db = {
    objectStoreNames: { contains: (name) => stores.has(name) },
    createObjectStore(name) { if (!stores.has(name)) stores.set(name, new Map()); return {}; },
    close() {},
    transaction(name) {
      if (!stores.has(name)) throw new Error("store assente: " + name);
      const store = stores.get(name);
      const tx = { error: null, oncomplete: null, onerror: null, onabort: null };
      const done = () => queueMicrotask(() => { if (typeof tx.oncomplete === "function") tx.oncomplete(); });
      const ok = (value) => { const request = { result: value, error: null }; queueMicrotask(() => { if (typeof request.onsuccess === "function") request.onsuccess(); }); return request; };
      tx.objectStore = () => ({
        put(row) { store.set(row.journalId, row); done(); return ok(undefined); },
        get(key) { return ok(store.get(key)); },
        getAll() { return ok(Array.from(store.values())); },
        delete(key) { store.delete(key); done(); return ok(undefined); }
      });
      return tx;
    }
  };
  return { stores, open() { const request = { result: db, error: null }; queueMicrotask(() => { if (typeof request.onupgradeneeded === "function") request.onupgradeneeded(); if (typeof request.onsuccess === "function") request.onsuccess(); }); return request; } };
}
const indexedDbFake = makeIndexedDb();

const drawing = new Proxy({}, { get(t, k) { if (k === "measureText") return () => ({ width: 10 }); return () => {}; }, set() { return true; } });
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, replaceChildren() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, getBoundingClientRect() { return { width: 320, height: 180 }; }, getContext() { return drawing; }, innerHTML: "", textContent: "", scrollTop: 0, scrollLeft: 0, width: 320, height: 180, value: "", checked: false, hidden: false };
const documentFake = { getElementById() { return { ...element }; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {}, hidden: false, visibilityState: "visible" };

function boot(label) {
  const context = {
    console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, queueMicrotask,
    localStorage: localStorageFake, sessionStorage: localStorageFake, document: documentFake, indexedDB: indexedDbFake,
    navigator: { onLine: false, userAgent: "node" }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} },
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {},
    caches: { open: async () => ({ put: async () => {}, match: async () => undefined }) }, Response: class { constructor(b) { this._body = String(b); } json() { return JSON.parse(this._body); } },
    setTimeout(fn, ms) { return globalThis.setTimeout(fn, Math.min(Number(ms) || 0, 10)); }, clearTimeout(id) { globalThis.clearTimeout(id); },
    requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; }, addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: true }; },
    window: null, globalThis: null
  };
  context.window = context; context.globalThis = context;
  vm.createContext(context);
  new vm.Script(script, { filename: label }).runInContext(context);
  return context;
}

// --- 1. VERIFICA VIVA: telefono con quota piena -> riapertura -----------------
const telefono = boot("telefono");
const avvio = await vm.runInContext(`(async () => {
  const c = currentTrainingContext();
  const esercizio = (c.session.exercises || [])[0];
  state.training.activeWorkout = {
    version: "148.12", id: "workout-VIVE", status: "active", date: c.date, phase: c.phase, week: c.week,
    sessionCode: c.session.code, currentExercise: 0, currentSet: 1, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    logs: { ["0:" + normalizeExerciseName(esercizio.name)]: { kg: ["60", "65"], reps: ["8", "8"], rpe: ["8", ""], rir: ["2", ""] } }
  };
  state.training.draft = { [draftKey(c, esercizio)]: ["60", "65"] };
  state.training.setDone = { [setDoneKey(c, esercizio, 0)]: true };
  state.training.noteDraft = { [draftNoteKey(c, esercizio)]: "glutei in spinta, fermo 1s" };
  saveState({ cloud: false, immediate: true });
  await new Promise((resolve) => setTimeout(resolve, 40));
  const record = await readActiveWorkoutDurable();
  return { istantaneaDurabile: !!record, serie: JSON.stringify(record && record.sets ? record.sets.draft : {}), fase: c.phase, scheda: c.session.code };
})()`, telefono);
assert.equal(avvio.istantaneaDurabile, true, "con localStorage pieno l'istantanea del workout deve finire in IndexedDB");
assert.ok(avvio.serie.includes("60") && avvio.serie.includes("65"), "l'istantanea durabile deve portare le serie scritte");
assert.ok(quotaErrors > 0, "il test deve simulare davvero un localStorage pieno (QuotaExceededError)");

const riapertura = boot("riapertura");
const esito = await vm.runInContext(`(async () => {
  await new Promise((resolve) => setTimeout(resolve, 40));
  const t = state.training || {};
  const active = t.activeWorkout || null;
  let visibile = null;
  try { const html = String(trainingHtml() || ""); visibile = { inCorso: /v147-active/.test(html), preWorkout: /data-v147-start/.test(html), fase: currentTrainingContext().phase }; } catch (error) { visibile = "errore: " + error.message; }
  return { workout: active ? { id: active.id, status: active.status } : null, serie: JSON.stringify(t.draft || {}), note: JSON.stringify(t.noteDraft || {}), serieConfermate: JSON.stringify(t.setDone || {}), visibile };
})()`, riapertura);
assert.ok(esito.workout, "riapertura con localStorage pieno: il workout in corso deve tornare");
assert.equal(esito.workout.id, "workout-VIVE");
assert.ok(esito.serie.includes("60") && esito.serie.includes("65"), "le serie scritte devono tornare");
assert.ok(esito.note.includes("glutei in spinta"), "le note scritte devono tornare");
assert.ok(esito.serieConfermate.includes("true"), "le serie confermate devono tornare");
assert.equal(esito.visibile.inCorso, true, "il tab Workout deve riaprire il workout in corso");
assert.equal(esito.visibile.preWorkout, false, "non deve mostrare 'Inizia allenamento'");

// --- 2. Un cloud più vecchio non riscrive serie/note del workout aperto -------
// (quotaAttiva off: qui guardo la logica del merge, non la quota di localStorage)
quotaAttiva = false;
const mergeVM = boot("merge");
const merge = vm.runInContext(`(() => {
  const c = currentTrainingContext();
  const esercizio = (c.session.exercises || [])[0];
  const chiave = draftKey(c, esercizio);
  const base = { meta: { updatedAt: "2026-10-12T07:00:00.000Z" }, profile: {}, programs: [] };
  const locale = { ...base, training: { date: c.date, draft: { [chiave]: ["60", "65"] }, setDone: {}, noteDraft: { [chiave + "|note"]: "glutei in spinta" },
    activeWorkout: { id: "workout-VIVE", status: "active", date: c.date, sessionCode: c.session.code, updatedAt: "2026-10-12T07:00:00.000Z" } } };
  const cloud = { meta: { updatedAt: "2026-10-12T09:00:00.000Z" }, profile: {}, programs: [], training: { date: c.date, draft: { [chiave]: ["40", "40"] }, setDone: {}, noteDraft: { [chiave + "|note"]: "nota vecchia" }, activeWorkout: null } };
  const merged = mergeCloudAndLocalState(JSON.parse(JSON.stringify(locale)), JSON.parse(JSON.stringify(cloud)));
  return { serie: JSON.stringify(merged.training.draft), note: JSON.stringify(merged.training.noteDraft), workout: merged.training.activeWorkout ? merged.training.activeWorkout.id : null };
})()`, mergeVM);
assert.ok(merge.serie.includes("60"), "il cloud non deve riportare serie vecchie su un workout aperto");
assert.ok(merge.note.includes("glutei in spinta"), "il cloud non deve riportare note vecchie su un workout aperto");
assert.equal(merge.workout, "workout-VIVE", "il workout in corso resta quello locale");

// --- 3. Un'istantanea parziale non cancella la rete di sicurezza --------------
quotaAttiva = false;
const reteVM = boot("rete-sicurezza");
const rete = vm.runInContext(`(() => {
  const chiave = WORKOUT_ACTIVE_RESCUE_KEY;
  state.training.activeWorkout = { id: "workout-VIVE", status: "active", date: new Date().toISOString().slice(0, 10), sessionCode: "F", updatedAt: new Date().toISOString() };
  state.training.draft = { prova: ["60"] };
  persistActiveWorkoutRescue(state);
  const scritta = !!localStorage.getItem(chiave);
  persistActiveWorkoutRescue({ training: { sessions: [] } });
  const sopravvive = !!localStorage.getItem(chiave);
  state.training.activeWorkout = null;
  persistActiveWorkoutRescue(state);
  const cancellaSuChiusura = !localStorage.getItem(chiave);
  return { scritta, sopravvive, cancellaSuChiusura };
})()`, reteVM);
assert.equal(rete.scritta, true, "la rete di sicurezza deve salvare il workout in corso");
assert.equal(rete.sopravvive, true, "un'istantanea senza il campo non deve cancellare la rete di sicurezza");
assert.equal(rete.cancellaSuChiusura, true, "un workout chiuso esplicitamente sì");

// --- 4. Guardie statiche (la correzione deve restare nel codice) -------------
assert.match(mainJs, /const WORKOUT_ACTIVE_STORE = "activeWorkout"/);
assert.match(mainJs, /indexedDB\.open\(WORKOUT_DB_NAME, [23]\)/); // v148.16: il DB sale a v3
assert.match(mainJs, /async function persistActiveWorkoutDurable\(snapshot = state\)/);
assert.match(mainJs, /async function readActiveWorkoutDurable\(\)/);
assert.match(mainJs, /async function restoreActiveWorkoutDurable\(targetState = state\)/);
assert.match(mainJs, /function applyActiveWorkoutSnapshot\(targetState, resume, sets = \{\}\)/);
assert.match(mainJs, /restoreActiveWorkoutDurable\(state\)\.then\(\(restored\) => \{ if \(restored\) render\(\); \}\)/);
assert.match(mainJs, /try \{ persistActiveWorkoutDurable\(snapshot\); \} catch \(error\) \{\}\s*\n\s*localStorage\.setItem\(WORKOUT_ACTIVE_RESCUE_KEY/);
assert.match(mainJs, /const explicitClose = Object\.prototype\.hasOwnProperty\.call\(snapshot\.training, "activeWorkout"\);/);
assert.match(mainJs, /const openSessionPrefix = `\$\{localActiveWorkout\.date \|\| ""\}\|\$\{localActiveWorkout\.sessionCode \|\| ""\}\|`;/);

console.log(JSON.stringify({
  ok: true, v: "v148.16",
  istantaneaDurabile: avvio.istantaneaDurabile,
  workoutRecuperato: esito.workout && esito.workout.id,
  serieRecuperate: esito.serie,
  noteRecuperate: esito.note,
  cloudNonRiscrive: merge.serie + " / " + merge.note
}));
