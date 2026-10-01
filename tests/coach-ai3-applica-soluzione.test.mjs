import fs from "node:fs/promises";
import vm from "node:vm";

// v147.79 · Applicare una soluzione da Coach AI deve cambiare DAVVERO la scheda.
//
// Sintomo (Alice, 1 ott 2026): nella scheda premo Coach AI, simulavo "Conservativa"
// (recupero 180 -> 210) e confermavo con "Conferma e applica", ma tornando alla
// scheda il recupero restava 180.
//
// Causa: l'editor e il workout leggono la prescrizione della SETTIMANA
// (`coachWeekPrescription` -> `week.restSeconds`), mentre la patch di Coach AI
// scriveva solo la prescrizione BASE dell'esercizio. La base cambiava, la settimana
// no, quindi la modifica sembrava non applicata.
//
// Qui si verifica che la propagazione avvenga SOLO dove la settimana eredita la base
// e che una settimana personalizzata a mano non venga toccata.

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

vm.runInContext(`{
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

  const created = programRepository.createProgram({
    id: "p-rest", name: "Rest Test", status: "active", durationWeeks: 3,
    sheets: [{ id: "s-rest", code: "C", name: "Scheda C", order: 0, week: 1, exercises: [{
      id: "e-rest", name: "Lento_avanti_machine", order: 0, muscle: "Spalle",
      prescription: { sets: 3, reps: "12-8", rest: { seconds: 180 }, rir: "1-2" },
      progression: { weeks: [
        { week: 1, weekNumber: 1, sets: 3, reps: "12-8", rir: { min: 1, max: 2, label: "1-2" }, rest: { seconds: 180 }, restSeconds: 180 },
        { week: 2, weekNumber: 2, sets: 4, reps: "12-8", rir: { min: 1, max: 2, label: "1-2" }, rest: { seconds: 300 }, restSeconds: 300 }
      ] }
    }] }]
  }, { immediate: true });
  assert(created.ok, "il programma di prova deve essere creato");

  const program = programRepository.getProgramById("p-rest");
  const exercise = programRepository.getExerciseById("p-rest", "s-rest", "e-rest");
  const beforeView = coachWeekPrescription(exercise, 1);
  assert(Number(beforeView.restSeconds) === 180, "l'editor parte dal recupero della settimana 1 (180)");

  // La stessa operazione che genera il pulsante "Conservativa" di Coach AI.
  const patched = BarbellDivaCoachAI3.applyPatch(program, [{
    type: "update-exercise", sheetId: "s-rest", exerciseId: "e-rest",
    changes: { prescription: { ...exercise.prescription, rest: { seconds: 210 }, rir: "2-3" } }
  }]);
  const patchedAfter = coachAi3ExerciseAt(patched.after, { sheetId: "s-rest", exerciseId: "e-rest" });
  assert(Number(coachAi3RestSeconds(patchedAfter.prescription.rest)) === 210, "l'anteprima mostra il nuovo recupero in base (210)");

  const applied = programRepository.updateProgram("p-rest", { sheets: patched.after.sheets }, { immediate: true });
  assert(applied.ok, "l'applicazione deve superare la validazione del programma");

  const saved = programRepository.getExerciseById("p-rest", "s-rest", "e-rest");
  assert(Number(saved.prescription.rest.seconds) === 210, "la prescrizione BASE salvata è 210");
  assert(Number(saved.progression.weeks[0].restSeconds) === 210, "la settimana 1 (eredita la base) passa a 210");
  assert(Number(saved.progression.weeks[1].restSeconds) === 300, "la settimana 2 personalizzata a mano resta 300");

  const afterView = coachWeekPrescription(saved, 1);
  assert(Number(afterView.restSeconds) === 210, "ora l'editor mostra 210 in settimana 1");
  assert(String(afterView.rir) === "2-3", "anche il RIR passa a 2-3 dove la settimana lo ereditava");
  assert(Number(coachWeekPrescription(saved, 2).restSeconds) === 300, "in settimana 2 l'editor mostra ancora 300");

  // Prova diretta: la riga dell'editor (quella che Alice guarda) mostra il nuovo valore.
  const program2 = programRepository.getProgramById("p-rest"), sheet2 = programRepository.getSheetById("p-rest", "s-rest");
  const row = coachInlineExerciseRowHtml(program2, sheet2, saved, 0, 1, "D");
  const restInput = row.slice(row.indexOf('data-inline-exercise-field="restSeconds"'));
  assert(restInput.slice(0, restInput.indexOf(">")).includes('value="210"'), "la cella REC dell'editor mostra 210, non 180");
}`, context);

// L'anteprima di applicazione riporta la riga modificata: il CSS deve essere leggibile
// (senza lo stile, "RecuperoPrima180 sec→Dopo210 sec" si incolla su una riga sola).
const css = await fs.readFile(new URL("../coach-studio.css", import.meta.url), "utf8");
if (!css.includes(".ai3-change-line{")) throw new Error("Manca lo stile .ai3-change-line: l'anteprima torna illeggibile");
if (!css.includes(".ai3-procon{")) throw new Error("Manca lo stile .ai3-procon: Vantaggi/Attenzioni si incollano");
if (!css.includes(".ai3-options{")) throw new Error("Manca lo stile .ai3-options: le 3 soluzioni non sono separabili");
if (!css.includes(".ai3-sheet-preview{")) throw new Error("Manca lo stile .ai3-sheet-preview: l'anteprima scheda si incolla");
if (!css.includes(".ai2-score-card{")) throw new Error("Manca lo stile .ai2-score-card: la card punteggio del pannello si incolla");
if (!css.includes(".ai2-exercise-table{")) throw new Error("Manca lo stile .ai2-exercise-table: la tabella esercizi si incolla");
if (!css.includes(".ai-workspace-section{")) throw new Error("Le sezioni Coach AI usano .ai-workspace-section ma non è stilizzata");
if (css.includes(".coach-ai-workspace-section{")) throw new Error("Prefisso .coach-ai-workspace-* obsoleto: non corrisponde all'HTML");

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8") + await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
if (!html.includes('class="ai-workspace-section"')) throw new Error("L'HTML deve usare .ai-workspace-section");
if (!html.includes('class="ai3-change-line"')) throw new Error("L'anteprima deve usare .ai3-change-line");

console.log("coach-ai3 applica soluzione: ok");
