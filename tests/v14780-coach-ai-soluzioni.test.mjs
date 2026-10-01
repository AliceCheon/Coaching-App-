import fs from "node:fs/promises";
import vm from "node:vm";

// v147.80 · Tre lamentele reali di Alice, verificate qui:
//  1. una soluzione GIÀ APPLICATA non deve tornare identica ("mi ripropone la
//     stessa soluzione") → passa in "In verifica" finché non arrivano sedute nuove;
//  2. serve un comando "Ignora"/"Ripristina" sulle soluzioni (prima non c'era);
//  3. "prestazioni in calo" solo perché faceva meno ripetizioni avendo ALZATO il
//     carico (stacco rumeno) → carico su + rep giù = "shift" (stimolo diverso),
//     non una regressione.

// ---------------------------------------------------------------- motore trend
await import("../coach-ai-engine-2.js");
await import("../decision-rules.js");
const engine = globalThis.BarbellDivaCoachAI2;
const rules = globalThis.BarbellDivaDecisionRules;
if (!engine || !rules) throw new Error("Motori non caricati");

const point = (load, reps) => [{ load, reps, sets: 3, volume: load * reps * 3, date: "2026-01-01" }].map((base, index) => ({ ...base, e1rm: Number((load * (1 + Math.min(reps, 15) / 30)).toFixed(1)), date: `2026-01-0${index + 1}` }));

// Carico che sale (100→104) e ripetizioni che scendono (12→6): la stima di forza
// scende 4 volte di fila e prima diventava "regression"/"declining".
const intensityShift = engine.exerciseTrend([...point(100, 12), ...point(101, 10), ...point(102, 9), ...point(103, 7), ...point(104, 6)]);
if (intensityShift.status !== "shift") throw new Error(`Carico su e rep giù deve essere "shift", trovato "${intensityShift.status}"`);
if (!/cambio di stimolo/i.test(intensityShift.reason)) throw new Error("La spiegazione deve parlare di cambio di stimolo");
if (intensityShift.loadPct <= 0 || intensityShift.repsPct >= 0) throw new Error("Servono loadPct/repsPct per mostrare i numeri reali");

// Miglioramento vero (carico E ripetizioni su) deve restare "improving".
const realImprovement = engine.exerciseTrend([...point(100, 8), ...point(102, 8), ...point(104, 9), ...point(106, 9), ...point(108, 10)]);
if (realImprovement.status !== "improving") throw new Error(`Miglioramento reale letto come "${realImprovement.status}"`);

// Calo vero (carico giù) deve restare un calo: la nuova regola non lo nasconde.
const realDecline = engine.exerciseTrend([...point(100, 10), ...point(98, 9), ...point(95, 8), ...point(92, 7)]);
if (!["regression", "declining"].includes(realDecline.status)) throw new Error(`Calo reale letto come "${realDecline.status}"`);

// Il regolamento non deve più generare la decisione "carico in calo" per uno shift.
const stalledRule = rules.RULES.find((rule) => rule.id === "performance.stalled-progression");
if (!stalledRule) throw new Error("Regola performance.stalled-progression mancante");
const diagnose = (status) => stalledRule.evaluate({ analysis: { metrics: { exerciseAnalyses: [{ id: "e1", name: "Stacco rumeno", variantLabel: "Stacco rumeno", sheetId: "s1", trend: { status, sedute: 5, schede: 1, changePct: -10, confidence: "alta", reason: "test" }, progression: { status: "slowed", reason: "test" } }] } } });
if (diagnose("shift").length) throw new Error("Uno shift non deve produrre la decisione 'carico in calo'");
if (!diagnose("declining").length) throw new Error("Un calo reale deve continuare a produrre la decisione");

// ------------------------------------------------- app: stato delle soluzioni
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

