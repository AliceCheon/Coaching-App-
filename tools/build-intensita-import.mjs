import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourceXlsx = "C:/Users/AliceClemente/OneDrive/PALESTRA/Schede mie.xlsx";
const sourceState = "C:/Users/AliceClemente/Downloads/barbell-diva-recupero-2026-07-30.json";
const output = "C:/Users/AliceClemente/Documents/Codex/2026-07-30/cody-ho-un-problema-enorme-ieri/outputs/barbell-diva-import-intensita-agosto-ottobre-excel-2026-07-30.json";

const clone = (value) => JSON.parse(JSON.stringify(value));
const slug = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const text = (value) => String(value ?? "").trim();
const num = (value) => {
  const n = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
};
const nums = (value) => (text(value).match(/\d+(?:[.,]\d+)?/g) || []).map((item) => Number(item.replace(",", "."))).filter(Number.isFinite);
const id = (kind, value, index) => `${kind}-excel-intensita-${slug(value) || "row"}-${index}`;

function parseReps(value) {
  const label = text(value);
  const values = nums(label);
  const ordered = values.length > 1 ? [Math.min(...values), Math.max(...values)] : values;
  return { min: ordered[0] ?? null, max: ordered[1] ?? ordered[0] ?? null, sequence: values.length > 2 ? values : [], label };
}

function parseRir(value) {
  const label = text(value);
  if (!label.startsWith("@")) return { min: null, max: null, label: "" };
  const values = nums(label);
  return { min: values[0] ?? null, max: values[1] ?? values[0] ?? null, label };
}

