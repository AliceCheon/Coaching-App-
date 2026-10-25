import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.21 · IN MANUALE LA FASE SCELTA PORTA LE SCHEDE GIUSTE ---
// Alice: "oggi dovrei iniziare la scheda nuova (Intensità ottobre-dicembre), ma nel
// workout quando la metto come programma escono gli esercizi della scheda vecchia
// (Intensità Agosto-Ottobre)". Causa: currentTrainingContext() prendeva le schede
// SEMPRE dal programma ESPLICITAMENTE attivo (v148.18 ha reso attivo l'ultimo
// allenato: agosto-ottobre) e la ricerca filtrava per activePhase: le lettere
// A/B/C/D esistono in entrambe le fasi, quindi la scheda VECCHIA si trovava sempre
// — in silenzio, senza contextWarning. In manuale la fase scelta da Alice (già
// sovrana per l'etichetta) deve guidare anche le SCHEDE: se esiste un programma non
// archiviato con quella fase, le schede vengono da lì. In AUTOMATICO non cambia
// nulla (il bacino resta il programma attivo: l'avanzamento E->F resta sorvegliato
// dai tre test storici). Questo test fallisce sulla v148.20.

const vmLibs = await Promise.all([
  "exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js",
  "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js",
  "coach-ai3-programming.js", "coach-studio.js", "plate-calculator.js"
].map((p) => fs.readFileSync(path.join(root, p), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const bootPart = mainJs.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const storage = new Map();
const ls = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k), key: (i) => Array.from(storage.keys())[i], get length() { return storage.size; } };
const drawing = new Proxy({}, { get(t, k) { if (k === "measureText") return () => ({ width: 10 }); return () => {}; }, set() { return true; } });
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, replaceChildren() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, getBoundingClientRect() { return { width: 320, height: 180 }; }, getContext() { return drawing; }, innerHTML: "", textContent: "", value: "", checked: false, hidden: false };
const documentFake = { getElementById() { return { ...element }; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {}, hidden: false, visibilityState: "visible" };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent,
  localStorage: ls, sessionStorage: ls, document: documentFake, navigator: { onLine: false }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} },
  URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, caches: { open: async () => ({ put: async () => {}, match: async () => undefined }) },
  setTimeout(fn, ms) { return globalThis.setTimeout(fn, Math.min(Number(ms) || 0, 10)); }, clearTimeout(id) { globalThis.clearTimeout(id); }, requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; },
  addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: true }; }, window: null, globalThis: null };
context.window = context; context.globalThis = context;
vm.createContext(context);
new vm.Script(vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart, { filename: "v14825.js" }).runInContext(context);