const scenario = (sessions, ignorePreferences = {}) => vm.runInContext(`(() => {
  state.coachAi3 = { version: "test", history: [{ id: "h1", programId: "p1", status: "accepted", acceptedAt: "2026-09-20T10:00:00.000Z", changes: [{ sheetId: "s1", exerciseId: "e1", exercise: "Lento avanti", sheet: "Scheda A", week: 3, fields: [{ label: "Recupero", before: "180 sec", after: "210 sec" }] }] }], ignorePreferences: ${JSON.stringify(ignorePreferences)}, ignoreHistory: [], resolvedPreferences: {} };
  state.training = { ...(state.training || {}), sessions: ${JSON.stringify(sessions)} };
  const model = { proposals: [{ id: "proposal-x", programId: "p1", title: "Lento avanti: fermo, serve una progressione", target: "e1", priority: "alta", reason: "test", dataUsed: [], rules: [], options: [{ id: "conservative", label: "Conservativa", description: "test", pros: [], cons: [], operations: [{ type: "update-exercise", sheetId: "s1", exerciseId: "e1", changes: { prescription: { rest: { seconds: 210 } } } }] }] }] };
  const filtered = coachAi3FilterProposals(model, "p1");
  const html = coachAiProposalCardsHtml(filtered);
  return JSON.stringify({ status: filtered.proposals[0].state.status, pending: filtered.proposals[0].state.pendingSessions ?? null, key: filtered.proposals[0].state.key, verifying: html.includes("In verifica"), ignore: html.includes("data-ai3-ignore-proposal"), restore: html.includes("data-ai3-restore-proposal"), simula: html.includes("Simula questa soluzione") });
})()`, context);

const fresh = JSON.parse(scenario([{ id: "old", dateInput: "2026-09-18" }]));
if (fresh.status !== "verifying") throw new Error(`Dopo l'applicazione la soluzione deve andare "in verifica", trovato "${fresh.status}"`);
if (fresh.pending !== 2) throw new Error(`Devono mancare 2 sedute di verifica, trovate ${fresh.pending}`);
if (!fresh.verifying || !fresh.ignore) throw new Error("La card 'In verifica' deve spiegarsi e offrire Ignora");
if (fresh.simula) throw new Error("Una soluzione già applicata non deve riproporre 'Simula questa soluzione'");

// Dopo 2 sedute nuove la proposta torna normale (ora il confronto ha senso).
const retested = JSON.parse(scenario([{ id: "old", dateInput: "2026-09-18" }, { id: "n1", dateInput: "2026-09-22" }, { id: "n2", dateInput: "2026-09-25" }]));
if (retested.status !== "active" || !retested.simula) throw new Error("Con due sedute nuove la soluzione deve tornare simulabile");

// Se l'utente ignora, la soluzione sparisce e compare "Ripristina".
const ignored = JSON.parse(scenario([{ id: "old", dateInput: "2026-09-18" }], { "variant:p1|s1|e1": { mode: "variant", exerciseId: "e1", sheetId: "s1" } }));
if (ignored.status !== "ignored" || !ignored.restore) throw new Error("Ignorata: deve sparire dalle soluzioni e offrire Ripristina");
if (ignored.key !== "variant:p1|s1|e1") throw new Error(`Chiave di ignore inattesa: ${ignored.key}`);

// Anche il rilievo nel tab "Problemi prioritari" deve sparire dopo l'applicazione.
const remaining = JSON.parse(vm.runInContext(`(() => {
  state.coachAi3 = { version: "test", history: [{ id: "h1", programId: "p1", status: "accepted", acceptedAt: "2026-09-20T10:00:00.000Z", changes: [{ sheetId: "s1", exerciseId: "e1", exercise: "Lento avanti", fields: [{ label: "Recupero", before: "180 sec", after: "210 sec" }] }] }], ignorePreferences: {}, ignoreHistory: [], resolvedPreferences: {} };
  state.training = { ...(state.training || {}), sessions: [{ id: "old", dateInput: "2026-09-18" }] };
  const result = { knowledgeFingerprint: "fp", insights: [{ id: "insight-lento", programId: "p1", exerciseId: "e1", title: "Lento avanti: fermo" }], decisions: [] };
  coachAiApplyIgnorePreferences(result);
  return JSON.stringify(result.insights.map((item) => item.id));
})()`, context));
if (remaining.length) throw new Error(`Il problema già risolto non deve tornare subito: ${remaining.join(", ")}`);

// La card dei problemi prioritari deve avere un "Ignora" visibile (non solo nel menu).
if (!appMain.includes("data-ai-ignore-quick")) throw new Error("Manca il pulsante Ignora visibile sulle card dei problemi");
if (!appMain.includes("function coachAiForgetSolution")) throw new Error("Manca il ripristino delle soluzioni ignorate");

console.log("v147.80 soluzioni: verifica, ignora/ripristina e stimolo diverso OK");
