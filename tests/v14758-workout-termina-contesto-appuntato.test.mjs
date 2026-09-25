// v147.58 — "Termina workout" deve validare i dati che la UI sta mostrando.
//
// Regressione: un workout lasciato "in corso" ieri mostra le sue serie (la UI
// usa il contesto APPUNTATO all'activeWorkout: data/scheda/settimana originali),
// ma `saveWorkoutSession()` ricalcolava il contesto con `currentTrainingContext()`
// (data = oggi, scheda dedotta dallo storico). Le bozze delle serie sono salvate
// con chiave `data|scheda|esercizio`: cambiando la data la lookup falliva e il
// salvataggio non trovava piu' alcuna serie, mostrando "Inserisci almeno un
// carico o una nota" pur essendoci serie visibili e persistite.
import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const workoutFlow = await fs.readFile(new URL("../workout-flow-v147.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js", "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js", "coach-ai3-programming.js", "coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "") + "\n;\n" + workoutFlow;

const storage = new Map();
const localStorage = { getItem: (k) => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k), clear: () => storage.clear() };
const element = { addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, innerHTML: "", textContent: "", disabled: false };
const document = { getElementById() { return { ...element }; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {} };
const context = {
  console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp,
  Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {},
  location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
  Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; },
  addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null
};
context.window = context;
context.globalThis = context;
context.sourceHtml = html + appMain + workoutFlow;
vm.createContext(context);
new vm.Script(script, { filename: "atlas-app.js" }).runInContext(context);

const result = await vm.runInContext(`(async () => {
  const toasts = [];
  renderTrainingOnly = () => {};
  showToast = (message) => { toasts.push(String(message)); };

  const codesInPhase = () => allProgramSheets()
    .filter((sheet) => sheet.phase === "Intensificazione")
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((sheet) => sheet.code);
  const codes = codesInPhase();
  const codeA = codes[0];        // scheda del workout in corso
  const codeB = codes[1] || codes[0];

  // Stato: un workout "in corso" avviato IERI (data diversa da oggi), con serie
  // reali gia' inserite e persistite con la data del workout.
  const yesterday = "2026-09-24";
  state.training.contextMode = "auto";
  state.training.sessionName = "auto";
  state.training.phaseFilter = "Intensificazione";
  state.training.date = yesterday; // come al momento dell'avvio
  const startedContext = currentTrainingContext();
  const sheet = sessionsForPhase("Intensificazione").find((item) => item.code === codeA) || startedContext.session;
  state.training.activeWorkout = {
    version: "147.1",
    id: "workout-test",
    status: "active",
    date: yesterday,
    phase: "Intensificazione",
    week: Number(startedContext.week) || 1,
    sessionCode: sheet.code,
    sessionId: sheet.id || "",
    currentExercise: 0,
    currentSet: 0,
    outlineOpen: false,
    startedAt: yesterday + "T18:00:00.000Z",
    updatedAt: yesterday + "T18:30:00.000Z",
    logs: {}
  };
  const exercises = sheet.exercises || [];
  const first = exercises[0];

  // La UI usa il contesto appuntato: data/scheda/settimana del workout in corso.
  // Replichiamo lo stesso oggetto che costruisce pinnedContext() nel modulo v147.
  const prescribe = (exercise, week) => exercisePrescriptionForTrainingWeek(exercise, week);
  const pinnedSheet = { ...sheet, week: state.training.activeWorkout.week, exercises: exercises.map((exercise) => prescribe(exercise, state.training.activeWorkout.week)) };
  const uiContext = {
    ...startedContext,
    date: state.training.activeWorkout.date,
    week: state.training.activeWorkout.week,
    session: pinnedSheet,
    pinnedToActive: true
  };

  // Una serie reale, confermata, salvata con la chiave della DATA del workout
  // (che e' esattamente cio' che fa ensureExerciseLog in workout-flow-v147.js).
  const count = setCountFor(first);
  const key = state.training.activeWorkout.date + "|" + sheet.code + "|" + first.name;
  state.training.activeWorkout.logs = state.training.activeWorkout.logs || {};
  state.training.activeWorkout.logs["0:" + normalizeExerciseName(first.name)] = {
    kg: Array.from({ length: count }, (_, i) => (i === 0 ? "40" : "")),
    reps: Array.from({ length: count }, (_, i) => (i === 0 ? "10" : "")),
    rpe: Array.from({ length: count }, () => ""),
    rir: Array.from({ length: count }, () => "")
  };
  state.training.draft[key] = ["40"];
  state.training.setDone[key + "|set-1|done"] = true;

  const uiSets = draftSetsFor(uiContext, first).filter((value) => String(value || "").trim());

  // ...ma si apre l'app il giorno dopo: lo stato "oggi" viene reimpostato.
  state.training.date = "2026-09-25";
  state.training.sessionName = "auto";

  const recalculated = currentTrainingContext();
  const recalculatedExercise = recalculated.session?.exercises?.[0];
  const recalculatedSets = recalculatedExercise
    ? draftSetsFor(recalculated, recalculatedExercise).filter((value) => String(value || "").trim())
    : [];

  toasts.length = 0;
  const saved = await saveWorkoutSession();
  const rejectedByValidation = toasts.some((message) => message.includes("Inserisci almeno un carico o una nota"));

  return {
    codeA,
    codeB,
    uiDate: uiContext.date,
    uiCode: uiContext.session?.code,
    recalculatedDate: recalculated.date,
    recalculatedCode: recalculated.session?.code,
    uiSets: uiSets.length,
    recalculatedSets: recalculatedSets.length,
    sameDraftKey: draftKey(uiContext, first) === draftKey(recalculated, first),
    saved,
    rejectedByValidation,
    toasts: [...toasts]
  };
})()`, context);

console.log(JSON.stringify(result, null, 2));

const failures = [];
if (result.uiSets < 1) failures.push("l'anteprima non mostra la serie inserita");
if (!result.saved) failures.push("il salvataggio del workout in corso e' stato rifiutato");
if (result.rejectedByValidation) failures.push("e' comparso l'errore 'Inserisci almeno un carico o una nota' con serie visibili");

if (failures.length) {
  console.error("REGRESSIONE:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("OK: il workout in corso viene salvato usando il contesto appuntato.");
