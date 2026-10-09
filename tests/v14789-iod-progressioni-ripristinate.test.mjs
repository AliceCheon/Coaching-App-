// v148.00 — "Intensità ottobre-dicembre": le progressioni reali dell'Excel
// devono tornare anche quando lo stato salvato conteneva settimane generiche.
//
// Bug: la riparazione (repairImportedProgressions) CONSERVA qualunque settimana
// non vuota, quindi un salvataggio con settimane IOD generiche (es. "1"/"1-12")
// non veniva mai riparato e le progressioni reali non tornavano più. A differenza
// di "Intensità Agosto-Ottobre" (che ha un re-seed forzato per build), IOD non
// aveva alcun re-seed. Questo test blocca la regressione.
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
new vm.Script(script, { filename: "v14800-iod.js" }).runInContext(context);

const EXPECTED_LAT = ["test 12rm, poi 1x8", "10-8-x", "10-x", "10", "10-8-x", "10-x-x", "10-x-x", "10"];

test("la libreria IOD contiene la sequenza Excel reale di Lat machine", () => {
  const res = vm.runInContext(`(() => {
    const programs = buildProgramsFromLegacy(PROGRAM_LIBRARY, []);
    const migrated = runSchemaMigrations({ meta:{}, programs }, 11).state;
    const iod = migrated.programs.find(p=>String(p.phase||"").toLowerCase().includes("ottobre-dicembre"));
    const ex = iod.sheets.find(s=>s.code==="A").exercises.find(e=>/Lat_machine_Triangolo/i.test(e.name));
    return ex.progression.weeks.map(w=>formatReps(w.reps));
  })()`, context);
  assert.deepEqual(res, EXPECTED_LAT);
});

test("il boot ripristina le progressioni IOD reali al posto di settimane generiche salvate", () => {
  const res = vm.runInContext(`(() => {
    const programs = buildProgramsFromLegacy(PROGRAM_LIBRARY, []);
    const migrated = runSchemaMigrations({ meta:{}, programs }, 11).state;
    const iod = migrated.programs.find(p=>String(p.phase||"").toLowerCase().includes("ottobre-dicembre"));
    const ex = iod.sheets.find(s=>s.code==="A").exercises.find(e=>/Lat_machine_Triangolo/i.test(e.name));
    // Simula un salvataggio "sporco": settimane IOD generiche marcate manuali.
    ex.progression.weeks = ex.progression.weeks.map((w,i)=>({ ...w, reps:{ label:String(i===0?"1":"1-12"), min:i===0?1:1, max:i===0?1:12 }, source:"manual" }));
    const corrupted = ex.progression.weeks.map(w=>formatReps(w.reps));
    // Build IOD precedente -> deve scattare il re-seed forzato al boot.
    migrated.meta = { ...(migrated.meta||{}), schemaVersion:11, intensitaOdBuild:"OLD-BUILD" };
    localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
    loadState();
    const iod2 = state.programs.find(p=>String(p.phase||"").toLowerCase().includes("ottobre-dicembre"));
    const ex2 = iod2.sheets.find(s=>s.code==="A").exercises.find(e=>/Lat_machine_Triangolo/i.test(e.name));
    return { corrupted, restored: (ex2.progression.weeks||[]).map(w=>formatReps(w.reps)), build: state.meta.intensitaOdBuild };
  })()`, context);
  assert.deepEqual(res.corrupted, ["1", "1-12", "1-12", "1-12", "1-12", "1-12", "1-12", "1-12"], "precondizione: salvataggio sporco");
  assert.deepEqual(res.restored, EXPECTED_LAT, "le progressioni Excel devono tornare al boot");
  assert.equal(res.build, "2026-10-06-iod-progressioni-ripristinate-v1");
});

test("le altre fasi (es. B program 1) non vengono toccate dal re-seed IOD", () => {
  const res = vm.runInContext(`(() => {
    const programs = buildProgramsFromLegacy(PROGRAM_LIBRARY, []);
    const migrated = runSchemaMigrations({ meta:{}, programs }, 11).state;
    migrated.meta = { ...(migrated.meta||{}), schemaVersion:11, intensitaOdBuild:"OLD-BUILD" };
    localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
    loadState();
    const b1 = state.programs.find(p=>String(p.phase||"").toLowerCase()==="b program 1");
    const hip = b1.sheets.find(s=>s.code==="A").exercises.find(e=>/hip.?thrust/i.test(e.name));
    return { sheets: b1.sheets.map(s=>s.code), hipWeeks: hip.progression.weeks.map(w=>formatReps(w.reps)) };
  })()`, context);
  assert.deepEqual(res.sheets, ["A", "B", "C", "D"], "B program 1 resta a 4 schede logiche");
  assert.equal(res.hipWeeks[0], "15", "i valori storici restano intatti");
});

console.log("v14800: re-seed IOD ripristina le progressioni Excel reali");
