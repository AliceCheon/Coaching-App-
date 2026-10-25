import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.20 · FASE 4 — la matitina del gruppo muscolare salva DAVVERO ---
// Alice: "la matitina dell'esercizio (gruppo principale/secondario) non salva nulla".
// Tre cause reali, tutte coperte qui con le funzioni PURE che le governano:
//  (1) il salvataggio prendeva la scheda da coachProgramUi.sheetId, che può puntare
//      a un'ALTRA scheda: l'esercizio non veniva trovato, updateExercise rispondeva
//      "non trovato" e il salvataggio svaniva. Ora la scheda si risolve per CONTENUTO.
//  (2) il "Gruppo principale" era deciso da normalizeMuscleCategory(): un gruppo
//      fuori elenco non veniva mai selezionato e il browser ripiegava sulla prima
//      voce, cancellando la scelta di Alice.
//  (3) il render risolveva l'esercizio con la scheda "selezionata": con lo sheetId
//      sbagliato la finestra si apriva vuota.

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
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, replaceChildren() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, removeAttribute() {}, getBoundingClientRect() { return { width: 320, height: 180 }; }, getContext() { return drawing; }, focus() {}, innerHTML: "", textContent: "", checked: false, hidden: false, disabled: false };
const formValues = Object.create(null);
const formNodes = new Map();
const makeNode = (id) => {
  const node = { ...element, id };
  Object.defineProperty(node, "value", { get() { return formValues[id] ?? ""; }, set(v) { formValues[id] = v; }, configurable: true });
  Object.defineProperty(node, "checked", { get() { return formValues[id + "#c"] === true; }, set(v) { formValues[id + "#c"] = v; }, configurable: true });
  formNodes.set(id, node);
  return node;
};
const documentFake = { getElementById(id) { return formNodes.get(id) || makeNode(id); }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {}, hidden: false, visibilityState: "visible" };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent,
  localStorage: ls, sessionStorage: ls, document: documentFake, navigator: { onLine: false }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} },
  URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, caches: { open: async () => ({ put: async () => {}, match: async () => undefined }) },
  setTimeout(fn, ms) { return globalThis.setTimeout(fn, Math.min(Number(ms) || 0, 10)); }, clearTimeout(id) { globalThis.clearTimeout(id); }, requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; },
  addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: true }; }, window: null, globalThis: null };
context.window = context; context.globalThis = context;
context.__setForm = (id, v) => { formValues[id] = v; };
vm.createContext(context);
new vm.Script(vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart, { filename: "v14827.js" }).runInContext(context);

const selectedOf = (html) => (String(html).match(/<option selected>([^<]*)<\/option>/) || [])[1] || null;

const esito = vm.runInContext(`(() => {
  const out = {};
  const selectedOf = (html) => (String(html).match(/<option selected>([^<]*)<\\/option>/) || [])[1] || null;
  out.reach = { programRepository: typeof programRepository, coachProgramUi: typeof coachProgramUi, saveCoachUiModal: typeof saveCoachUiModal, sheetContainingExercise: typeof sheetContainingExercise, findCoachExerciseById: typeof findCoachExerciseById, coachExerciseGroupOptions: typeof coachExerciseGroupOptions, state: typeof state };
  const ex = (id, name, muscle, sets) => ({ id, name, muscle, som: muscle, prescription: { sets, reps: "8" }, metadata: {} });
  const sheet = (id, code, exercises) => ({ id, code, letter: code, week: 1, name: "Scheda " + code, exercises });
  state.programs = [
    { id: "p1", name: "Fase Test", phase: "Fase Test", status: "active", durationWeeks: 8, sheets: [
      sheet("sheet-A", "A", [ ex("ex-A", "Hip_Thrust", "Glutei", 3) ]),
      sheet("sheet-B", "B", [ ex("ex-B", "Pendulum focus glutei", "Da classificare", 3) ])
    ] }
  ];
  const readB = () => { const p = state.programs.find((x) => x.id === "p1"); const s = p.sheets.find((x) => x.id === "sheet-B"); const e = s.exercises.find((x) => x.id === "ex-B"); return { muscle: e.muscle, secondari: (e.metadata.secondaryMuscles || []).slice() }; };

  // ===== CASO 1: matitina aperta SENZA sheetId e con la scheda SBAGLIATA =====
  coachProgramUi.programId = "p1"; coachProgramUi.sheetId = "sheet-A";
  coachProgramUi.modal = "exercise-details"; coachProgramUi.modalData = { exerciseId: "ex-B" };
  __setForm("exerciseModalName", "Pendulum focus glutei");
  __setForm("exerciseModalMuscle", "Glutei");
  __setForm("exerciseModalSecondary", "Femorali, Polpacci");
  out.errore1 = null;
  try { saveCoachUiModal(); } catch (e) { out.errore1 = String((e && e.message) || e); }
  const b1 = readB();
  out.salvatoMuscle = b1.muscle;
  out.salvatoSecondari = JSON.stringify(b1.secondari);

  // ===== CASO 2: il gruppo NON viene ricalcolato dal nome =====
  out.nomeNonRicalcola = b1.muscle === "Glutei";

  // ===== CASO 3: il modale pre-seleziona il gruppo della scheda, anche fuori elenco =====
  const optsCustom = coachExerciseGroupOptions({ muscle: "Abduttori" });
  out.gruppoSelezionato = selectedOf(optsCustom);
  out.gruppoExtraPresente = /<option[^>]*>Abduttori<\\/option>/.test(optsCustom);
  const optsCanonico = coachExerciseGroupOptions({ muscle: "Glutei" });
  out.gruppoCanonico = selectedOf(optsCanonico);

  // ===== CASO 4: un segnaposto non diventa mai la scelta salvata =====
  const optsPlaceholder = coachExerciseGroupOptions({ muscle: "Da classificare" });
  out.segnapostoNonSelezionato = !/Da classificare/.test(optsPlaceholder);
  out.segnapostoRipiega = selectedOf(optsPlaceholder);

  // ===== CASO 5: scheda ed esercizio risolti per CONTENUTO, non per selezione =====
  out.trovataScheda = (sheetContainingExercise("p1", "ex-B", "sheet-A") || {}).id || null;
  out.trovataFallback = (sheetContainingExercise("p1", "ex-A", "") || {}).id || null;
  out.trovatoEsercizio = (findCoachExerciseById("ex-B") || {}).name || null;
  out.trovatoEsercizioSenzaSheet = (() => { coachProgramUi.sheetId = "sheet-A"; return (findCoachExerciseById("ex-B") || {}).name || null; })();

  // ===== CASO 6: la creazione di un esercizio custom funziona ancora =====
  coachProgramUi.modal = "exercise-custom"; coachProgramUi.modalData = { sheetId: "sheet-A" }; coachProgramUi.sheetId = "sheet-A";
  __setForm("exerciseModalName", "Esercizio Nuovo");
  __setForm("exerciseModalMuscle", "Dorsali");
  __setForm("exerciseModalSecondary", "");
  out.erroreCustom = null;
  try { saveCoachUiModal(); } catch (e) { out.erroreCustom = String((e && e.message) || e); }
  const aAfter = state.programs.find((x) => x.id === "p1").sheets.find((x) => x.id === "sheet-A");
  const creato = aAfter.exercises.find((x) => x.name === "Esercizio Nuovo");
  out.customCreato = !!creato;
  out.customMuscle = creato ? creato.muscle : null;
  return out;
})()`, context);

