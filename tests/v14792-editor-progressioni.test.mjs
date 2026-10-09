// v148.02 — La sezione "Progressioni" deve permettere di SCRIVERE le progressioni
// settimana per settimana, e crearne di proprie, che poi escono su QUALSIASI
// esercizio.
//
// Prima: i metodi personali venivano scartati da progressionTemplates() (non
// comparivano nel selettore) e non c'era alcuna tabella per digitare la sequenza
// per settimana. Ora:
//  - progressionTemplates() include anche i metodi creati da zero dall'utente;
//  - parameters.pattern (serie:reps per settimana) guida il generatore;
//  - progressionTemplateEditorHtml mostra le righe editabili del pattern.
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
new vm.Script(script, { filename: "v14802-editor-progressioni.js" }).runInContext(context);

const NO_REPS = `{ id:"x", name:"esercizio senza reps", prescription:{ sets:3, reps:"", rest:{seconds:90} } }`;

test("un metodo creato dall'utente con pattern proprio esce su qualsiasi esercizio", () => {
  const res = vm.runInContext(`(() => {
    state.coach = state.coach || {};
    state.coach.progressionTemplates = [{ id:"my-prog", name:"La mia progressione", rules:{kind:"linear-reps"}, parameters:{pattern:["3:12","2:10","4:8","1:test 6rm"]}, builtIn:false, userEditable:true, active:true }];
    return generateProgressionWeeks(${NO_REPS}, "my-prog", 4).map((w) => formatReps(w.reps));
  })()`, context);
  assert.deepEqual(res, ["12", "10", "8", "test 6rm"]);
});

test("il metodo personale compare nella libreria selezionabile (non viene scartato)", () => {
  const res = vm.runInContext(`(() => {
    state.coach = state.coach || {};
    state.coach.progressionTemplates = [{ id:"my-prog", name:"La mia progressione", rules:{kind:"linear-reps"}, parameters:{pattern:["3:12"]}, builtIn:false, userEditable:true, active:true }];
    const all = progressionTemplates().map((t) => t.id);
    return { has: all.includes("my-prog"), findable: !!(progressionTemplateById("my-prog")), count: all.length };
  })()`, context);
  assert.equal(res.has, true, "il metodo personale deve comparire nel selettore");
  assert.equal(res.findable, true, "il metodo personale deve essere risolvibile per id");
});

test("modificare un metodo predefinito (override) applica il pattern scritto dall'utente", () => {
  const res = vm.runInContext(`(() => {
    state.coach = state.coach || {};
    state.coach.progressionTemplates = [{ id:"ovr-1", baseTemplateId:"intensity-test12-wave", rules:{kind:"linear-reps"}, parameters:{pattern:["2:9","1:5","3:7"]}, active:true }];
    return generateProgressionWeeks(${NO_REPS}, "intensity-test12-wave", 3).map((w) => formatReps(w.reps));
  })()`, context);
  assert.deepEqual(res, ["9", "5", "7"]);
});

test("l'editor del metodo mostra le righe editabili della sequenza (data-progression-pattern)", () => {
  const res = vm.runInContext(`(() => {
    const html = progressionTemplateEditorHtml({ id:"t", name:"Test", rules:{kind:"linear-reps"}, parameters:{ pattern:["1:test 12rm, poi 1x8","2:10-x","3:10-8-x"] } });
    const rows = (html.match(/data-progression-pattern="reps"/g) || []).length;
    return { rows, hasBody: html.includes("data-progression-pattern-body"), hasAdd: html.includes("data-progression-pattern-add"), first: html.includes('value="test 12rm, poi 1x8"') };
  })()`, context);
  assert.equal(res.rows, 3, "deve mostrare una riga per ogni settimana del pattern");
  assert.equal(res.hasBody, true);
  assert.equal(res.hasAdd, true);
  assert.equal(res.first, true, "il testo ripetizioni va precompilato");
});

test("senza righe di pattern l'editor mostra il messaggio e non inventa settimane", () => {
  const res = vm.runInContext(`(() => {
    const html = progressionTemplateEditorHtml({ id:"t", name:"Vuoto", rules:{kind:"linear-reps"}, parameters:{} });
    return { rows: (html.match(/data-progression-pattern="reps"/g) || []).length, emptyShown: !/data-progression-pattern-empty hidden/.test(html) };
  })()`, context);
  assert.equal(res.rows, 0);
});

console.log("v14802: editor progressioni settimana per settimana + metodi personali selezionabili");
