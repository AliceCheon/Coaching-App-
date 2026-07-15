import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const start = html.lastIndexOf("<script>") + "<script>".length;
const end = html.lastIndexOf("</script>");
const applicationScript = html.slice(start, end).replace(/\s+initFirebase\(\);\s+render\(\);\s*$/, "");
const storage = new Map();
const localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};
const element = {
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {}, remove() {}, click() {},
  classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, contentWindow: { postMessage() {} }
};
const document = {
  getElementById() { return element; }, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { ...element }; }, body: element, documentElement: element, addEventListener() {}
};
const context = {
  console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp,
  Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {},
  location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
  Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; },
  addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(applicationScript, { filename: "atlas-phase3.js" }).runInContext(context);

const result = vm.runInContext(`(() => {
  state = clone(baseState);
  state.programs = [];
  state.training.sessions = [];
  state.profile.mode = "coach";
  coachProgramUi.programId = "";
  coachProgramUi.sheetId = "";
  coachProgramUi.drafts.clear();
  coachProgramUi.dirtySheets.clear();
  coachProgramUi.lastSheetByProgram.clear();
  const assertions = [];
  const check = (name, condition) => {
    assertions.push({ name, passed: !!condition });
    if (!condition) throw new Error("Test fallito: " + name);
  };

  const program = programRepository.createProgram({
    id: "phase3-program", name: "Programma UI", phase: "Volume", durationWeeks: 12, status: "draft", source: "custom", sheets: []
  }, { save: false });
  coachProgramUi.programId = program.value.id;
  check("programma senza schede", coachProgramManagerHtml().includes("Nessuna scheda in questo programma"));

  for (let index = 0; index < 31; index += 1) {
    const created = programRepository.createSheet(program.value.id, { name: "Scheda " + (index + 1) }, { save: false });
    check("creazione scheda " + (index + 1), created.ok);
  }
  let sheets = programRepository.getSheets(program.value.id);
  check("31 schede", sheets.length === 31);
  check("codici A-Z e AA-AE", sheets[0].code === "A" && sheets[25].code === "Z" && sheets[26].code === "AA" && sheets[30].code === "AE");

  coachProgramUi.sheetId = sheets[0].id;
  coachProgramUi.allSheetsOpen = true;
  const managerHtml = coachProgramManagerHtml();
  check("rendering 31 tab", managerHtml.split("data-sheet-tab-id=").length - 1 === 31);
  check("menu Tutte le schede", managerHtml.includes("allSheetsSearch") && managerHtml.split("data-sheet-search=").length - 1 === 31);

  const customCode = programRepository.updateSheet(program.value.id, sheets[30].id, { code: "DIVA-CUSTOM" }, { save: false });
  check("codice personalizzato", customCode.ok);
  check("duplicato nello stesso programma bloccato", !programRepository.createSheet(program.value.id, { code: "A", name: "Duplicata" }, { save: false }).ok);

  const secondProgram = programRepository.createProgram({ id: "phase3-second", name: "Secondo", phase: "Volume", durationWeeks: 8, sheets: [] }, { save: false });
  check("stesso codice in programmi diversi", programRepository.createSheet(secondProgram.value.id, { code: "A", name: "A secondo" }, { save: false }).ok);

  const exercise = programRepository.createExercise(program.value.id, sheets[0].id, {
    name: "Military", muscle: "Spalle", sets: 3, reps: "10",
    progression: { weeks: Array.from({ length: 10 }, (_, index) => ({ week: index + 1, sets: 3, reps: { min: 10, max: 10 }, rir: { min: 2, max: 2 }, rest: { seconds: 120 } })) }
  }, { save: false });
  check("esercizio creato", exercise.ok);
  const duplicate = programRepository.duplicateSheet(program.value.id, sheets[0].id, { save: false });
  check("duplicazione profonda", duplicate.ok && duplicate.value.id !== sheets[0].id && duplicate.value.exercises[0].id !== exercise.value.id);

  sheets = programRepository.getSheets(program.value.id);
  const ids = sheets.map((sheet) => sheet.id);
  const lastId = ids.pop();
  ids.unshift(lastId);
  check("riordinamento drag contract", programRepository.reorderSheets(program.value.id, ids, { save: false }).ok && programRepository.getSheets(program.value.id)[0].id === lastId);

  const first = programRepository.getSheetById(program.value.id, sheets[0].id);
  const second = programRepository.getSheetById(program.value.id, sheets[1].id);
  coachProgramUi.sheetId = first.id;
  let draft = activeCoachBuilder();
  draft.name = "Modifica A";
  markCoachDraftDirty();
  selectCoachSheet(second.id);
  draft = activeCoachBuilder();
  draft.name = "Modifica B";
  markCoachDraftDirty();
  selectCoachSheet(first.id);
  check("cambio rapido senza perdita", programRepository.getSheetById(program.value.id, first.id).name === "Modifica A" && programRepository.getSheetById(program.value.id, second.id).name === "Modifica B");

  draft = activeCoachBuilder();
  draft.name = "Solo intestazione";
  markCoachDraftDirty();
  commitActiveCoachDraft({ immediate: true, quiet: true });
  check("settimane oltre 8 preservate", programRepository.getExerciseById(program.value.id, first.id, exercise.value.id).progression.weeks.length === 10);

  coachProgramUi.sheetId = first.id;
  draft = activeCoachBuilder();
  const row = draft.rows.find((item) => item.id === exercise.value.id);
  row.weeks[0] = "4x8";
  markCoachDraftDirty(undefined, row.id);
  commitActiveCoachDraft({ immediate: true, quiet: true });
  const updatedExercise = programRepository.getExerciseById(program.value.id, first.id, exercise.value.id);
  check("editor collegato al repository", updatedExercise.progression.weeks[0].sets === 4 && updatedExercise.progression.weeks.length === 10);

  const copied = copySheetToProgram(program.value.id, first.id, secondProgram.value.id);
  check("copia in altro programma", copied.ok && copied.value.id !== first.id && copied.value.exercises[0].id !== exercise.value.id);
  const deleteId = programRepository.getSheets(program.value.id)[3].id;
  programRepository.deleteSheet(program.value.id, deleteId, { save: false });
  check("eliminazione con tombstone", !!programRepository.getSheetById(program.value.id, deleteId, { includeDeleted: true })?.deletedAt);

  saveState({ immediate: true, cloud: false });
  const beforeReload = programRepository.getSheets(program.value.id).map((sheet) => sheet.id).join("|");
  state = loadState();
  check("salvataggio e riapertura", programRepository.getSheets(program.value.id).map((sheet) => sheet.id).join("|") === beforeReload);
  check("sincronizzazione compatibile", validateProgramCollection(mergeCloudAndLocalState(state, clone(state)).programs).valid);
  check("interfaccia coach mobile abilitata", coachDesktopAllowed());
  check("modello valido", programRepository.validate().valid);
  return { assertions, programs: programRepository.getPrograms().length, sheets: programRepository.getSheets(program.value.id).length };
})()`, context);

console.log(JSON.stringify({ ok: true, ...result }, null, 2));
