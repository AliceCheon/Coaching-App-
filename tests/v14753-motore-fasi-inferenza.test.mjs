// v147.53 — Motore di classificazione delle Fasi (3 strati).
//
// Verifica ciò che il requisito esige:
//   1. la Fase NON dipende dal nome del programma né da una tabella seminata;
//   2. la Fase NON è determinata dal `type` del singolo esercizio;
//   3. l'override esplicito (`periodization.weeks`) vince, ed è distinguibile
//      dall'inferenza tramite `source` ("explicit" vs "inferred");
//   4. la classificazione è relativa al blocco e ispezionabile (segnali,
//      confidenza, evidenze);
//   5. il motore dichiara i dati che gli mancano invece di inventare una fase.
import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const workoutFlow = await fs.readFile(new URL("../workout-flow-v147.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js", "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js", "coach-ai3-programming.js", "coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
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
  const check = (name, passed) => { assertions.push({ name, passed: !!passed }); if (!passed) throw new Error("Test fallito: " + name); };
  const sheetWith = (code, exercises) => ({ id: "sh-" + code, code, name: "Scheda " + code, week: 1, order: 0, exercises });
  const weeksOf = (labels, sets) => ({ progression: { weeks: labels.map((reps, index) => ({ weekNumber: index + 1, sets: String(sets[index]), reps })) } });
  const programWith = (id, name, labels, sets) => ({ id, name, phase: name, status: "active", durationWeeks: labels.length, sheets: [
    sheetWith("A", [{ id: id + "-a", name: "Esercizio A", ...weeksOf(labels, sets) }]),
    sheetWith("B", [{ id: id + "-b", name: "Esercizio B", ...weeksOf(labels, sets) }])
  ] });

  // 1. Il NOME del programma non cambia la classificazione.
  const descending = ["12-8","12-8","12-8","12-8","12-8","12-8","12-8","12-8"];
  const flatSets = [4,4,4,4,4,4,4,4];
  const pAlfa = programWith("e-alfa", "Alfa", descending, flatSets);
  const pBeta = programWith("e-beta", "Beta", descending, flatSets);
  state.programs.push(pAlfa, pBeta);
  const classAlfa = classifyProgramWeeks(pAlfa);
  const classBeta = classifyProgramWeeks(pBeta);
  check("stessa struttura, nome diverso → stessa fase", Object.values(classAlfa).every((e, i) => e.phase === Object.values(classBeta)[i].phase));
  check("discendenza intra-serie letta come intensità", classAlfa[1].phase === "intensità");
  check("mai classificata come volume con schema discendente", classAlfa[1].phase !== "volume");

  // 2. Il \`type\` dell'esercizio NON entra nel calcolo.
  const typeless = programWith("e-typeless", "Senza tipo", ["10","10","10"], [4,4,4]);
  const typed = programWith("e-typed", "Con tipo", ["10","10","10"], [4,4,4]);
  typed.sheets[0].exercises[0].progression.weeks[1].type = "deload";
  typed.sheets[1].exercises[0].progression.weeks[2].type = "peaking";
  state.programs.push(typeless, typed);
  const a = classifyProgramWeeks(typeless);
  const b = classifyProgramWeeks(typed);
  check("il type esercizio non cambia la fase", JSON.stringify(Object.values(a).map((e) => e.phase)) === JSON.stringify(Object.values(b).map((e) => e.phase)));
  check("type 'deload' non produce deload", b[2].phase !== "deload");
  check("type 'peaking' non produce peaking", b[3].phase !== "peaking");

  // 3. Override esplicito: vince, ed è distinguibile dall'inferenza.
  const pOverride = programWith("e-override", "Con override", ["10","10","10","10"], [4,4,4,4]);
  pOverride.periodization = { weeks: { 2: "deload", 4: "peaking" } };
  state.programs.push(pOverride);
  check("override esplicito usato", derivedPhaseForWeek(pOverride, 2) === "Deload");
  check("source = explicit", phaseFromProgramData(pOverride, null, 2).source === "explicit");
  check("override non stimato", phaseFromProgramData(pOverride, null, 2).estimated === false);
  check("settimana non dichiarata → inferred", phaseFromProgramData(pOverride, null, 1).source === "inferred");
  check("source explicit ≠ inferred", phaseFromProgramData(pOverride, null, 2).source !== phaseFromProgramData(pOverride, null, 1).source);

  // 4. Classificazione relativa al blocco + ispezionabilità.
  const pBlock = programWith("e-block", "Blocco", ["12","12","12","12","12","12","10","Test 8 RM"], [4,4,4,4,4,4,3,1]);
  state.programs.push(pBlock);
  const blockClass = classifyProgramWeeks(pBlock);
  check("ultima settimana di test → peaking", blockClass[8].phase === "peaking");
  check("confidenza numerica in (0,1]", Object.values(blockClass).every((e) => typeof e.confidence === "number" && e.confidence > 0 && e.confidence <= 1));
  check("evidenze ispezionabili", Object.values(blockClass).every((e) => Array.isArray(e.evidence) && e.evidence.length > 0));
  check("segnali numerici esposti", Object.values(blockClass).every((e) => e.signals && typeof e.signals.volumeRatio === "number"));
  check("candidato alternativo esposto", Object.values(blockClass).some((e) => e.candidate));

  // 5. Settimane senza dati: nessuna fase inventata.
  const empty = { id: "e-empty", name: "Vuoto", phase: "Senza dati", status: "active", sheets: [sheetWith("A", [{ id: "e-x", name: "X" }])] };
  state.programs.push(empty);
  check("programma senza prescrizioni non classifica settimane", Object.keys(classifyProgramWeeks(empty)).length === 0);
  check("fallback all'etichetta del programma", phaseFromProgramData(empty, null, 1).phase === "Senza dati" || phaseFromProgramData(empty, null, 1).phase === "Vuoto");

  // 6. Il valore di scarsa deducibilità resta a bassa confidenza e dichiara il segnale mancante.
  const pForza = programWith("e-forza", "Rep basse", ["3","3","3","3"], [5,5,5,5]);
  state.programs.push(pForza);
  const forzaClass = classifyProgramWeeks(pForza);
  check("rep basse → forza a bassa confidenza", forzaClass[1].phase === "forza" && forzaClass[1].confidence <= 0.4);
  check("segnale mancante dichiarato per la forza", !!forzaClass[1].requiredSignal);

  // 7. Il vincolo del requisito: Intensità Agosto-Ottobre NON è "volume".
  const agoOtt = programWith("e-ago", "Intensità Agosto-Ottobre",
    ["12-8","12-8","12-8","12-8","12-8","12-8","12-8","12-8"], [3,3,3,3,3,3,3,3]);
  agoOtt.sheets[0].exercises[0].progression.weeks[1].reps = "15-20";
  state.programs.push(agoOtt);
  const agoClass = classifyProgramWeeks(agoOtt);
  check("Ago-Ottobre mai 'volume' nonostante il nome", !Object.values(agoClass).some((e) => e.phase === "volume"));
  check("Ago-Ottobre classificata come intensità", Object.values(agoClass).every((e) => e.phase === "intensità"));

  // 8. Reset dei programmi di prova per non sporcare altre verifiche.
  state.programs = state.programs.filter((p) => !["e-alfa","e-beta","e-typeless","e-typed","e-override","e-block","e-empty","e-forza","e-ago"].includes(p.id));

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
