// v147.52 — La Fase è un DATO del programma (PROGRAMMA → SETTIMANA → FASE).
// Regressione per: priorità della mappatura esplicita, inferenza solo fallback
// marcata "stimata", esclusione del `type` esercizio dal calcolo, reattività
// Programma → Settimana e indipendenza della Scheda.
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

const result = vm.runInContext(`(() => {
  const assertions = [];
  const check = (name, passed) => assertions.push({ name, passed: !!passed });

  const sheetWith = (code, exercises) => ({ id: "sh-" + code, code, name: "Scheda " + code, week: 1, order: 0, exercises });

  // --- 1. La mappatura esplicita programma → settimana → fase è la fonte primaria.
  const pDeclared = { id: "p-dec", name: "Programma dichiarato", phase: "Etichetta", status: "active", durationWeeks: 5,
    periodization: { weeks: { 1: "volume", 2: "volume", 3: "volume", 4: "deload", 5: "peaking" } },
    sheets: [sheetWith("A", [{ id: "e1", name: "Hip Thrust", sets: "3", reps: "10", progression: { weeks: [
      { weekNumber: 4, sets: "1", reps: "Test 10 RM", type: "test" }
    ] } }])] };
  state.programs.push(pDeclared);
  check("mappatura letta dal programma", programWeekPlan(pDeclared)[4] === "deload");
  check("fase w1 dalla mappatura", derivedPhaseForWeek(pDeclared, 1) === "Volume");
  check("fase w4 dalla mappatura (non regola generica)", derivedPhaseForWeek(pDeclared, 4) === "Deload");
  check("fase w5 dalla mappatura", derivedPhaseForWeek(pDeclared, 5) === "Peaking");
  check("mappatura non stimata", phaseFromProgramData(pDeclared, null, 1).estimated === false);
  check("origine = mappatura del programma", phaseFromProgramData(pDeclared, null, 1).source === "mappatura del programma");

  // --- 2. Il type dell'esercizio NON sovrascrive la fase dichiarata.
  check("type esercizio non sovrascrive la mappatura (w4)", derivedPhaseForWeek(pDeclared, 4, programSheetsFor(pDeclared)[0]) === "Deload");
  const pTypeOnly = { id: "p-typ", name: "Solo tipi esercizio", phase: "Blocco X", status: "active", sheets: [
    sheetWith("A", [{ id: "e2", name: "Hip Thrust", sets: "3", reps: "10", progression: { weeks: [
      { weekNumber: 2, sets: "1", reps: "8" },
      { weekNumber: 3, sets: "1", reps: "8", type: "deload" }
    ] } }])] };
  state.programs.push(pTypeOnly);
  check("type deload esercizio ignorato nel calcolo fase", derivedPhaseForWeek(pTypeOnly, 3, programSheetsFor(pTypeOnly)[0]) !== "Deload");
  check("type esercizio non produce peaking", derivedPhaseForWeek(pTypeOnly, 3, programSheetsFor(pTypeOnly)[0]) !== "Peaking");
  check("senza mappatura si usa l'inferenza stimata, non il type", phaseFromProgramData(pTypeOnly, programSheetsFor(pTypeOnly)[0], 3).estimated === true);

  // --- 3. Inferenza SOLO come fallback, e marcata come stimata.
  const pInfer = { id: "p-inf", name: "Solo struttura", phase: "", status: "active", durationWeeks: 8, sheets: [
    sheetWith("A", [
      { id: "e3", name: "Hip Thrust", sets: "3", reps: "12", progression: { weeks: [
        { weekNumber: 1, sets: "4", reps: "12" }, { weekNumber: 2, sets: "4", reps: "12" }, { weekNumber: 3, sets: "4", reps: "10" },
        { weekNumber: 4, sets: "1", reps: "Test 10 RM" }, { weekNumber: 5, sets: "4", reps: "10" }, { weekNumber: 6, sets: "3", reps: "10" },
        { weekNumber: 7, sets: "3", reps: "8" }, { weekNumber: 8, sets: "1", reps: "Test 8 RM" }
      ] } },
      { id: "e4", name: "Leg Curl", sets: "3", reps: "12", progression: { weeks: [
        { weekNumber: 1, sets: "4", reps: "12" }, { weekNumber: 2, sets: "4", reps: "12" }, { weekNumber: 3, sets: "4", reps: "10" },
        { weekNumber: 4, sets: "2", reps: "10" }, { weekNumber: 5, sets: "4", reps: "10" }, { weekNumber: 6, sets: "3", reps: "10" },
        { weekNumber: 7, sets: "3", reps: "8" }, { weekNumber: 8, sets: "2", reps: "8" }
      ] } }
    ]) ] };
  state.programs.push(pInfer);
  const inf = phaseFromProgramData(pInfer, null, 8);
  check("fallback inferenza usato quando manca la mappatura", !!inf.phase);
  check("fallback marcato come stimato", inf.estimated === true);
  check("origine fallback dice 'stimata'", /stimata/.test(inf.source));
  check("mappatura esplicita presente: nessun fallback", phaseFromProgramData(pDeclared, null, 4).estimated === false);

  // --- 4. Reattività PROGRAMMA → SETTIMANA → FASE con mappature diverse.
  const pAlpha = { id: "p-alpha", name: "Alfa", phase: "Alfa", status: "active", durationWeeks: 5,
    periodization: { weeks: { 1: "volume", 2: "volume", 3: "volume", 4: "deload", 5: "intensificazione" } }, sheets: [sheetWith("A", []), sheetWith("B", [])] };
  const pBeta = { id: "p-beta", name: "Beta", phase: "Beta", status: "active", durationWeeks: 5,
    periodization: { weeks: { 1: "accumulo", 2: "deload", 3: "intensificazione", 4: "peaking", 5: "peaking" } }, sheets: [sheetWith("A", [])] };
  state.programs.push(pAlpha, pBeta);
  check("Alfa w1 volume", derivedPhaseForWeek(pAlpha, 1) === "Volume");
  check("Alfa w4 deload", derivedPhaseForWeek(pAlpha, 4) === "Deload");
  check("Alfa w5 intensificazione", derivedPhaseForWeek(pAlpha, 5) === "Intensificazione");
  check("Beta w4 peaking", derivedPhaseForWeek(pBeta, 4) === "Peaking");
  check("Beta w1 accumulo", derivedPhaseForWeek(pBeta, 1) === "Accumulo");
  check("stessa settimana, programmi diversi -> fasi diverse", derivedPhaseForWeek(pAlpha, 4) !== derivedPhaseForWeek(pBeta, 4));
  check("cambio settimana ricalcola la fase", derivedPhaseForWeek(pAlpha, 1) !== derivedPhaseForWeek(pAlpha, 4));

  // --- 5. La SCHEDA è indipendente dal calcolo della fase (PROGRAMMA → SCHEDA).
  check("Alfa w2 scheda A = scheda B (fase indipendente dalla scheda)", derivedPhaseForWeek(pAlpha, 2, programSheetsFor(pAlpha)[0]) === derivedPhaseForWeek(pAlpha, 2, programSheetsFor(pAlpha)[1]));

  // --- 6. Il salvataggio dall'editor (stessa pipeline) diventa fonte della fase.
  programRepository.updateProgram("p-typ", { periodization: { weeks: { 2: "deload", 3: "accumulo" } } }, { immediate: true });
  const saved = programById("p-typ");
  check("mappatura salvata usata come fonte", derivedPhaseForWeek(saved, 2) === "Deload");
  check("mappatura salvata w3", derivedPhaseForWeek(saved, 3) === "Accumulo");
  check("mappatura salvata non stimata", phaseFromProgramData(saved, null, 2).estimated === false);

  // --- 7. Migrazione dei 4 programmi reali (mappatura confermata dall'utente).
  const realNames = ["B program 1", "B program 2", "Intensificazione", "Intensità Agosto-Ottobre"];
  const realSheets = () => [sheetWith("A", [{ id: "rx", name: "Hip Thrust", sets: "3", reps: "10", progression: { weeks: [
    { weekNumber: 1, sets: "4", reps: "10" }, { weekNumber: 4, sets: "1", reps: "Test 10 RM" }
  ] } }])];
  const realPrograms = realNames.map((name, i) => ({ id: "real-" + i, name, phase: name, status: "active", durationWeeks: 8, sheets: realSheets() }));
  const migrated = migrateConfirmedWeekPlans({ programs: realPrograms, migrations: {} });
  check("migrazione applicata ai programmi reali", migrated === true);
  check("tutti e 4 i programmi reali hanno la mappatura", realPrograms.every((p) => Object.keys(p.periodization?.weeks || {}).length > 0));
  check("mappature con l'estensione attesa", realPrograms.every((p) => {
    const expected = p.name === "Intensificazione" ? 7 : 8;
    return Object.keys(p.periodization.weeks).length === expected;
  }));
  const byName = Object.fromEntries(realPrograms.map((p) => [p.name, p.periodization.weeks]));
  check("B program 1 w7 deload", byName["B program 1"][7] === "deload");
  check("B program 1 w8 peaking", byName["B program 1"][8] === "peaking");
  check("B program 2 w7 deload", byName["B program 2"][7] === "deload");
  check("Intensificazione w1-w6 intensificazione", [1,2,3,4,5,6].every((w) => byName["Intensificazione"][w] === "intensificazione"));
  check("Intensificazione w7 peaking", byName["Intensificazione"][7] === "peaking");
  check("Intensificazione senza accumulo", !Object.values(byName["Intensificazione"]).includes("accumulo"));
  check("Intensità Ago-Ott w4 deload", byName["Intensità Agosto-Ottobre"][4] === "deload");
  check("Intensità Ago-Ott w8 deload (non peaking)", byName["Intensità Agosto-Ottobre"][8] === "deload");
  check("migrazione idempotente", migrateConfirmedWeekPlans({ programs: realPrograms, migrations: { confirmedWeekPlansV14752: 1 } }) === false);
  check("migrazione non tocca mappature già presenti", (() => {
    const p = { name: "B program 1", periodization: { weeks: { 1: "peaking" } } };
    migrateConfirmedWeekPlans({ programs: [p], migrations: {} });
    return p.periodization.weeks[1] === "peaking";
  })());

  // --- 8. Nessun riferimento obsoleto alla vecchia logica.
  check("programDeloadWeeks rimossa", typeof programDeloadWeeks === "undefined");
  check("sourceHtml non usa più il type esercizio per la fase", !/settimana della scheda/.test(sourceHtml));

  state.programs = state.programs.filter((p) => !["p-dec","p-typ","p-inf","p-alpha","p-beta"].includes(p.id));
  return { assertions };
})()`, context);

const assertions = result.assertions;
const failures = assertions.filter((a) => !a.passed);
assertions.forEach((a) => console.log(`${a.passed ? "✔" : "✖"} ${a.name}`));
console.log(`\n${assertions.length - failures.length}/${assertions.length} verifiche superate`);
if (failures.length) {
  console.error("Fallite:\n" + failures.map((f) => `  - ${f.name}`).join("\n"));
  process.exit(1);
}
