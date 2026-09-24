// v147.51 — Selettore "Scheda" (sheet-first) e Fase derivata (bug "peaking").
// Storia: in "Workout del giorno → Modalità Manuale" l'elenco Fase mostrava solo
// program.phase, quindi una scheda con nome diverso dalla fase (es. fase
// "peaking" per il programma "Intensità 2 ottobre-dicembre") restava
// irriconoscibile, e "peaking" compariva accanto al nome.
// Soluzione: la SCHEDA è la fonte della scelta (raggruppata per programma, con
// l'id come valore perché i codici A/B si ripetono tra i programmi) e la FASE è
// un valore derivato dalla scheda scelta: niente più doppia etichetta.
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
    { id: "p-peaking", name: "Intensità 2 ottobre-dicembre", phase: "peaking", status: "active", source: "custom", sheets: [
      { id: "sh-peak-a", code: "A", name: "Scheda A", week: 1, order: 0, exercises: [] },
      { id: "sh-peak-b", code: "B", name: "Scheda B", week: 1, order: 1, exercises: [] }
    ] },
    { id: "p-b1", name: "B program 1", phase: "B program 1", status: "available", sheets: [
      { id: "sh-b1-a", code: "A", name: "Scheda A", week: 1, order: 0, exercises: [] }
    ] },
    { id: "p-deleted", name: "Scheda eliminata", phase: "fase fantasma", deletedAt: "2026-09-22T10:00:00.000Z", sheets: [
      { id: "sh-del-a", code: "A", name: "Scheda fantasma", week: 1, order: 0, exercises: [] }
    ] },
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

  // Sheet-first: la scheda è la fonte della scelta, raggruppata per programma,
  // con l'id come valore (i codici A/B si ripetono tra i programmi).
  const groups = programSheetGroups();
  check("schede raggruppate per programma", groups.length === 2 && groups.map((g) => g.label).join("|") === "Intensità 2 ottobre-dicembre|B program 1");
  check("programma eliminato escluso dai gruppi", groups.every((g) => g.id !== "p-deleted"));
  check("le schede del gruppo portano la fase del programma", groups[0].sheets.every((s) => s.phase === "peaking"));
  check("valore opzione = id scheda", groups[0].sheets[0].id === "sh-peak-a");

  const manualContext = { isManual: true, phase: "peaking", week: 1, date: "02/10/2026", session: { id: "sh-peak-b", code: "B", name: "Scheda B" }, contextWarning: "", phaseSessions: sessionsForPhase("peaking") };
  const controls = trainingContextControlsHtml(manualContext);
  check("selettore Scheda presente nel contesto allenamento", controls.includes('data-training-context="session"'));
  check("opzioni raggruppate per programma (optgroup)", controls.includes("<optgroup"));
  check("scheda selezionata usa l'id", controls.includes('value="sh-peak-b"') && controls.includes("selected"));
  check("opzioni scheda mostrano solo il nome", controls.includes(">Scheda B<") && !controls.includes("B · Scheda B"));
  check("Fase è un valore derivato, non un selettore", controls.includes('data-training-context-derived="phase"') && !controls.includes('data-training-context="phase"'));
  check("Fase derivata normalizzata al vocabolario blocchi", controls.includes('data-training-context-derived="phase">Peaking<'));
  check("nessuna etichetta sporca 'peaking · ...' nel selettore scheda", !controls.includes("peaking · Intensità"));
  const orderSheet = controls.indexOf(">Scheda");
  const orderPhase = controls.indexOf(">Fase");
  const orderWeek = controls.indexOf(">Settimana<");
  check("ordine campi Scheda → Fase → Settimana", orderSheet > -1 && orderPhase > orderSheet && orderWeek > orderPhase);

  // La Fase normalizza le varianti al vocabolario dei blocchi (volume/accumulo/
  // intensificazione/peaking...) ma lascia intatti i nomi liberi.
  check("fase canonica minuscola → titolo", phaseDisplayLabel("volume") === "Volume");
  check("fase con prefisso numerico → canonica", phaseDisplayLabel("2.Intensificazione") === "Intensificazione");
  check("fase canonica composta riconosciuta", phaseDisplayLabel("adattamento anatomico") === "Adattamento Anatomico");
  check("fase libera lasciata invariata", phaseDisplayLabel("Intensità Agosto-Ottobre") === "Intensità Agosto-Ottobre");
  check("fase vuota senza etichetta sporca", phaseDisplayLabel("") === "");

  // In automatico la fase resta quella attiva e la scheda segue data/settimana.
  const autoControls = trainingContextControlsHtml({ isManual: false, phase: "B program 1", week: 1, date: "02/10/2026", session: { id: "sh-b1-a", code: "A", name: "Scheda A" }, contextWarning: "", phaseSessions: sessionsForPhase("B program 1") });
  check("in automatico il selettore scheda è disabilitato", autoControls.includes('data-training-context="session" disabled'));
  check("in automatico la fase è quella attiva", autoControls.includes('data-training-context-derived="phase">B program 1<'));

  return { assertions, phases };
})()`, context);

if (!workoutFlow.includes('data-training-context="session"')) throw new Error("workout-flow-v147.js: manca il selettore Scheda sheet-first");
if (!workoutFlow.includes('data-training-context-derived="phase"')) throw new Error("workout-flow-v147.js: la Fase non è un valore derivato");
if (!appMain.includes("programSheetGroups")) throw new Error("app-main.js: manca programSheetGroups (sheet-first)");
if (!appMain.includes("resolveManualSession")) throw new Error("app-main.js: manca resolveManualSession (scheda -> fase)");
if (!appMain.includes("campo Fase del workout")) throw new Error("app-main.js: il modal programma non spiega il campo Fase");

console.log(JSON.stringify({ ok: true, ...testResult }, null, 2));
