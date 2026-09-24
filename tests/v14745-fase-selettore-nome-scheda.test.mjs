// v147.51 — Selettore "Scheda" (sheet-first) e Fase derivata (bug "peaking").
// Storia: in "Workout del giorno → Modalità Manuale" l'elenco Fase mostrava solo
// program.phase, quindi una scheda con nome diverso dalla fase (es. fase
// "peaking" per il programma "Intensità 2 ottobre-dicembre") restava
// irriconoscibile, e "peaking" compariva accanto al nome.
// Soluzione: la SCHEDA è la fonte della scelta (raggruppata per programma, con
// l'id come valore perché i codici A/B si ripetono tra i programmi) e la FASE è
// un valore derivato dalla scheda scelta: niente più doppia etichetta.
// Qui si verifica anche che i programmi eliminati e le fasi vuote non entrino
// più nell'elenco delle fasi disponibili.
import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const workoutFlow = await fs.readFile(new URL("../workout-flow-v147.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js","master-exercise-library.js","app-config-v144.js","athlete-context.js","coach-ai-engine-2.js","knowledge-graph.js","decision-rules.js","decision-engine.js","coach-ai3-programming.js","coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");

const storage = new Map();
const localStorage = { getItem: (k) => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k), clear: () => storage.clear() };
const element = {
  addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {},
  classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, contentWindow: { postMessage() {} }
};
const document = {
  getElementById() { return element; }, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { ...element }; }, body: element, documentElement: element, addEventListener() {}
};
const context = {
  console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp,
  Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {},
  location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
  Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; },
  addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null
};
context.window = context;
context.globalThis = context;
context.sourceHtml = html + appMain + workoutFlow;
vm.createContext(context);
new vm.Script(script, { filename: "atlas-app.js" }).runInContext(context);