const esito = vm.runInContext(`(() => {
  const out = {};
  const scheda = (code, exName) => ({ id: "sheet-" + code, code, letter: code, order: code.charCodeAt(0) - 64, name: "Scheda " + code, exercises: [{ id: "ex-" + code, name: exName, prescription: { sets: 3, reps: "8" } }] });
  const programma = (id, phase, updatedAt, status, exName) => ({ id, name: phase, phase, status, updatedAt, sheets: [scheda("A", exName), scheda("B", exName)] });

  // Il mondo di Alice oggi: attivo = Agosto-Ottobre (l'ultimo allenato, reso attivo
  // da v148.18); la scheda NUOVA ottobre-dicembre è "available", non archiviata.
  state.programs = [
    programma("p-ao", "Intensità Agosto-Ottobre", "2026-10-12T00:00:00.000Z", "active", "Hip_Thrust_AO"),
    programma("p-iod", "Intensità ottobre-dicembre", "2026-10-12T01:00:00.000Z", "available", "Pendulum_IOD")
  ];
  state.profile.phaseStart = "2026-10-19"; state.profile.phaseLength = 12;
  state.training.date = todayInput();
  state.training.contextMode = "manual"; state.training.manualModeDate = todayInput();
  state.training.manualPhase = "Intensità ottobre-dicembre"; state.training.phaseFilter = "Intensità ottobre-dicembre";
  state.training.manualSessionCode = ""; state.training.manualWeek = 0; state.training.sessionName = "";
  state.training.sessions = [{ id: 1700000000001, source: "App", status: "completed", phase: "Intensità Agosto-Ottobre", dateInput: "2026-10-17", sessionCode: "B", week: 7, exercises: [] }];

  out.fase = effectiveTrainingPhase();
  // Alice sceglie SOLO la fase nuova nel workout (nessun codice)
  const soloFase = currentTrainingContext();
  out.faseSchedaSoloFase = soloFase.session ? soloFase.session.phase : null;
  out.esercizioSoloFase = soloFase.session && soloFase.session.exercises && soloFase.session.exercises[0] ? soloFase.session.exercises[0].name : null;

  // Alice sceglie anche la scheda (B) nella fase nuova
  state.training.manualSessionCode = "B"; state.training.sessionName = "B";
  const conScheda = currentTrainingContext();
  out.faseSchedaScelta = conScheda.session ? conScheda.session.phase : null;
  out.codiceSchedaScelta = conScheda.session ? conScheda.session.code : null;
  out.esercizioSchedaScelta = conScheda.session && conScheda.session.exercises && conScheda.session.exercises[0] ? conScheda.session.exercises[0].name : null;

  // un codice che non esiste nella fase nuova produce l'avviso (niente silenzio)
  state.training.manualSessionCode = "Z"; state.training.sessionName = "Z";
  const inesistente = currentTrainingContext();
  out.avvisoCodiceInesistente = inesistente.contextWarning || "";

  // AUTOMATICO INVARIATO: le schede restano quelle del programma attivo
  state.training.contextMode = "auto"; state.training.manualModeDate = "";
  state.training.manualPhase = ""; state.training.manualSessionCode = ""; state.training.sessionName = "auto";
  const automatico = currentTrainingContext();
  out.autoFase = automatico.phase;
  out.autoFaseScheda = automatico.session ? automatico.session.phase : null;
  out.autoEsercizio = automatico.session && automatico.session.exercises && automatico.session.exercises[0] ? automatico.session.exercises[0].name : null;

  // manuale sulla fase DEL programma attivo: tutto resta com'era
  state.training.contextMode = "manual"; state.training.manualModeDate = todayInput();
  state.training.manualPhase = "Intensità Agosto-Ottobre"; state.training.phaseFilter = "Intensità Agosto-Ottobre";
  state.training.manualSessionCode = "A"; state.training.sessionName = "A";
  const manualeStessaFase = currentTrainingContext();
  out.manualeStessaFaseScheda = manualeStessaFase.session ? manualeStessaFase.session.phase : null;
  out.manualeStessaFaseEsercizio = manualeStessaFase.session && manualeStessaFase.session.exercises && manualeStessaFase.session.exercises[0] ? manualeStessaFase.session.exercises[0].name : null;
  return out;
})()`, context);

assert.equal(esito.fase, "Intensità ottobre-dicembre", "l'etichetta della fase manuale è quella scelta (già così prima)");
assert.equal(esito.faseSchedaSoloFase, "Intensità ottobre-dicembre", "scegliendo SOLO la fase, le schede vengono dalla fase nuova (prima: agosto-ottobre)");
assert.equal(esito.esercizioSoloFase, "Pendulum_IOD", "gli esercizi sono quelli della scheda NUOVA (prima: Hip_Thrust_AO della vecchia)");
assert.equal(esito.faseSchedaScelta, "Intensità ottobre-dicembre", "con scheda scelta, la scheda viene dalla fase nuova");
assert.equal(esito.codiceSchedaScelta, "B", "il codice scelto da Alice è rispettato");
assert.equal(esito.esercizioSchedaScelta, "Pendulum_IOD", "gli esercizi della scheda scelta sono quelli NUOVI");
assert.ok(String(esito.avvisoCodiceInesistente).includes("Z"), "un codice assente nella fase nuova avvisa, senza mostrare la scheda vecchia in silenzio");
assert.equal(esito.autoFase, "Intensità Agosto-Ottobre", "in automatico la fase resta quella del programma attivo");
assert.equal(esito.autoFaseScheda, "Intensità Agosto-Ottobre", "in automatico le schede restano quelle del programma attivo (avanzamento E->F intatto)");
assert.equal(esito.autoEsercizio, "Hip_Thrust_AO", "in automatico gli esercizi restano quelli del programma attivo");
assert.equal(esito.manualeStessaFaseScheda, "Intensità Agosto-Ottobre", "manuale sulla fase del programma attivo: invariato");
assert.equal(esito.manualeStessaFaseEsercizio, "Hip_Thrust_AO", "manuale sulla fase del programma attivo: esercizi invariati");

// guardie statiche
assert.match(mainJs, /const manualProgram = isManual && activeProgram && phase && phase !== activePhase/);
assert.match(mainJs, /const contextPhase = manualProgram \? String\(manualProgram\.phase\|\|""\) : activePhase;/);

console.log(JSON.stringify({ ok: true, manuale: esito.faseSchedaSoloFase, esercizio: esito.esercizioSoloFase, auto: esito.autoFaseScheda }));
