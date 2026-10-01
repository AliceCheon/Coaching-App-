import fs from "node:fs/promises";
import vm from "node:vm";

// v147.81 · "Punti di forza" non deve mai essere una scheda VUOTA.
// Alice: "possibile che non ho manco un punto di forza in questa scheda??"
// La sezione veniva emessa solo se esistevano insight con severity "success",
// quindi con zero esercizi "in miglioramento" la scheda restava completamente
// bianca, senza nemmeno una spiegazione.

const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js", "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js", "coach-ai3-programming.js", "coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");

const storage = new Map();
const localStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) };
const generic = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, append() {}, remove() {}, insertAdjacentHTML() {}, children: [] };
const document = { getElementById() { return generic; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...generic }; }, body: { ...generic, contains: () => true }, documentElement: generic, addEventListener() {}, activeElement: null };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, localStorage, sessionStorage: localStorage, document, navigator: { onLine: true }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {}, window: null, globalThis: null };
context.window = context; context.globalThis = context;
vm.createContext(context);
new vm.Script(script).runInContext(context);

const strengths = (result) => JSON.parse(vm.runInContext(`JSON.stringify(coachAiStrengthItems(${JSON.stringify(result)}))`, context));

// Nessun miglioramento: solo regressioni → nessun punto di forza, ma la scheda
// deve comunque esistere con una spiegazione (guardia strutturale sotto).
const doomed = strengths({ insights: [], metrics: { exerciseAnalyses: [{ id: "e1", name: "Squat", variantLabel: "Squat", trend: { status: "declining", sedute: 4, loadPct: -5, repsPct: -10, firstLoad: 100, lastLoad: 95 } }] } });
if (doomed.length) throw new Error("Un calo reale non deve diventare un punto di forza");

// Carico in crescita (blocco di intensità): deve diventare un punto di forza.
const loadUp = strengths({ insights: [], metrics: { exerciseAnalyses: [{ id: "e1", name: "Lento avanti", variantLabel: "Lento avanti", trend: { status: "shift", sedute: 5, loadPct: 8, repsPct: -20, firstLoad: 50, lastLoad: 54, firstReps: 10, lastReps: 8 } }] } });
if (loadUp.length !== 1 || !/carico in crescita/i.test(loadUp[0].title)) throw new Error(`Carico +8% deve essere un punto di forza, trovato ${JSON.stringify(loadUp)}`);

// Ripetizioni in crescita a pari carico.
const repsUp = strengths({ insights: [], metrics: { exerciseAnalyses: [{ id: "e2", name: "Lat machine", variantLabel: "Lat machine", trend: { status: "stable", sedute: 4, loadPct: 0, repsPct: 12, firstReps: 8, lastReps: 9, lastLoad: 60 } }] } });
if (repsUp.length !== 1 || !/più ripetizioni a pari carico/i.test(repsUp[0].title)) throw new Error(`Rep +12% a pari carico deve essere un punto di forza, trovato ${JSON.stringify(repsUp)}`);

// Un insight "success" resta e non viene duplicato dal segnale numerico.
const both = strengths({ insights: [{ id: "i1", severity: "success", exerciseId: "e1", title: "Squat: stai migliorando", description: "ok" }], metrics: { exerciseAnalyses: [{ id: "e1", name: "Squat", variantLabel: "Squat", trend: { status: "improving", sedute: 5, loadPct: 9, firstLoad: 100, lastLoad: 109 } }] } });
if (both.length !== 1) throw new Error(`Nessuna duplicazione ammessa, trovati ${both.length} punti di forza`);

// La sezione deve esistere SEMPRE (niente scheda bianca) e avere l'empty state.
if (!appMain.includes('data-ai-panel="strengths"')) throw new Error('Manca il pannello "strengths"');
if (/positiveItems\.length\?`<section class="ai-workspace-section" id="ai-strengths"/.test(appMain)) throw new Error("La sezione Punti di forza torna a sparire quando è vuota (scheda bianca)");
if (!appMain.includes("Ancora nessun miglioramento dimostrabile")) throw new Error("Manca lo stato vuoto spiegato per i Punti di forza");

console.log("v147.81 punti di forza: segnali reali e mai scheda vuota OK");