function parseRest(value) {
  const label = text(value);
  const result = { seconds: null, minSeconds: null, maxSeconds: null, label };
  if (!label) return result;
  const range = label.match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*['’]/);
  if (range) {
    result.minSeconds = Math.round(Number(range[1].replace(",", ".")) * 60);
    result.maxSeconds = Math.round(Number(range[2].replace(",", ".")) * 60);
    return result;
  }
  const minuteSeconds = label.match(/(\d+)[,.](\d{1,2})\s*[']{1,2}/);
  if (minuteSeconds) {
    result.seconds = Number(minuteSeconds[1]) * 60 + Number(minuteSeconds[2].padEnd(2, "0").slice(0, 2));
    return result;
  }
  const minutes = label.match(/(\d+(?:[.,]\d+)?)\s*[']?/);
  if (minutes && /['’]|min|\d-\d/.test(label)) result.seconds = Math.round(Number(minutes[1].replace(",", ".")) * 60);
  return result;
}

function parseTempo(value) {
  const label = text(value);
  return { phases: [], label, valid: true };
}

function makeWeek(row, weekNumber, sheetCode, exerciseIndex) {
  const offset = 9 + (weekNumber - 1) * 3;
  const setsRaw = text(row[offset]);
  const repsRaw = text(row[offset + 1]);
  const rirRaw = text(row[offset + 2]);
  if (!setsRaw && !repsRaw && !rirRaw) return null;
  const sets = num(setsRaw);
  const reps = parseReps(repsRaw);
  const rir = parseRir(rirRaw);
  const legacy = [setsRaw, repsRaw, rirRaw].filter(Boolean).join(" | ");
  return {
    sets, reps, rir, rest: parseRest(row[7]), tempo: parseTempo(row[6]), type: "normal", legacyLabel: legacy,
    id: `week-${sheetCode}-${exerciseIndex}-${weekNumber}-${slug(legacy) || "planned"}`,
    week: weekNumber, weekNumber, rpe: { min: null, max: null, label: "" }, restSeconds: parseRest(row[7]).seconds,
    prescribedLoad: { value: null, unit: "kg", min: null, max: null, label: "" }, loadUnit: "kg",
    technique: { type: "normal", description: "", groupId: "" }, notes: rirRaw && !rirRaw.startsWith("@") ? rirRaw : "", note: "",
    status: "planned", source: "excel"
  };
}

function makeExercise(row, sheetCode, exerciseIndex, templateByName) {
  const name = text(row[3]);
  if (!name) return null;
  const existing = templateByName.get(slug(name));
  const weeks = [];
  for (let week = 1; week <= 8; week += 1) {
    const item = makeWeek(row, week, sheetCode, exerciseIndex);
    if (item) weeks.push(item);
  }
  const base = weeks[0] || makeWeek([null, null, null, name, row[4], row[5], row[6], row[7], row[8], 1, "", ""], 1, sheetCode, exerciseIndex);
  const rest = parseRest(row[7]);
  const warmupLabel = text(row[8]);
  const warmupValues = nums(warmupLabel);
  const metadata = {
    ...(existing?.metadata || {}), custom: !existing, note2: text(row[5]), excelTarget: text(row[1]), excelSource: "Schede mie.xlsx · Intensità",
    masterExerciseId: existing?.masterExerciseId || `excel-${slug(name)}`,
    technicalProfileId: existing?.masterExerciseId || `excel-${slug(name)}`
  };
  return {
    ...(existing ? clone(existing) : {}), name, muscle: text(row[1]) || "Custom", som: text(row[1]) || "Custom",
    note: text(row[4]), today: "", ref: "", id: id("exercise", `${sheetCode}-${name}`, exerciseIndex), order: exerciseIndex,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: "", masterExerciseId: metadata.masterExerciseId,
    prescription: {
      ...(existing?.prescription || {}), sets: base.sets, reps: base.reps, rir: base.rir, rest, rpe: { min: null, max: null, label: "" },
      warmup: { sets: warmupValues[0] ?? null, label: warmupLabel }, tempo: parseTempo(row[6]), technique: { type: "normal", description: "", groupId: "" },
      prescribedLoad: { value: null, min: null, max: null, unit: "kg", label: "" }
    },
    progression: { templateId: "", rule: null, weeks, manualWeeks: weeks.map((item) => item.weekNumber), archivedWeeks: [] },
    metadata,
    biomechanics: existing?.biomechanics || { confidence: "low", sourceVersion: "excel-import", reviewedAt: "", reviewedBy: "", missingFields: [] }
  };
}

function makeSheet(rows, start, end, sheetCode, templateSheet, templateByName) {
  const title = text(rows[start][2]) || `Scheda ${sheetCode}`;
  const exercises = [];
  for (let index = start + 2; index < end; index += 1) {
    const exercise = makeExercise(rows[index], sheetCode, exercises.length, templateByName);
    if (exercise) exercises.push(exercise);
  }
  const muscles = [...new Set(exercises.map((item) => item.muscle).filter(Boolean))];
  return {
    ...(templateSheet ? clone(templateSheet) : {}), id: id("sheet", sheetCode, 0), code: sheetCode, day: sheetCode.charCodeAt(0) - 64, letter: sheetCode,
    name: title, focus: muscles.join(", "), note: `Importata da Schede mie.xlsx · Intensità agosto-ottobre · Scheda ${sheetCode}`,
    source: "excel-import", order: sheetCode.charCodeAt(0) - 65, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    deletedAt: "", durationWeeks: 8, color: "", exercises
  };
}

const state = JSON.parse(await fs.readFile(sourceState, "utf8"));
const input = await FileBlob.load(sourceXlsx);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Intensità agosto ottobre");
const values = sheet.getRange("A1:AH97").values;
const boundaries = [
  { code: "A", start: 22, end: 39 },
  { code: "B", start: 39, end: 58 },
  { code: "C", start: 58, end: 84 },
  { code: "D", start: 84, end: 97 }
];
const templateProgram = clone(state.programs.find((program) => /Intensit/.test(program.name || "")) || state.programs[0]);
const templateSheet = templateProgram?.sheets?.[0] || {};
const templateByName = new Map();
for (const program of state.programs || []) for (const currentSheet of program.sheets || []) for (const exercise of currentSheet.exercises || []) templateByName.set(slug(exercise.name), exercise);

const now = new Date().toISOString();
const newProgram = {
  ...templateProgram,
  id: "program-excel-intensita-20260730",
  name: "Intensità agosto-ottobre · Excel 30 luglio 2026",
  phase: "Intensità",
  status: "draft",
  source: "excel-import",
  startDate: "",
  durationWeeks: 8,
  periodization: { phase: "Intensità agosto-ottobre", source: "Schede mie.xlsx" },
  createdAt: now,
  updatedAt: now,
  deletedAt: "",
  archivedSheets: [],
  folder: "Import Excel"
};
newProgram.sheets = boundaries.map(({ code, start, end }) => makeSheet(values, start, end, code, templateSheet, templateByName));
newProgram.sheets.forEach((item) => { item.id = id("sheet", item.code, item.order); item.exercises.forEach((exercise, index) => { exercise.id = id("exercise", `${item.code}-${exercise.name}`, index); }); });
newProgram.sheets.forEach((item) => item.exercises.forEach((exercise) => { exercise.metadata.excelSource = "Schede mie.xlsx - Intensita agosto ottobre"; }));

const payload = clone(state);
payload.programs = [...(payload.programs || []), newProgram];
payload.meta = { ...(payload.meta || {}), updatedAt: now, programsUpdatedAt: now, schemaVersion: 10, version: 73, excelImportAt: now, excelImportSource: "Schede mie.xlsx · Intensità" };
payload.meta.excelImportSource = "Schede mie.xlsx - Intensita agosto ottobre";
const metadata = {
  id: `backup-excel-import-${Date.now()}`, type: "manual", createdAt: now, appBuild: "v147.1", dataSchemaVersion: 10, backupSchemaVersion: 1,
  summary: { programs: payload.programs.length, workouts: payload.training?.sessions?.length || 0, checkins: 0, checkinsLabel: "", customExercises: 0, personalRecords: 0 }
};
function checksum(value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) { hash ^= raw.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
const envelope = { format: "barbell-diva-backup", metadata: { ...metadata, checksum: checksum({ metadata: { ...metadata, checksum: undefined }, payload }) }, payload };
await fs.writeFile(output, JSON.stringify(envelope, null, 2), "utf8");
console.log(JSON.stringify({ output, program:newProgram.name, sheets:newProgram.sheets.map((item) => ({ code:item.code, exercises:item.exercises.length, first:item.exercises[0]?.name || "" })), checksum:envelope.metadata.checksum }, null, 2));
