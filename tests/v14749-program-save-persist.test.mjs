import fs from "node:fs/promises";
import vm from "node:vm";

// v14749 · riproduzione del bug "Salva programma" + prova di persistenza.
// 1) il salvataggio fallito deve restituire un MOTIVO (non un click muto)
// 2) un programma nuovo deve restare dopo salvataggio e rilettura dello stato
// 3) il blocco atleta ("tipo blocco") deve ereditare la fase canonica
const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const vmLibs = await Promise.all([
  "exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js",
  "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js",
  "coach-ai3-programming.js", "coach-studio.js"
].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));

const VM_PROLOGUE =
  "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));" +
  "window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;" +
  "window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};" +
  "window.history=window.history||{pushState(){},replaceState(){},back(){}};";
const applicationScript =
  vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE +
  appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");

const storage = new Map();
const localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};
const element = {
  addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  appendChild() {}, insertBefore() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {},
  setAttribute() {}, getAttribute() { return null; }, hasAttribute() { return false; },
  classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, nextElementSibling: null,
  childElementCount: 0, firstElementChild: null, parentNode: null, contentWindow: { postMessage() {} }
};
const document = {
  getElementById() { return element; }, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { ...element }; }, body: element, documentElement: element,
  addEventListener() {}, removeEventListener() {}
};
const context = {
  console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object,
  String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, isFinite, localStorage,
  sessionStorage: localStorage, document, navigator: {},
  location: { protocol: "file:", origin: "null", hash: "" },
  URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
  Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {},
  requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {},
  postMessage() {}, window: null, globalThis: null, performance: { now: () => Date.now() }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(applicationScript, { filename: "atlas-app.js" }).runInContext(context);

const result = vm.runInContext(`(() => {
  const assertions = [];
  const check = (name, condition) => {
    assertions.push({ name, passed: !!condition });
    if (!condition) throw new Error("Test fallito: " + name);
  };

  // --- 1 · validazione con MOTIVO (niente errore muto) ---
  state = clone(baseState);
  state.programs = [];
  const first = programRepository.createProgram({ id: "program-dup", name: "Primo", durationWeeks: 8 }, { save: false });
  check("primo programma creato", first.ok === true);
  const badProgram = programRepository.createProgram({ id: "program-dup", name: "Doppione", durationWeeks: 8 }, { save: false });
  check("salvataggio non valido viene rifiutato", badProgram.ok === false);
  check("il rifiuto porta con se' il motivo", Array.isArray(badProgram.errors) && badProgram.errors.length > 0);
  check("il motivo e' leggibile", String(badProgram.errors[0].message || "").length > 5);
  state.programs = [];

  // --- 2 · dati del modale "Nuovo programma" (come inviati dal form) ---
  const modalPayload = {
    name: "Intensita 2 ottobre-dicembre",
    phase: "intensità",
    durationWeeks: 8,
    status: "draft",
    folder: "",
    source: "custom"
  };
  const created = programRepository.createProgram(modalPayload, { immediate: true });
  check("programma del modale creato", created.ok === true);
  const createdId = created.value.id;

  state.athleteIntelligence = window.BarbellDivaAthleteContext.linkProgram(athleteIntelligenceStore(), createdId, {
    athleteId: "alice", strategyId: "", blockType: modalPayload.phase, nutritionalPhase: "bulk", freeProgram: true
  });
  saveState({ immediate: true });

  // --- 3 · il salvataggio arriva davvero su disco ---
  // scenario reale dell'utente: un programma con fase "intensità" non deve
  // essere cancellato al riavvio (era il "torna indietro" segnalato).
  state = loadState();
  check("programma con fase 'intensità' sopravvive al riavvio", !!programRepository.getProgramById(createdId));
  state = JSON.parse(localStorage.getItem(STORE_KEY)) ? loadState() : state;

  const persisted = JSON.parse(localStorage.getItem(STORE_KEY));
  const persistedProgram = persisted.programs.find((item) => item.id === createdId);
  check("programma presente nella memoria locale", !!persistedProgram);
  check("nome persistito", persistedProgram.name === modalPayload.name);
  check("fase persistita", persistedProgram.phase === modalPayload.phase);

  // --- 4 · dopo il RIAVVIO il programma c'e' ancora (bug "torna indietro") ---
  state = loadState();
  const afterReload = programRepository.getProgramById(createdId);
  check("programma ancora presente dopo il riavvio", !!afterReload);
  check("nome intatto dopo il riavvio", afterReload.name === modalPayload.name);
  check("fase intatta dopo il riavvio", afterReload.phase === modalPayload.phase);
  check("stato intatto dopo il riavvio", afterReload.status === "draft");

  // --- 5 · blocco atleta = fase canonica (campo unico, niente duplicati) ---
  const link = athleteIntelligenceStore().programLinks[createdId] || {};
  check("blocco atleta allineato alla fase", link.blockType === modalPayload.phase);

  // --- 6 · una modifica al programma sopravvive al riavvio ---
  programRepository.updateProgram(createdId, { durationWeeks: 12 }, { immediate: true });
  state = loadState();
  check("modifica sopravvive al riavvio", programRepository.getProgramById(createdId).durationWeeks === 12);

  return { assertions, createdId };
})()`, context);

console.log(JSON.stringify({ ok: true, ...result }, null, 2));