const testResult = vm.runInContext(`(() => {
  const assertions = [];
  const check = (name, condition) => { assertions.push({ name, passed: !!condition }); if (!condition) throw new Error("Test fallito: " + name); };

  state = clone(baseState);
  state.programs = [
    { id: "p-peaking", name: "Intensità 2 ottobre-dicembre", phase: "peaking", status: "active", source: "custom", sheets: [
      { id: "sh-peak-a", code: "A", name: "Scheda A", week: 1, order: 0, exercises: [] },
      { id: "sh-peak-b", code: "B", name: "Scheda B", week: 1, order: 1, exercises: [] }
    ] },
    { id: "p-b1", name: "B program 1", phase: "B program 1", status: "available", sheets: [
      { id: "sh-b1-a", code: "A", name: "Scheda A", week: 1, order: 0, exercises: [] }
    ] },
    { id: "p-plan", name: "Programma con piano", phase: "Blocco pianificato", status: "active", durationWeeks: 4, periodization: { weeks: { 1: "volume", 2: "volume", 3: "accumulo", 4: "deload" } }, sheets: [
      { id: "sh-plan-a", code: "A", name: "Scheda A", week: 1, order: 0, exercises: [] }
    ] },
    { id: "p-types", name: "Programma con tipi settimana", phase: "Blocco tipi", status: "active", sheets: [
      { id: "sh-types-a", code: "A", name: "Scheda A", week: 1, order: 0, exercises: [
        { id: "ex-1", name: "Hip Thrust", progression: { weeks: [
          { weekNumber: 1, type: "intensification" },
          { weekNumber: 2, type: "accumulation" },
          { weekNumber: 3, type: "deload" }
        ] } }
      ] }
    ] },
    { id: "p-infer", name: "Programma strutturato", phase: "Blocco strutturato", status: "active", durationWeeks: 8, sheets: [
      { id: "sh-infer-a", code: "A", name: "Scheda A", week: 1, order: 0, exercises: [
        { id: "ex-a", name: "Hip Thrust", sets: "3", reps: "15", progression: { weeks: [
          { weekNumber: 1, sets: "4", reps: "12" },
          { weekNumber: 2, sets: "4", reps: "12" },
          { weekNumber: 3, sets: "4", reps: "10" },
          { weekNumber: 4, sets: "1", reps: "Test 10 RM" },
          { weekNumber: 5, sets: "4", reps: "10" },
          { weekNumber: 6, sets: "3", reps: "10" },
          { weekNumber: 7, sets: "3", reps: "8" },
          { weekNumber: 8, sets: "1", reps: "Test 8 RM" }
        ] } },
        { id: "ex-b", name: "Leg Curl", sets: "3", reps: "12", progression: { weeks: [
          { weekNumber: 1, sets: "4", reps: "12" },
          { weekNumber: 2, sets: "4", reps: "12" },
          { weekNumber: 3, sets: "4", reps: "10" },
          { weekNumber: 4, sets: "2", reps: "10" },
          { weekNumber: 5, sets: "4", reps: "10" },
          { weekNumber: 6, sets: "3", reps: "10" },
          { weekNumber: 7, sets: "3", reps: "8" },
          { weekNumber: 8, sets: "2", reps: "8" }
        ] } }
      ] }
    ] },
    { id: "p-deleted", name: "Scheda eliminata", phase: "fase fantasma", deletedAt: "2026-09-22T10:00:00.000Z", sheets: [
      { id: "sh-del-a", code: "A", name: "Scheda fantasma", week: 1, order: 0, exercises: [] }
    ] },
    { id: "p-empty", name: "Senza fase", phase: "", sheets: [] }
  ];

  const phases = availablePhases();
  check("fase della scheda presente nell'elenco", phases.includes("peaking"));
  check("programma eliminato escluso dall'elenco", phases.indexOf("fase fantasma") < 0);

  check("etichetta con nome scheda", phaseSelectorLabel("peaking") === "peaking · Intensità 2 ottobre-dicembre");
  check("nessuna duplicazione quando fase uguale al nome", phaseSelectorLabel("B program 1") === "B program 1");
  check("fase senza programma resta invariata", phaseSelectorLabel("inesistente") === "inesistente");
  check("fase vuota senza etichetta sporca", phaseSelectorLabel("") === "");
  check("nomi programma collegati alla fase", JSON.stringify(phaseProgramNames("peaking")) === JSON.stringify(["Intensità 2 ottobre-dicembre"]));
  check("programma eliminato non contribuisce al nome", phaseProgramNames("fase fantasma").length === 0);

  // Program-first con Fase CALCOLATA dai dati del programma (mai un dropdown).
  // L'utente sceglie Modalità, Programma, Scheda, Settimana; la Fase deriva dalla
  // struttura del programma (piano settimanale, tipo settimana esercizi, blocco).
  const groups = programSheetGroups();
  check("schede raggruppate per programma", groups.length === 5 && groups.slice(0, 2).map((g) => g.label).join("|") === "Intensità 2 ottobre-dicembre|B program 1");
  check("programma eliminato escluso dai gruppi", groups.every((g) => g.id !== "p-deleted"));
  check("le schede del gruppo portano la fase del programma", groups[0].sheets.every((s) => s.phase === "peaking"));
  check("valore opzione = id scheda", groups[0].sheets[0].id === "sh-peak-a");

  check("programmi selezionabili escludono i vuoti/eliminati", availablePrograms().map((p) => p.id).join("|") === "p-b1|p-peaking|p-plan|p-types|p-infer");
  check("schede del programma filtrate per programma", programSheetsFor(programById("p-peaking")).map((s) => s.id).join("|") === "sh-peak-a|sh-peak-b");

  // La Fase viene dai dati del programma, non da una regola generica.
  const pPlan = programById("p-plan");
  check("piano settimanale letto dai dati del programma", JSON.stringify(programWeekPlan(pPlan)) === JSON.stringify({ 1: "volume", 2: "volume", 3: "accumulo", 4: "deload" }));
  check("fase settimana 4 dal piano = deload (non regola generica)", derivedPhaseForWeek(pPlan, 4) === "Deload");
  check("fase settimana 3 dal piano = accumulo", derivedPhaseForWeek(pPlan, 3) === "Accumulo");
  check("settimane deload ricavate dal piano esplicito", Object.entries(pPlan.periodization.weeks).filter(([, v]) => v === "deload").map(([k]) => k).join("|") === "4");
  // v147.52 · Il type del singolo esercizio NON determina più la Fase: la fase
  // viene solo dalla mappatura del programma o, in mancanza, dall'inferenza
  // strutturale marcata come "stimata".
  const pTypes = programById("p-types");
  check("tipo esercizio non determina più la fase del programma", derivedPhaseForWeek(pTypes, 2, programSheetsFor(pTypes)[0]) !== "Accumulo");
  check("type esercizio deload non diventa fase del programma", derivedPhaseForWeek(pTypes, 3, programSheetsFor(pTypes)[0]) !== "Deload");
  check("type esercizio a fine blocco non diventa peaking", derivedPhaseForWeek(pTypes, 3, programSheetsFor(pTypes)[0]) !== "Peaking");
  check("senza mappatura né struttura resta l'etichetta del programma", derivedPhaseForWeek(pTypes, 2, programSheetsFor(pTypes)[0]) === "Blocco tipi");
  // Un programma che dichiara un tipo di blocco canonico lo usa come fase.
  check("tipo blocco canonico usato come fase", derivedPhaseForWeek(programById("p-peaking"), 1) === "Peaking");
  // Un programma senza dati di fase mostra la propria etichetta, non una fase inventata.
  check("programma senza struttura: etichetta programma", derivedPhaseForWeek(programById("p-b1"), 5) === "B program 1");
  check("nessuna regola generica 'settimana 4 = deload' senza dati", derivedPhaseForWeek(programById("p-b1"), 4) === "B program 1");

  // Programma senza periodizzazione dichiarata ma con struttura: la fase viene
  // inferita dai suoi dati (settimane di test di carico, volume programmato).
  const pInfer = programById("p-infer");
  const inferred = inferredWeekPlan(pInfer);
  check("piano inferito dalla struttura del programma", [1, 2, 3, 4, 5, 6, 7, 8].map((w) => inferred[w]).join("|") === "volume|volume|volume|deload|volume|accumulo|accumulo|peaking");
  check("settimana di test a inizio blocco = deload", derivedPhaseForWeek(pInfer, 4) === "Deload");
  check("settimana di test a fine programma = peaking", derivedPhaseForWeek(pInfer, 8) === "Peaking");
  check("settimana ad alto volume = volume", derivedPhaseForWeek(pInfer, 1) === "Volume");
  check("volume ridotto = accumulo", derivedPhaseForWeek(pInfer, 7) === "Accumulo");
  check("origine fase segnalata come struttura stimata", phaseFromProgramData(pInfer, null, 8).source === "struttura del programma (stimata)");
  check("inferenza marcata come stimata", phaseFromProgramData(pInfer, null, 8).estimated === true);
  check("mappatura esplicita non marcata come stimata", phaseFromProgramData(pPlan, 1).estimated === false);
  // Un test di calibrazione dentro una settimana a volume PIENO non è uno scarico
  // (caso reale: "test 12RM" in settimana 1 di un programma a volume alto).
  state.programs.push({ id: "p-calib", name: "Calibrazione", phase: "Blocco", status: "active", durationWeeks: 4, sheets: [
    { id: "sh-calib-a", code: "A", name: "Scheda A", week: 1, order: 0, exercises: [
      { id: "ex-cal-a", name: "Pendulum", sets: "3", reps: "10", progression: { weeks: [
        { weekNumber: 1, sets: "3", reps: "test 12rm" }, { weekNumber: 2, sets: "4", reps: "10" }, { weekNumber: 3, sets: "4", reps: "10" }, { weekNumber: 4, sets: "4", reps: "10" }
      ] } },
      { id: "ex-cal-b", name: "Leg Curl", sets: "3", reps: "10", progression: { weeks: [
        { weekNumber: 1, sets: "4", reps: "10" }, { weekNumber: 2, sets: "4", reps: "10" }, { weekNumber: 3, sets: "4", reps: "10" }, { weekNumber: 4, sets: "4", reps: "10" }
      ] } }
    ] }
  ] });
  check("test di calibrazione a volume pieno non diventa deload", derivedPhaseForWeek(programById("p-calib"), 1, programSheetsFor(programById("p-calib"))[0]) !== "Deload");
  state.programs = state.programs.filter((program) => program.id !== "p-calib");
  // Il piano dichiarato vince su quello inferito.
  check("piano dichiarato prevale sull'inferito", derivedPhaseForWeek(programById("p-plan"), 1) === "Volume");

  // Editor di periodizzazione nel modal Programma: mostra i select settimana→fase
  // e, per i programmi che non la dichiarano, propone quella inferita dalla struttura.
  coachProgramUi.modal = "program-edit";
  coachProgramUi.programId = "p-infer";
  coachModalRenderingPortal = true;
  const modalHtml = coachUiModalHtml();
  coachModalRenderingPortal = false;
  check("editor periodizzazione nel modal programma", modalHtml.includes('data-program-week-phase="4"'));
  check("periodizzazione proposta per programma senza piano", modalHtml.includes('value="peaking" selected'));
  check("settimana 4 proposta come deload", modalHtml.includes('value="deload" selected'));
  check("modal spiega che la Fase deriva dalla periodizzazione", modalHtml.includes("La Fase del programma è definita qui"));

  // Un piano dichiarato dal programma viene pre-selezionato nel modal, così il
  // salvataggio non riparte da zero.
  coachProgramUi.modal = "program-edit";
  coachProgramUi.programId = "p-plan";
  coachModalRenderingPortal = true;
  const modalPlanHtml = coachUiModalHtml();
  coachModalRenderingPortal = false;
  check("piano dichiarato pre-selezionato nel modal", modalPlanHtml.includes('data-program-week-phase="4"') && modalPlanHtml.includes('value="deload" selected'));
  check("etichetta fase non è un selettore di periodizzazione", /id="programModalPhase"[^>]*value="Blocco pianificato"/.test(modalPlanHtml));

  // Round-trip: la periodizzazione salvata dal modal viene poi usata come fonte
  // della fase (stessa pipeline del salvataggio reale).
  programRepository.updateProgram("p-b1", { periodization: { weeks: { 1: "accumulo", 2: "deload" } } }, { immediate: true });
  check("piano salvato diventa fonte della fase", derivedPhaseForWeek(programById("p-b1"), 2) === "Deload");
  check("piano salvato non tocca le settimane non dichiarate", derivedPhaseForWeek(programById("p-b1"), 5) === "B program 1");

  const manualContext = { isManual: true, phase: "Deload", week: 4, date: "02/10/2026", session: { id: "sh-plan-a", code: "A", name: "Scheda A" }, program: programById("p-plan"), phaseSource: "pianificazione", contextWarning: "", phaseSessions: sessionsForPhase("peaking") };
  const controls = trainingContextControlsHtml(manualContext);
  check("selettore Programma presente", controls.includes('data-training-context="program"'));
  check("selettore Scheda presente nel contesto allenamento", controls.includes('data-training-context="session"'));
  check("scheda selezionata usa l'id", controls.includes('value="sh-plan-a"') && controls.includes("selected"));
  check("opzioni scheda mostrano solo il nome", controls.includes(">Scheda A<") && !controls.includes("A · Scheda A"));
  check("Fase è un valore derivato, non un selettore", controls.includes('data-training-context-derived="phase"') && !controls.includes('data-training-context="phase"'));
  check("Fase calcolata mostra il deload dal piano", controls.includes('data-training-context-derived="phase">Deload<'));
  check("nessuna etichetta sporca 'peaking · ...' nella card", !controls.includes("peaking · Intensità"));
  const orderMode = controls.indexOf(">Modalità");
  const orderProgram = controls.indexOf(">Programma");
  const orderPhase = controls.indexOf(">Fase");
  const orderSheet = controls.indexOf(">Scheda");
  const orderWeek = controls.indexOf(">Settimana<");
  check("ordine campi Modalità → Programma → Scheda → Settimana → Fase", orderMode > -1 && orderProgram > orderMode && orderSheet > orderProgram && orderWeek > orderSheet && orderPhase > orderWeek);
  check("nessuna dicitura di origine sotto la Fase", !controls.includes("mappatura del programma") && !controls.includes("stimata dalla") && !controls.includes("dalla struttura del programma"));

  // La Fase normalizza le varianti al vocabolario dei blocchi (volume/accumulo/
  // intensificazione/peaking...) ma lascia intatti i nomi liberi.
  check("fase canonica minuscola → titolo", phaseDisplayLabel("volume") === "Volume");
  check("fase con prefisso numerico → canonica", phaseDisplayLabel("2.Intensificazione") === "Intensificazione");
  check("fase canonica composta riconosciuta", phaseDisplayLabel("adattamento anatomico") === "Adattamento Anatomico");
  check("fase libera lasciata invariata", phaseDisplayLabel("Intensità Agosto-Ottobre") === "Intensità Agosto-Ottobre");
  check("fase vuota senza etichetta sporca", phaseDisplayLabel("") === "");

  // In automatico la fase resta quella attiva e la scheda segue data/settimana.
  const autoControls = trainingContextControlsHtml({ isManual: false, phase: "B program 1", week: 1, date: "02/10/2026", session: { id: "sh-b1-a", code: "A", name: "Scheda A" }, contextWarning: "", phaseSessions: sessionsForPhase("B program 1") });
  check("in automatico il selettore scheda è disabilitato", autoControls.includes('data-training-context="session" disabled'));
  check("in automatico il selettore programma è disabilitato", autoControls.includes('data-training-context="program" disabled'));
  check("in automatico la fase è quella attiva", autoControls.includes('data-training-context-derived="phase">B program 1<'));

  return { assertions, phases };
})()`, context);

if (!workoutFlow.includes('data-training-context="session"')) throw new Error("workout-flow-v147.js: manca il selettore Scheda");
if (!workoutFlow.includes('data-training-context="program"')) throw new Error("workout-flow-v147.js: manca il selettore Programma");
if (!workoutFlow.includes('data-training-context-derived="phase"')) throw new Error("workout-flow-v147.js: la Fase non è un valore derivato");
if (!appMain.includes("programSheetGroups")) throw new Error("app-main.js: manca programSheetGroups");
if (!appMain.includes("resolveManualSession")) throw new Error("app-main.js: manca resolveManualSession");
if (!appMain.includes("derivedPhaseForWeek")) throw new Error("app-main.js: manca la derivazione della Fase da programma + settimana");
if (!appMain.includes("availablePrograms")) throw new Error("app-main.js: manca l'elenco dei programmi selezionabili");

console.log(JSON.stringify({ ok: true, ...testResult }, null, 2));