assert.equal(esito.reach.state, "object", "state raggiungibile");
assert.equal(esito.reach.coachProgramUi, "object", "coachProgramUi raggiungibile");
assert.equal(esito.reach.programRepository, "object", "programRepository raggiungibile");
assert.equal(esito.reach.saveCoachUiModal, "function", "saveCoachUiModal raggiungibile");
assert.equal(esito.reach.sheetContainingExercise, "function", "sheetContainingExercise raggiungibile");
assert.equal(esito.reach.findCoachExerciseById, "function", "findCoachExerciseById raggiungibile");
assert.equal(esito.reach.coachExerciseGroupOptions, "function", "coachExerciseGroupOptions raggiungibile");
assert.equal(esito.errore1, null, "il salvataggio non deve lanciare eccezioni");
assert.equal(esito.salvatoMuscle, "Glutei", "la matitina deve SALVARE il gruppo scelto, anche con la scheda sbagliata indicata");
assert.equal(esito.salvatoSecondari, JSON.stringify(["Femorali", "Polpacci"]), "i muscoli secondari devono essere salvati");
assert.equal(esito.nomeNonRicalcola, true, "il gruppo non si ricalcola dal nome dell'esercizio");
assert.equal(esito.gruppoSelezionato, "Abduttori", "il gruppo della scheda va selezionato anche se fuori elenco (prima: prima voce silenziosa)");
assert.equal(esito.gruppoExtraPresente, true, "il gruppo fuori elenco deve comparire come opzione");
assert.equal(esito.gruppoCanonico, "Glutei", "un gruppo canonico resta selezionato");
assert.equal(esito.segnapostoNonSelezionato, true, "un segnaposto non deve mai essere la scelta del modale");
assert.equal(esito.segnapostoRipiega, "Full body", "senza classificazione si ripiega su Full body, non sul segnaposto");
assert.equal(esito.trovataScheda, "sheet-B", "la scheda dell'esercizio si trova per contenuto, non per sheetId");
assert.equal(esito.trovataFallback, "sheet-A", "senza sheetId preferito si cerca la scheda corretta");
assert.equal(esito.trovatoEsercizio, "Pendulum focus glutei", "il render trova l'esercizio per ID, ovunque sia");
assert.equal(esito.trovatoEsercizioSenzaSheet, "Pendulum focus glutei", "lo trova anche con un'altra scheda selezionata");
assert.equal(esito.erroreCustom, null, "la creazione di un esercizio custom non deve rompersi");
assert.equal(esito.customCreato, true, "l'esercizio custom deve essere creato");
assert.equal(esito.customMuscle, "Dorsali", "il gruppo dell'esercizio custom deve essere quello scelto");

console.log("v148.20 matitina muscolo: OK " + JSON.stringify({ salvato: esito.salvatoMuscle, secondari: esito.salvatoSecondari, scheda: esito.trovataScheda, gruppo: esito.gruppoSelezionato }));
