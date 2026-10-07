// v147.92 → v147.92 — I metodi "Intensità:" (ottobre-dicembre) devono PRODURRE
// la loro sequenza reale di ripetizioni a prescindere dall'esercizio.
//
// Bug: i tre metodi erano dichiarati con parametri vuoti `{}` e la loro sequenza
// settimanale viveva SOLO nella descrizione testuale. Rigenerando la progressione
// il motore non la trovava e ripiegava sul default di riserva 8-12 (o sulle reps
// dell'esercizio, che per esercizi senza reps --- es. Pendulum creato a mano ---
// restavano vuote). Inoltre la regola "linear-reps" sulla prima settimana
// sovrascriveva i valori del pattern.
//
// Questo test blocca la regressione: la sequenza del METODO deve uscire tale e
// quale per qualunque esercizio, e RIR/RPE restano vuoti.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(
  ["exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js", "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js", "coach-ai3-programming.js", "coach-studio.js"]
    .map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8"))
);
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const store = new Map();
const localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const el = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {} };
const document = { getElementById() { return el; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...el }; }, body: el, documentElement: el, addEventListener() {} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {}, location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {}, window: null, globalThis: null };
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(script, { filename: "v14792-intensity-patterns.js" }).runInContext(context);

// Sequenze reali, lette dal foglio "Intensità ottobre-dicembre".
const EXPECTED = {
  // Sequenza delle ULTIME schede del foglio (C "Lat_mono_braccio", D
  // "Front_squat_machine"): W2 10-x, W3 10-8-x, W4 10, poi ripropone l'ondata.
  "intensity-test12-wave": ["test 12rm, poi 1x8", "10-x", "10-8-x", "10", "10-x", "10-8-x", "10-8-x", "10"],
  "intensity-test10-climb": ["test 10rm, poi 1x6", "6", "6", "6", "7", "7", "8", "9"],
  "intensity-midcycle-test": ["8-10", "8-10", "8-10", "test 10 rm", "7", "8", "8", "9"]
};

// Esercizio CON reps proprie e un esercizio SENZA reps (come il Pendulum creato a
// mano in allenamento): il metodo deve dare lo stesso risultato in entrambi i casi.
const withReps = `{ id:"lat", name:"Lat_machine_Triangolo", prescription:{ sets:3, reps:"8-12", rest:{seconds:90} } }`;
const noReps = `{ id:"pend", name:"Pendulum focus glutei", prescription:{ sets:3, reps:"", rest:{seconds:90} } }`;

for (const [templateId, expected] of Object.entries(EXPECTED)) {
  test(`${templateId}: la sequenza del metodo esce identica con e senza reps dell'esercizio`, () => {
    const res = vm.runInContext(`(() => {
      const gen = (ex) => generateProgressionWeeks(ex, ${JSON.stringify(templateId)}, 8).map((w) => formatReps(w.reps));
      return { withReps: gen(${withReps}), noReps: gen(${noReps}) };
    })()`, context);
    assert.deepEqual(res.withReps, expected, "esercizio con reps: sequenza del metodo attesa");
    assert.deepEqual(res.noReps, expected, "esercizio senza reps: stessa sequenza, NON dipendente dall'esercizio");
    assert.deepEqual(res.withReps, res.noReps, "il metodo NON dipende dall'esercizio");
  });
}

test("i metodi \"Intensità:\" non emettono mai il default generico 8-12 né RIR/RPE", () => {
  const res = vm.runInContext(`(() => {
    const out = {};
    for (const id of ["intensity-test12-wave","intensity-test10-climb","intensity-midcycle-test"]) {
      const weeks = generateProgressionWeeks({ id:"x", name:"qualsiasi", prescription:{ sets:3, reps:"", rest:{seconds:90} } }, id, 8);
      out[id] = {
        reps: weeks.map((w) => formatReps(w.reps)),
        rir: weeks.map((w) => formatRir(w.rir)),
        rpe: weeks.map((w) => formatRir(w.rpe))
      };
    }
    return out;
  })()`, context);
  for (const [id, data] of Object.entries(res)) {
    assert.ok(!data.reps.includes("8-12"), `${id}: non deve mai produrre 8-12 (trovato: ${JSON.stringify(data.reps)})`);
    for (const r of data.rir) assert.equal(r, "", `${id}: RIR deve restare vuoto`);
    for (const r of data.rpe) assert.equal(r, "", `${id}: RPE deve restare vuoto`);
  }
});

test("i metodi NON-Intensità continuano a usare le reps dell'esercizio (nessuna regressione)", () => {
  const res = vm.runInContext(`(() => {
    return generateProgressionWeeks({ id:"x", name:"Lat", prescription:{ sets:3, reps:"6-10", rest:{seconds:90} } }, "rep-range-progression", 5).map((w) => formatReps(w.reps));
  })()`, context);
  assert.equal(res[0], "6", "prima settimana dal fondo scala del range dell'esercizio");
  assert.equal(res[1], "6-10", "le settimane successive mantengono le reps dell'esercizio");
});

console.log("v14792: i metodi Intensità: producono la sequenza reale a prescindere dall'esercizio");
