import fs from "node:fs/promises";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

// v147.75 · Coach AI ancorato al PROGRAMMA ATTIVO + una sola card per esercizio
// 1) la scelta del programma segue lo status "active" (con override dal menu);
// 2) lo stesso esercizio presente in più schede non produce più card duplicate.

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

// --- Parte 1: il motore deduplica le osservazioni per identità esercizio ---
await import(pathToFileURL(path.join(root, "coach-ai-engine-2.js")).href);
const ai2 = globalThis.BarbellDivaCoachAI2;

const program = {
  id: "p1",
  name: "Test",
  sheets: [
    { id: "s1", name: "Scheda A", exercises: [{ id: "e1", name: "Slanci_cavo_basso", sets: 3, reps: "10" }] },
    { id: "s2", name: "Scheda B", exercises: [{ id: "e2", name: "Slanci_cavo_basso", sets: 3, reps: "10" }] },
  ],
};
const sessions = ["2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22"].map((date, index) => ({
  id: `w${index}`,
  dateInput: date,
  programId: "p1",
  sheetId: index % 2 ? "s2" : "s1",
  exercises: [{ name: "Slanci_cavo_basso", completedSets: [{ kg: 40 + index * 2, reps: 10, rir: 2 }] }],
}));

const analysis = ai2.analyze({ program, sessions, context: {}, masterLibrary: { records: [] } });
if (analysis.metrics.exercisesRaw.length !== 2) throw new Error("Le righe esercizio per-scheda devono restare 2 (volume per scheda)");
if (analysis.metrics.exerciseAnalyses.length !== 1) throw new Error("Lo stesso esercizio in 2 schede deve produrre UNA sola analisi (dedup per identità)");
if (analysis.metrics.weeklySets !== 6) throw new Error("Il volume settimanale deve restare sommato per scheda (3+3=6)");
const exerciseInsights = (analysis.insights || []).filter((item) => item.category === "exercise-performance");
if (exerciseInsights.length !== 1) throw new Error("Lo stesso esercizio in 2 schede deve produrre UNA sola card, non " + exerciseInsights.length);

// --- Parte 2: la scelta del programma segue l'attivo (harness VM) ---
const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js", "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js", "coach-ai3-programming.js", "coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now(){return Date.now()}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const storage = new Map();
const localStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) };
const drawing = new Proxy({}, { get() { return () => {}; }, set() { return true; } });
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, replaceChildren() {}, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, getBoundingClientRect() { return { width: 320, height: 180 }; }, getContext() { return drawing; }, innerHTML: "", textContent: "", width: 320, height: 180 };
const document = { getElementById() { return { ...element }; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {} };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, localStorage, sessionStorage: localStorage, document, navigator: { onLine: true }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout(fn, ms) { return globalThis.setTimeout(fn, Math.min(Number(ms) || 0, 20)); }, clearTimeout(id) { globalThis.clearTimeout(id); }, requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; }, addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: true }; }, window: null, globalThis: null };
context.window = context; context.globalThis = context;
vm.createContext(context);
new vm.Script(script).runInContext(context);

const results = vm.runInContext(`{
  const results = [];
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); results.push(msg); };
  state.programs = [
    { id: "p-active", name: "Intensificazione", status: "active", durationWeeks: 8, sheets: [{ id: "sh1", name: "Scheda A", week: 1, exercises: [{ id: "ex1", name: "Lat machine", sets: 4, reps: "10" }] }] },
    { id: "p-other", name: "B program 1", status: "available", sheets: [] }
  ];
  state.coachAi3 = { ...(state.coachAi3 || {}), selectedProgramId: "p-other", followActiveProgram: true };

  assert(coachAiActiveProgramId() === "p-active", "il programma attivo è quello con status 'active'");
  assert(coachAiSelectedProgramId() === "p-active", "di default Coach AI segue il programma attivo (non l'ultima selezione)");
  assert(coachAiSelectedProgramId("p-other") === "p-other", "una scelta esplicita dal menu viene rispettata nel momento del cambio");

  state.coachAi3.followActiveProgram = false;
  assert(coachAiSelectedProgramId() === "p-other", "dopo il cambio dal menu resta la selezione memorizzata");
  assert(coachAiFollowsActiveProgram() === false, "il flag di inseguimento è spento dopo il cambio manuale");

  state.coachAi3.followActiveProgram = true;
  assert(coachAiSelectedProgramId() === "p-active", "riattivando 'Segui attivo' torna il programma attivo");

  const pageHtml = coachAiWorkspaceHtml(false);
  assert(typeof pageHtml === "string" && pageHtml.includes('data-ai-tab="overview"'), "la pagina Coach AI ha le schede (tab)");
  assert(pageHtml.includes('data-ai-panel="review"') && pageHtml.includes('data-ai-panel="solutions"'), "le sezioni sono raggruppate in pannelli");
  assert(pageHtml.includes('data-ai-active="overview"'), "la scheda attiva di default è la Panoramica");
  assert(pageHtml.includes('data-ai-panel="chat"') && pageHtml.includes("data-ai-chat-form"), "c'è la scheda Chat con il composer");

  state.training = state.training || {};
  state.training.sessions = [{ id: "w-old", dateInput: "2026-07-01", programId: "p-active", sheetId: "sh1", exercises: [{ name: "Push Up", completedSets: [{ kg: 0, reps: 10 }] }] }];

  const chat = coachAiChatState();
  assert(Array.isArray(chat) && chat.length >= 1 && chat[0].role === "bot", "la chat parte con il saluto di Diva Bot");
  const answer = coachAiChatAnswer("perché ho stagnato?");
  assert(answer && typeof answer.text === "string" && answer.text.length > 10, "Diva Bot risponde con testo vero");
  const summary = coachAiChatAnswer("come sto messa?");
  assert(summary.text.includes("/100"), "la risposta di riepilogo cita il punteggio reale");
  const aboutRemoved = coachAiChatAnswer("perché non faccio più i push up?");
  assert(aboutRemoved.text.includes("NON è nel programma attivo"), "la chat riconosce un esercizio tolto dal programma (niente risposte bloccate)");
  const aboutProgram = coachAiChatAnswer("come sta la lat machine?");
  assert(aboutProgram.text.includes("è nel programma attivo"), "la chat colloca l'esercizio nel programma attivo");
  const fallback = coachAiChatAnswer("blablabla cose a caso");
  assert(fallback.text.includes("Non sono sicura"), "una domanda incomprensibile chiede chiarimenti invece di ripetere la stessa priorità");

  results;
}`, context);

console.log("v14775-programma-attivo: " + (results.length + 4) + " verifiche passate");
for (const item of results) console.log("  ✓ " + item);
