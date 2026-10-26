import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.20 · FASE 3 — il volume legge lo stato VIVO (state.programs) ---
// Alice: "glutei 9 invece di 14/12, e la Pendulum focus glutei non me la conta".
// Causa: VOLUME_HISTORY era una costante calcolata UNA VOLTA al boot dal letterale
// PROGRAM_LIBRARY (seed congelato): ogni modifica alle schede reali restava
// invisibile e vinceva sempre il fossile (dove ogni "Pendulum" è Quadricipiti).
// Qui la stessa sezione viene alimentata dalle schede reali, con risoluzione del
// gruppo dalla Master Library quando la scheda porta un segnaposto.

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
new vm.Script(vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart, { filename: "v14831.js" }).runInContext(context);

const esito = vm.runInContext(`(() => {
  const out = {};
  const lib = window.BarbellDivaMasterLibrary;
  // Master Library: Alice ha classificato la "Pendulum focus glutei" come Glutei.
  let store = lib.normalizeStore ? lib.normalizeStore({ records: [] }) : { records: [] };
  let rec = lib.normalizeRecord({ id: "mel-pendulum-glutei", identity: { name: "Pendulum focus glutei", category: "Glutei", aliases: ["Pendulum glutei"] }, provenance: { origin: "system" } });
  store = lib.upsert(store, rec);
  state.masterExerciseLibrary = store;
  out.resolveProbe = (lib.resolve(store, "Pendulum focus glutei") || {}).identity?.category ?? null;

  const ex = (name, muscle, sets) => ({ id: "ex-" + name + "-" + muscle, name, muscle, prescription: { sets, reps: "8" } });
  const sheet = (code, week, exercises) => ({ id: "sheet-" + code, code, letter: code, week, name: "Scheda " + code, exercises });
  const program = (id, phase, sheets) => ({ id, name: phase, phase, status: "available", sheets });

  state.programs = [
    program("p-live", "Test Live", [
      sheet("A", 1, [ex("Hip_Thrust", "Glutei", 3), ex("Pendulum focus glutei", "Glutei", 2)]),
      sheet("B", 2, [ex("Hip_Thrust", "Glutei", 4)])
    ]),
    program("p-segnaposto", "Test Segnaposto", [ sheet("A", 1, [ex("Pendulum focus glutei", "Da classificare", 3)]) ]),
    { id: "p-del", name: "Test Cancellato", phase: "Test Cancellato", status: "draft", sheets: [sheet("A", 1, [ex("Hip_Thrust", "Glutei", 99)])], deletedAt: "2026-01-01" },
    program("p-sheetdel", "Test SchedaCancellata", [ { id: "s-x", code: "A", letter: "A", week: 1, name: "X", exercises: [ex("Hip_Thrust", "Glutei", 88)], deletedAt: "2026-01-01" } ]),
    program("p-exdel", "Test EsCancellato", [ sheet("A", 1, [ex("Hip_Thrust", "Glutei", 77), { id: "ex-morto", name: "Morto", muscle: "Glutei", prescription: { sets: 66 }, deletedAt: "2026-01-01" }]) ])
  ];

  const blocks = volumeHistory();
  out.titoli = blocks.map((b) => b.title);
  const titleOf = (t) => blocks.find((b) => b.title === "Volume " + t);
  const rowOf = (t, m) => { const b = titleOf(t); return b ? (b.rows.find((r) => r.muscle === m) || null) : null; };
  const liveGlutei = rowOf("Test Live", "Glutei");
  out.liveGluteiTotale = liveGlutei ? liveGlutei.total : null;
  out.liveGluteiSettimane = liveGlutei ? liveGlutei.weeks : null;
  out.segnapostoGlutei = (rowOf("Test Segnaposto", "Glutei") || {}).total ?? null;
  out.cancellatoAssente = !titleOf("Test Cancellato");
  out.schedaCancellataAssente = !titleOf("Test SchedaCancellata");
  const exdel = rowOf("Test EsCancellato", "Glutei");
  out.esCancellatoEscluso = exdel ? exdel.total === 77 : false;

  // 1) i dati vivi hanno la precedenza sul seed
  out.vinceIlVivo = out.titoli.join("|") === "Volume Test Live|Volume Test Segnaposto|Volume Test EsCancellato";
  // 2) la Pendulum focus glutei conta nei Glutei (era il reclamo di Alice)
  out.pendulumContaNeiGlutei = out.liveGluteiTotale === 9;

  // 3) ripiego sul seed quando non c'è ancora un programma reale
  state.programs = [];
  const fallback = volumeHistory();
  const seed = volumeHistoryFromProgramLibrary(PROGRAM_LIBRARY);
  out.fallbackUgualeSeed = fallback.length === seed.length && fallback.length > 0;

  // 4) il render delle Statistiche legge gli stessi numeri
  state.programs = [ program("p-live", "Test Live", [ sheet("A", 1, [ex("Hip_Thrust", "Glutei", 3), ex("Pendulum focus glutei", "Glutei", 2)]) ]) ];
  const domanda = (fn) => { try { return fn() ? "ok" : "vuoto"; } catch (error) { return "errore: " + (error && error.message); } };
  out.renderStorico = domanda(() => /Test Live/.test(volumeHistoryHtml()));
  out.renderStatistiche = domanda(() => /Test Live/.test(statisticsVolumeHtml()));
  out.totalSerie = currentVolumeRows().reduce((sum, row) => sum + row.total, 0);
  return out;
})()`, context);

assert.equal(esito.resolveProbe, "Glutei", "la Master Library deve risolvere la Pendulum focus glutei come Glutei");
assert.equal(esito.vinceIlVivo, true, "il volume deve mostrare SOLO i blocchi dei programmi reali, non le fasi del seed");
assert.deepEqual(esito.liveGluteiSettimane, [5, 4], "due settimane di Glutei lette dalle schede");
assert.equal(esito.liveGluteiTotale, 9, "somma dei Glutei delle schede reali");
assert.equal(esito.pendulumContaNeiGlutei, true, "la Pendulum focus glutei deve contare nei Glutei");
assert.equal(esito.segnapostoGlutei, 3, "un gruppo segnaposto va risolto dalla Master Library (Da classificare -> Glutei)");
assert.equal(esito.cancellatoAssente, true, "un programma cancellato non deve entrare nel volume");
assert.equal(esito.schedaCancellataAssente, true, "una scheda cancellata non deve entrare nel volume");
assert.equal(esito.esCancellatoEscluso, true, "un esercizio cancellato non deve entrare nel volume");
assert.equal(esito.fallbackUgualeSeed, true, "senza programmi reali si ripiega sul seed, senza svuotare la sezione");
assert.equal(esito.renderStorico, "ok", "lo Storico volume deve renderizzare con i dati vivi");
assert.equal(esito.renderStatistiche, "ok", "le Statistiche (tab Volume) devono renderizzare con i dati vivi");
assert.equal(esito.totalSerie, 5, "il totale serie della scheda viva");

console.log("v148.20 volume dal vivo: OK", JSON.stringify({ titoli: esito.titoli, glutei: esito.liveGluteiTotale, settimane: esito.liveGluteiSettimane }));
