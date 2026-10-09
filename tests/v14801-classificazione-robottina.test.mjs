import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const masterLib = fs.readFileSync(path.join(root, "master-exercise-library.js"), "utf8");
const inlineCss = fs.readFileSync(path.join(root, "coach-studio-inline.css"), "utf8");
const studioCss = fs.readFileSync(path.join(root, "coach-studio.css"), "utf8");

// ---- FIX 1 — "Da classificare" è un segnaposto, non una classificazione ----
assert.match(masterLib, /function isPlaceholderCategory\(value\)/);
assert.match(masterLib, /PLACEHOLDER_CATEGORIES/);
// I primari segnaposto non sopravvivono più: la categoria vera diventa primario.
assert.match(masterLib, /filter\(item=>!isPlaceholderCategory\(item\.name\)\)/);
assert.match(masterLib, /!isPlaceholderCategory\(identity\.category\)/);
assert.match(masterLib, /riparo inverso/);
// La proiezione tecnica filtra i segnaposto e preferisce la categoria del coach.
assert.match(mainJs, /function isPlaceholderMuscleLabel\(/);
assert.match(mainJs, /function technicalRealMuscleList\(/);
assert.match(mainJs, /const categoryValue = /);
assert.match(mainJs, /primaryMuscles: realPrimary\.length \? realPrimary : \[categoryValue\],/);
assert.doesNotMatch(mainJs, /primaryMuscles: technicalStringList\(source\.primaryMuscles\?\.length/);
// Classificare dalla scheda aggiorna la Master Library (fine del "Da classificare" eterno).
assert.match(mainJs, /isPlaceholderMuscleLabel\(masterRecord\.identity\?\.category\)/);

// ---- Nessun orfano — rete per i custom con nomi creativi ----
assert.match(mainJs, /function inferMusclesFromLibrary\(name = "", excludeId = ""\)/);
assert.match(mainJs, /MUSCLE_INFERENCE_STOPWORDS/);
assert.match(mainJs, /\|\| "Full body";/);

// ---- FIX 2 — Statistiche: colonna esercizi del gruppo selezionato ----
assert.match(mainJs, /function coachProgramMuscleExerciseRows\(program, weekNumber\)/);
assert.match(mainJs, /coach-statistics-charts\$\{selected==="all"\?"":" with-exercises"\}/);
assert.match(mainJs, /coach-statistics-exercises/);
assert.match(studioCss, /\.coach-statistics-charts\.with-exercises\{grid-template-columns:minmax\(0,\.8fr\)/);
assert.match(studioCss, /\.coach-statistics-charts\.with-exercises\{grid-template-columns:1fr\}/);

// ---- FIX 3 — Robottina: animazioni e trascinamento ----
// La scelta dentro l'app decide le animazioni (niente override silenzioso del sistema).
assert.match(mainJs, /function effectiveAnimationMode\(\) \{\s*\n\s*return state\.ui\?\.animationMode \|\| "full";/);
assert.doesNotMatch(mainJs, /return window\.matchMedia\?\.\("(prefers-reduced-motion: reduce)"\)\?\.matches \? "reduced" : \(state\.ui\?\.animationMode/);
// Il CSS non spenge più la Diva Bot quando la modalità app è "full".
assert.match(inlineCss, /body:not\(\[data-animation-mode="full"\]\) \.diva-bot/);
// Due strade per il drag: delega document + binding diretto, un solo avvio.
assert.match(mainJs, /function startWorkoutMascotDrag\(event\)/);
assert.match(mainJs, /startWorkoutMascotDrag\(event\);\s*\n\s*\}, true\)/);
assert.match(mainJs, /wmDragDirectBound/);
assert.match(mainJs, /setPointerCapture\?\.\(event\.pointerId\)/);
assert.match(mainJs, /if \(!workoutMascotUi\.drag\) moveWorkoutMascot\(state\.ui\.workoutMascotPosition \|\| "top-right"\)/);

// ---- Verifica VIVA: libreria montata in VM, esattamente il caso di Alice ----
const appMain = mainJs;
const vmLibs = await Promise.all(["exercise-library-19.8.js","master-exercise-library.js","app-config-v144.js","athlete-context.js","coach-ai-engine-2.js","knowledge-graph.js","decision-rules.js","decision-engine.js","coach-ai3-programming.js","coach-studio.js"].map((p) => fs.readFileSync(path.join(root, p), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const applicationScript = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const storage = new Map();
const localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {} };
const document = { getElementById() { return element; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: element, documentElement: element, addEventListener() {} };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {}, location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null };
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(applicationScript, { filename: "v14802-classificazione.js" }).runInContext(context);

const rows = vm.runInContext(`(() => {
  state = clone(baseState);
  const L = window.BarbellDivaMasterLibrary;
  const rec = (name, extras = {}) => L.normalizeRecord({ name, identity: { category: "Da classificare" }, primaryMuscles: ["Da classificare"], ...extras, provenance: { origin: "legacy-program" } });
  state.masterExerciseLibrary = L.normalizeStore({ records: [
    // Record salvati col VECCHIO bug: segnaposto ovunque.
    rec("Stacco Rumeno con bilanciere"), rec("Stacco Rumeno b stance"), rec("Stacco Rumeno con manubri"),
    // Uno già classificato con nome creativo: fa da famiglia per i nuovi.
    rec("Topo Forte di Alice", { identity: { name: "Topo Forte di Alice", category: "Quadricipiti" }, primaryMuscles: ["Quadricipiti"] }),
    // Uno senza nessuna traccia: ultima spiaggia "Full body".
    rec("Macchina fantastica di Alice")
  ] });
  return technicalExerciseLibrary().filter((p) => ["Stacco Rumeno con bilanciere","Stacco Rumeno b stance","Topo Forte di Alice","Macchina fantastica di Alice"].includes(p.name)).map((p) => ({ nome: p.name, categoria: p.category, primari: p.primaryMuscles.join("|") }));
})()`, context);

const byName = Object.fromEntries(rows.map((row) => [row.nome, row]));
// 1) I vecchi "Da classificare" si sanano da soli (base di conoscenza sul nome).
assert.equal(byName["Stacco Rumeno con bilanciere"].categoria, "femorali");
assert.match(byName["Stacco Rumeno con bilanciere"].primari, /femorali/);
assert.equal(byName["Stacco Rumeno b stance"].categoria, "femorali");
// 2) Il custom creativo senza KB eredita dalla famiglia già classificata.
assert.equal(byName["Topo Forte di Alice"].categoria, "Quadricipiti");
// 3) Nessuno resta orfano: zero segnali → "Full body", mai un segnaposto.
assert.equal(byName["Macchina fantastica di Alice"].categoria, "Full body");
assert.notEqual(byName["Macchina fantastica di Alice"].categoria, "non classificato");
assert.equal(byName["Macchina fantastica di Alice"].primari, "Full body");

// ---- FIX 4 — workout: niente più valori "a casaccio" ----
// Il re-seed non cancella più le correzioni della coach a ogni cambio build.
assert.doesNotMatch(mainJs, /sheets: replacement\.sheets/);
assert.match(mainJs, /i dati della coach[\s\S]{0,80}non vengono MAI più sovrascritti/);
// Le note del workout seguono la stessa priorità della scheda (settimana → Excel → esercizio).
assert.match(mainJs, /note: String\(raw\.notes \|\| raw\.note \|\| \[exercise\.metadata\?\.excelNote1, exercise\.metadata\?\.excelNote2\]/);
// Trasparenza: il workout dichiara la settimana del metodo e la scheda base quando divergono.
assert.match(mainJs, /workout-week-source/);
assert.match(mainJs, /workout-base-hint/);
assert.match(inlineCss, /\.workout-mini-badge\.workout-week-source/);

console.log(JSON.stringify({ ok: true, classificazione: true, autoRiparati: true, customInferiti: true, nessunOrfano: true, statisticheEsercizi: true, robottinaAnimataEDraggibile: true, workoutOnesto: true }));
