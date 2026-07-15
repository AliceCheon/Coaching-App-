import fs from "node:fs/promises";
import vm from "node:vm";

const htmlUrl = new URL("../index.html", import.meta.url);
const html = await fs.readFile(htmlUrl, "utf8");
const scriptStart = html.lastIndexOf("<script>") + "<script>".length;
const scriptEnd = html.lastIndexOf("</script>");
const applicationScript = html
  .slice(scriptStart, scriptEnd)
  .replace(/\s+initFirebase\(\);\s+render\(\);\s*$/, "");

const storage = new Map();
const localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};
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
  console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp,
  Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {},
  location: { protocol: "file:", origin: "null" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
  Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; },
  addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(applicationScript, { filename: "atlas-app.js" }).runInContext(context);

const testResult = vm.runInContext(`(() => {
  const assertions = [];
  const check = (name, condition) => {
    assertions.push({ name, passed: !!condition });
    if (!condition) throw new Error("Test fallito: " + name);
  };

  state = clone(baseState);
  state.programs = [];
  state.training.sessions = [];
  state.training.phaseFilter = "Test Unlimited";

  const program = programRepository.createProgram({
    id: "program-unlimited-test", name: "Programma senza limiti", phase: "Test Unlimited", durationWeeks: 30, sheets: []
  }, { save: false });
  check("creazione programma", program.ok);

  for (let index = 0; index < 30; index += 1) {
    const created = programRepository.createSheet(program.value.id, { name: "Scheda " + (index + 1) }, { save: false });
    check("creazione scheda " + (index + 1), created.ok);
  }

  let sheets = programRepository.getSheets(program.value.id);
  check("30 schede nello stesso programma", sheets.length === 30);
  check("ID scheda univoci", new Set(sheets.map((sheet) => sheet.id)).size === 30);
  check("codici dinamici oltre Z", sheets[0].code === "A" && sheets[25].code === "Z" && sheets[26].code === "AA" && sheets[29].code === "AD");
  check("ordine iniziale", sheets.every((sheet, index) => sheet.order === index));

  const renamed = programRepository.updateSheet(program.value.id, sheets[29].id, {
    code: "GLUTE-DIVA", name: "Glutei personalizzata"
  }, { save: false });
  check("codice modificabile", renamed.ok && renamed.value.code === "GLUTE-DIVA");

  const exercise = programRepository.createExercise(program.value.id, sheets[0].id, {
    name: "Military", prescription: { sets: 3, reps: { type: "fixed", value: 10 }, rir: { min: 2, max: 2 }, rest: { seconds: 120 } }
  }, { save: false });
  check("creazione esercizio", exercise.ok);

  const duplicate = programRepository.duplicateSheet(program.value.id, sheets[0].id, { save: false });
  check("duplicazione scheda", duplicate.ok && duplicate.value.id !== sheets[0].id);
  check("duplicazione profonda esercizi", duplicate.value.exercises[0].id !== exercise.value.id);

  sheets = programRepository.getSheets(program.value.id);
  const reversedIds = sheets.slice().reverse().map((sheet) => sheet.id);
  const reordered = programRepository.reorderSheets(program.value.id, reversedIds, { save: false });
  check("riordinamento", reordered.ok && programRepository.getSheets(program.value.id)[0].id === reversedIds[0]);

  const deletedId = programRepository.getSheets(program.value.id)[5].id;
  const deleted = programRepository.deleteSheet(program.value.id, deletedId, { immediate: true, cloud: false });
  check("eliminazione", deleted.ok && !programRepository.getSheetById(program.value.id, deletedId));
  check("tombstone conservata", !!programRepository.getSheetById(program.value.id, deletedId, { includeDeleted: true })?.deletedAt);

  const beforeReload = programRepository.getSheets(program.value.id).map(({ id, code, order }) => ({ id, code, order }));
  const persisted = JSON.parse(localStorage.getItem(STORE_KEY));
  check("salvataggio", persisted.programs.find((item) => item.id === program.value.id).sheets.length === 31);

  state = loadState();
  const reopened = programRepository.getSheets(program.value.id);
  check("riapertura", reopened.length === beforeReload.length && reopened.every((sheet) =>
    beforeReload.some((saved) => saved.id === sheet.id && saved.code === sheet.code && saved.order === sheet.order)
  ));
  check("assenza sovrascritture", new Set(programRepository.getSheets(program.value.id, { includeDeleted: true }).map((sheet) => sheet.id)).size === 31);

  const rendered = trainingHtml();
  check("rendering con molte schede", typeof rendered === "string" && rendered.includes("GLUTE-DIVA") && rendered.length > 1000);
  check("modello valido", programRepository.validate().valid);

  return { assertions, activeSheets: reopened.length, storedSheets: programRepository.getSheets(program.value.id, { includeDeleted: true }).length };
})()`, context);

console.log(JSON.stringify({ ok: true, ...testResult }, null, 2));
