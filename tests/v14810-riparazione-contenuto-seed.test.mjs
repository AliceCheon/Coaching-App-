import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.11: il workbook RIPARA il contenuto dei seed anche su copie esistenti ---
// Alice: "continuano a uscire ripetizioni e serie a casaccio su mobile, anche se
// ora la scheda giusta c'è". Il telefono custodiva una copia VECCHIA del programma
// (id già presente → il re-seed la saltava; cancello con stamp fissa → mai più
// riaperto): scheda giusta, numeri di luglio. Da ora il seed ripara schede,
// esercizi e progressioni preservando stato, attivo, cartella e nome.

// 1. Helper esiste ed è chiamato da ENTRAMBI i blocchi (AO + IOD).
assert.match(mainJs, /function repairSeededProgramContent\(programs, seeded, stamp\)/);
assert.match(mainJs, /if \(!repairSeededProgramContent\(replacedPrograms, seeded, stamp\)\) replacedPrograms\.push\(replacement\);\s*\n\s*loaded\.programs = replacedPrograms;\s*\n\s*loaded\.meta = \{\s*\n\s*\.\.\.\(loaded\.meta \|\| \{\}\),\s*\n\s*intensitaNuovoBuild: INTENSITA_NUOVO_BUILD/);
assert.match(mainJs, /if \(!repairSeededProgramContent\(replacedPrograms, seeded, stamp\)\) replacedPrograms\.push\(replacement\);\s*\n\s*loaded\.programs = replacedPrograms;\s*\n\s*loaded\.meta = \{\s*\n\s*\.\.\.\(loaded\.meta \|\| \{\}\),\s*\n\s*intensitaOdBuild: INTENSITA_OD_BUILD/);

// 2. I vecchi guardi "salta se esiste" sono spariti.
assert.doesNotMatch(mainJs, /seededIds\.has\(program\.id\)/);

// 3. I cancelli sono RIARMATI con la stamp nuova (la riparazione parte su ogni
//    dispositivo al primo avvio di questa build).
assert.match(mainJs, /const INTENSITA_NUOVO_BUILD = "2026-10-09-riparazione-contenuto-workbook-v14811"/);
assert.match(mainJs, /const INTENSITA_OD_BUILD = "2026-10-09-riparazione-contenuto-workbook-v14811"/);

// 4. Verifica VIVA in VM: la copia vecchia del telefono viene riparata dal seed.
const vmLibs = await Promise.all(["exercise-library-19.8.js","master-exercise-library.js","app-config-v144.js","athlete-context.js","coach-ai-engine-2.js","knowledge-graph.js","decision-rules.js","decision-engine.js","coach-ai3-programming.js","coach-studio.js"].map((p) => fs.readFileSync(path.join(root, p), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const applicationScript = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + mainJs.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const storage = new Map();
const localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {} };
const document = { getElementById() { return element; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: element, documentElement: element, addEventListener() {} };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {}, location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null };
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(applicationScript, { filename: "v14811-riparazione.js" }).runInContext(context);

const out = vm.runInContext(`(() => {
  const esito = {};
  // seed reale AO dal codice corrente (stesso percorso di loadState)
  const seededAO = buildProgramsFromLegacy(PROGRAM_LIBRARY, []).map(consolidateLegacyWeeklyProgram).find((program) => program.phase === "Intensità Agosto-Ottobre");
  esito.seedEsiste = !!seededAO?.id;
  if (!esito.seedEsiste) return esito;
  // la copia "telefono": stesso id, numeri vecchi, stato attivo di Alice
  const telefono = [{ id: seededAO.id, phase: seededAO.phase, status: "active", active: true, nome: "Intensità Agosto-Ottobre", createdAt: "2026-07-01", sheets: [{ code: "C", name: "Scheda C", order: 0, exercises: [{ name: "Hip_Thrust", sets: "4", reps: "8+3+2", note: "vecchio" }] }] }];
  const stamp = new Date().toISOString();
  esito.riparata = repairSeededProgramContent(telefono, seededAO, stamp);
  const prog = telefono[0];
  const hip = (prog.sheets || []).flatMap((sheet) => sheet.exercises || []).find((exercise) => exercise.name === "Hip_Thrust");
  const seedHip = (seededAO.sheets || []).flatMap((sheet) => sheet.exercises || []).find((exercise) => exercise.name === "Hip_Thrust");
  esito.contenutoRiparato = String(hip?.sets) === String(seedHip?.sets) && String(hip?.reps) === String(seedHip?.reps);
  esito.vecchiNumeriSpariti = !(hip?.reps === "8+3+2");
  esito.statusPreso = prog.status === "active" && prog.active === true;
  esito.nomeECreazionePresi = prog.nome === "Intensità Agosto-Ottobre" && prog.createdAt === "2026-07-01";
  esito.stampAggiornato = prog.updatedAt === stamp;
  // se l'id NON esiste: la funzione non fa nulla (il blocco farà il push del seed)
  esito.idMancanteNonTocca = repairSeededProgramContent([], seededAO, stamp) === false;
  return esito;
})()`, context);

assert.equal(out.seedEsiste, true, "il seed AO deve esistere con un id");
assert.equal(out.riparata, true, "la copia vecchia deve essere riparata");
assert.equal(out.contenutoRiparato, true, "i contenuti devono tornare al workbook");
assert.equal(out.vecchiNumeriSpariti, true, "i numeri di luglio devono sparire");
assert.equal(out.statusPreso, true, "stato e attivo di Alice restano");
assert.equal(out.nomeECreazionePresi, true, "nome e creazione restano");
assert.equal(out.stampAggiornato, true, "il timestamp avanza (così il cloud propaga la riparazione)");
assert.equal(out.idMancanteNonTocca, true, "id mancante: nessun tocco (il push lo fa il blocco)");

console.log(JSON.stringify({ ok: true, v: "v148.11", riparazione: "contenuto seed su copie esistenti" }));
