// v147.50 — Selettore "Fase": etichetta con il nome della scheda (bug "peaking").
// Storia: in "Workout del giorno → Modalità Manuale" l'elenco Fase mostrava solo
// program.phase, quindi una scheda con nome diverso dalla fase (es. fase
// "peaking" per il programma "Intensità 2 ottobre-dicembre") restava
// irriconoscibile. Il VALORE dell'opzione resta la fase (nessuna migrazione dei
// dati): cambia solo l'etichetta, che aggiunge il nome del programma.
// Qui si verifica anche che i programmi eliminati e le fasi vuote non entrino
// più nell'elenco delle fasi disponibili.
import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const workoutFlow = await fs.readFile(new URL("../workout-flow-v147.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js","master-exercise-library.js","app-config-v144.js","athlete-context.js","coach-ai-engine-2.js","knowledge-graph.js","decision-rules.js","decision-engine.js","coach-ai3-programming.js","coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");

const storage = new Map();
const localStorage = { getItem: (k) => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k), clear: () => storage.clear() };
const element = {
  addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {},
  classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, contentWindow: { postMessage() {} }
};
const document = {
  getElementById() { return element; }, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { ...element }; }, body: element, documentElement: element, addEventListener() {}
};
const context = {
  console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp,
  Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {},
  location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
  Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; },
  addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null
};
context.window = context;
context.globalThis = context;
context.sourceHtml = html + appMain + workoutFlow;
vm.createContext(context);
new vm.Script(script, { filename: "atlas-app.js" }).runInContext(context);

const testResult = vm.runInContext(`(() => {
  const assertions = [];
  const check = (name, condition) => { assertions.push({ name, passed: !!condition }); if (!condition) throw new Error("Test fallito: " + name); };

  state = clone(baseState);
  state.programs = [
    { id: "p-peaking", name: "Intensità 2 ottobre-dicembre", phase: "peaking", status: "active", source: "custom", sheets: [] },
    { id: "p-b1", name: "B program 1", phase: "B program 1", status: "available", sheets: [] },
    { id: "p-deleted", name: "Scheda eliminata", phase: "fase fantasma", deletedAt: "2026-09-22T10:00:00.000Z", sheets: [] },
    { id: "p-empty", name: "Senza fase", phase: "", sheets: [] }
  ];

  const phases = availablePhases();
  check("fase della scheda presente nell'elenco", phases.includes("peaking"));
  check("programma eliminato escluso dall'elenco", phases.indexOf("fase fantasma") < 0);
  check("fasi vuote escluse dall'elenco", phases.length === 2);

  check("etichetta con nome scheda", phaseSelectorLabel("peaking") === "peaking · Intensità 2 ottobre-dicembre");
  check("nessuna duplicazione quando fase uguale al nome", phaseSelectorLabel("B program 1") === "B program 1");
  check("fase senza programma resta invariata", phaseSelectorLabel("inesistente") === "inesistente");
  check("fase vuota senza etichetta sporca", phaseSelectorLabel("") === "");
  check("nomi programma collegati alla fase", JSON.stringify(phaseProgramNames("peaking")) === JSON.stringify(["Intensità 2 ottobre-dicembre"]));
  check("programma eliminato non contribuisce al nome", phaseProgramNames("fase fantasma").length === 0);

  const controls = trainingContextControlsHtml({ isManual: true, phase: "peaking", week: 1, date: "02/10/2026", session: null, contextWarning: "" });
  check("selettore Fase leggibile nel contesto allenamento", controls.includes("peaking · Intensità 2 ottobre-dicembre"));
  check("valore dell'opzione resta la fase", controls.includes('value="peaking"'));

  return { assertions, phases };
})()`, context);

if (!workoutFlow.includes("phaseSelectorLabel(phase)")) throw new Error("workout-flow-v147.js: il selettore Fase non usa phaseSelectorLabel");
if (!appMain.includes("phaseSelectorLabel(item)")) throw new Error("app-main.js: gli elenchi Fase non usano phaseSelectorLabel");
if (!appMain.includes("selettore Fase del workout")) throw new Error("app-main.js: il modal programma non spiega il campo Fase");

console.log(JSON.stringify({ ok: true, ...testResult }, null, 2));
