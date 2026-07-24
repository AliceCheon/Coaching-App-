/* Barbell Diva — Fase 20A Intelligent Programming Engine.
 * Modulo puro, deterministico e non mutante. Non applica modifiche ai programmi.
 */

export const PROGRAMMING_ENGINE_VERSION = "20A.1";

export const SUGGESTION_SCOPES = Object.freeze(["set", "exercise", "workout", "week", "program"]);
export const SUGGESTION_TYPES = Object.freeze([
  "increaseLoad", "decreaseLoad", "maintainLoad", "increaseReps", "decreaseReps",
  "increaseSets", "decreaseSets", "adjustRir", "adjustRpe", "increaseRest", "reduceRest",
  "repeatWeek", "progressWeek", "holdProgression", "deload", "maintenance",
  "substituteExercise", "reviewTechnique", "insufficientData", "reviewAnomaly",
  "maintainVolume", "redistributeVolume", "reduceOverlap", "unsupportedProgression"
]);
export const SUGGESTION_STATUSES = Object.freeze(["generated", "viewed", "accepted", "modified", "ignored", "expired", "applied", "reverted"]);

export const SUPPORTED_PROGRESSION_IDS = Object.freeze([
  "double-progression", "linear-load", "linear-reps", "linear-sets", "rir-progression",
  "top-set-backoff", "volume-progression", "intensity-progression", "undulating",
  "pyramid", "reverse-pyramid", "density", "recovery-decreasing", "maintenance", "deload"
]);
export const UNSUPPORTED_PROGRESSION_IDS = Object.freeze(["custom"]);

const NORMAL_SET_TYPES = new Set(["working", "normal"]);
const SPECIAL_SET_TYPES = new Set(["top-set", "back-off", "drop-set", "rest-pause", "myo-reps", "cluster", "cluster-set", "amrap", "partial", "partial-reps"]);
const VALID_UNITS = new Set(["kg", "lb", "%1RM", "bodyweight", "assistance", "added"]);
const VALID_DECISIONS = new Set(["accepted", "modified", "ignored", "reverted"]);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value) => value === null || value === undefined || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
const round = (value, digits = 4) => {
  if (!Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
};
const mean = (values) => {
  const list = values.map(finite).filter((value) => value !== null);
  return list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : null;
};
const median = (values) => {
  const list = values.map(finite).filter((value) => value !== null).sort((a, b) => a - b);
  if (!list.length) return null;
  const middle = Math.floor(list.length / 2);
  return list.length % 2 ? list[middle] : (list[middle - 1] + list[middle]) / 2;
};
const sum = (values) => values.map(finite).filter((value) => value !== null).reduce((total, value) => total + value, 0);
const deepClone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const normalizeText = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const compact = (values) => values.filter((value) => value !== undefined && value !== null && value !== "");

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

export function hashProgrammingData(value) {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `pe-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function deterministicTimestamp(input) {
  const values = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    for (const [key, item] of Object.entries(value)) {
      if (/^(dateInput|completedAt|updatedAt|createdAt|date)$/i.test(key)) {
        const stamp = Date.parse(item);
        if (Number.isFinite(stamp)) values.push(stamp);
      }
      if (item && typeof item === "object") visit(item);
    }
  };
  visit(input);
  return new Date(values.length ? Math.max(...values) : 0).toISOString();
}

function parseRange(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const sequence = Array.isArray(value.sequence) ? value.sequence.map(finite).filter((item) => item !== null) : [];
    const min = finite(value.min) ?? (sequence.length ? Math.min(...sequence) : null);
    const max = finite(value.max) ?? (sequence.length ? Math.max(...sequence) : min);
    return { min, max, sequence, label:String(value.label || "") };
  }
  const numbers = String(value ?? "").replace(/,/g, ".").match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  return { min:numbers.length ? Math.min(...numbers) : null, max:numbers.length ? Math.max(...numbers) : null, sequence:numbers, label:String(value ?? "") };
}

function parseRestSeconds(value) {
  if (value && typeof value === "object") return finite(value.seconds) ?? finite(value.minSeconds) ?? null;
  const text = String(value ?? "").toLowerCase();
  const minutes = text.match(/(\d+(?:[.,]\d+)?)\s*(?:min|')/);
  const seconds = text.match(/(\d+)\s*(?:sec|s|\"|'')/);
  if (minutes) return Math.round(Number(minutes[1].replace(",", ".")) * 60 + Number(seconds?.[1] || 0));
  return finite(text.match(/\d+/)?.[0]);
}

function normalizePrescription(source = {}) {
  const prescription = source.prescription || source.target || {};
  const prescribedLoad = prescription.prescribedLoad || prescription.load || source.prescribedLoad || source.targetLoad;
  const loadValue = prescribedLoad && typeof prescribedLoad === "object" ? finite(prescribedLoad.value) : finite(prescribedLoad);
  const unit = String(prescribedLoad?.unit || prescription.loadUnit || source.loadUnit || "kg");
  return {
    sets:finite(prescription.sets ?? source.sets),
    repRange:parseRange(prescription.reps ?? source.reps),
    rir:parseRange(prescription.rir ?? source.rir),
    rpe:parseRange(prescription.rpe ?? source.rpe),
    load:loadValue,
    loadUnit:VALID_UNITS.has(unit) ? unit : "kg",
    restSeconds:parseRestSeconds(prescription.rest ?? source.rest ?? prescription.restSeconds),
    technique:String(prescription.technique?.type || prescription.technique || source.technique || "normal"),
    progressionId:String(source.progression?.templateId || source.progressionTemplateId || source.metadata?.progressionTemplateId || "maintenance"),
    progression:deepClone(source.progression || null)
  };
}

function inferEquipment(exercise = {}) {
  const explicit = normalizeText(exercise.equipment || exercise.metadata?.equipment || "");
  if (explicit) return explicit;
  const text = normalizeText(exercise.name);
  if (/bilanc|barbell|stacco|squat/.test(text)) return "barbell";
  if (/manubr|dumbbell/.test(text)) return "dumbbell";
  if (/cavo|cable|pulley|lat machine/.test(text)) return "cable";
  if (/machine|macchin|pressa|pendulum|leg extension|leg curl/.test(text)) return "machine";
  if (/push up|trazion|dip|plank|corpo libero/.test(text)) return "bodyweight";
  return "unknown";
}

function inferVariant(exercise = {}) {
  return normalizeText(exercise.variant || exercise.metadata?.variant || exercise.originalExerciseName || exercise.name);
}

function setKind(raw = {}) {
  if (raw.kind === "warmup" || raw.warmup === true || raw.isWarmup === true) return "warmup";
  const technique = String(raw.intensityTechnique?.type || raw.technique?.type || raw.technique || raw.kind || "working").toLowerCase();
  if (SPECIAL_SET_TYPES.has(technique)) return technique === "cluster-set" ? "cluster" : technique === "partial-reps" ? "partial" : technique;
  return NORMAL_SET_TYPES.has(technique) ? "working" : "working";
}

function normalizeOneSet(raw = {}, context = {}) {
  const kind = setKind(raw);
  const load = finite(raw.load ?? raw.kg ?? raw.value);
  const reps = finite(raw.reps);
  const rir = finite(raw.rir);
  const rpe = finite(raw.rpe);
  const unit = String(raw.unit || raw.loadUnit || context.loadUnit || "kg");
  const status = raw.skipped ? "skipped" : raw.failed || raw.status === "failed" ? "failed" : raw.completed === false ? "incomplete" : String(raw.status || "completed");
  const analysisEligible = kind !== "warmup" && !["skipped", "failed", "incomplete"].includes(status) && !["drop-set", "rest-pause", "cluster", "myo-reps", "partial"].includes(kind) && raw.excludeFromAnalysis !== true;
  const netLoad = context.loadMode === "bodyweight" && finite(context.bodyWeight) !== null
    ? round(finite(context.bodyWeight) + (finite(raw.addedLoad) || 0) - (finite(raw.assistance) || 0))
    : null;
  return {
    id:String(raw.id || `${context.exerciseId || "exercise"}-set-${context.index || 0}`),
    index:finite(raw.index) ?? context.index ?? 0,
    kind,
    status,
    load,
    reps,
    rir,
    rpe,
    durationSeconds:finite(raw.durationSeconds ?? raw.duration),
    distance:finite(raw.distance),
    restSeconds:finite(raw.restSeconds ?? raw.actualRestSeconds),
    unit:VALID_UNITS.has(unit) ? unit : "kg",
    side:String(raw.side || context.side || "bilateral"),
    addedLoad:finite(raw.addedLoad),
    assistance:finite(raw.assistance),
    bodyWeight:finite(context.bodyWeight),
    netLoad,
    technique:deepClone(raw.intensityTechnique || raw.technique || null),
    analysisEligible,
    exclusionReasons:compact([
      kind === "warmup" ? "warmup" : null,
      ["drop-set", "rest-pause", "cluster", "myo-reps", "partial"].includes(kind) ? `specialSet:${kind}` : null,
      status !== "completed" ? status : null,
      raw.excludeFromAnalysis === true ? "explicitlyExcluded" : null
    ]),
    sourceRef:{ sessionId:context.sessionId || null, exerciseId:context.exerciseId || null, setId:raw.id || null },
    original:raw
  };
}

function buildPrescriptionIndex(programs = []) {
  const index = new Map();
  programs.forEach((program) => (program.sheets || program.workouts || []).forEach((workout) => (workout.exercises || []).forEach((exercise) => {
    const record = { program, workout, exercise, prescription:normalizePrescription(exercise) };
    compact([exercise.id, exercise.name, exercise.code]).forEach((key) => index.set(normalizeText(key), record));
  })));
  return index;
}

function normalizeExercise(raw = {}, session = {}, prescriptionIndex = new Map(), index = 0) {
  const sourceKey = normalizeText(raw.sourceExerciseId || raw.exerciseId || raw.originalName || raw.name);
  const matched = prescriptionIndex.get(sourceKey) || prescriptionIndex.get(normalizeText(raw.name)) || null;
  const prescription = normalizePrescription(matched?.exercise || raw);
  const completedSets = Array.isArray(raw.completedSets) ? raw.completedSets : Array.isArray(raw.sets) ? raw.sets : [];
  const legacyValues = !completedSets.length && Array.isArray(raw.setValues) ? raw.setValues : [];
  const baseSets = completedSets.length ? completedSets : legacyValues.map((value, setIndex) => ({ id:`legacy-${setIndex}`, kg:value, reps:parseRange(raw.reps).sequence[setIndex] ?? null, completed:true }));
  const warmups = Array.isArray(raw.warmupSets) ? raw.warmupSets.map((set, warmupIndex) => ({ ...set, kind:"warmup", index:warmupIndex })) : [];
  const exerciseId = String(raw.sourceExerciseId || raw.exerciseId || matched?.exercise?.id || raw.id || `exercise-${normalizeText(raw.name).replace(/\s/g, "-")}`);
  const loadMode = raw.loadMode || (inferEquipment(raw) === "bodyweight" ? "bodyweight" : raw.assistance != null ? "assistance" : raw.addedLoad != null ? "added" : "external");
  const context = { sessionId:session.id, exerciseId, loadUnit:prescription.loadUnit, side:raw.side, bodyWeight:session.weight ?? raw.bodyWeight, loadMode };
  const sets = [...warmups, ...baseSets].map((set, setIndex) => normalizeOneSet(set, { ...context, index:setIndex }));
  const intensitySegments = sets.flatMap((set) => (set.technique?.segments || []).map((segment, segmentIndex) => normalizeOneSet({ ...segment, id:`${set.id}-segment-${segmentIndex}`, kind:set.kind, excludeFromAnalysis:true }, { ...context, index:segmentIndex })));
  return {
    id:exerciseId,
    sessionId:String(session.id || ""),
    programId:String(session.programId || matched?.program?.id || ""),
    workoutId:String(session.sheetId || session.workoutId || matched?.workout?.id || ""),
    name:String(raw.name || matched?.exercise?.name || "Esercizio"),
    canonicalName:normalizeText(raw.originalName || raw.originalExerciseName || raw.name),
    variant:inferVariant(raw),
    equipment:inferEquipment(raw),
    machineId:String(raw.machineId || raw.metadata?.machineId || ""),
    side:String(raw.side || "bilateral"),
    loadMode,
    order:finite(raw.actualOrder ?? raw.order) ?? index,
    plannedOrder:finite(raw.plannedOrder),
    substituted:Boolean(raw.substitution || (raw.originalExerciseName && normalizeText(raw.originalExerciseName) !== normalizeText(raw.name))),
    substitution:deepClone(raw.substitution || null),
    addedDuringSession:raw.addedDuringSession === true,
    skipped:raw.skipped === true,
    skipReason:String(raw.skipReason || ""),
    incomplete:session.status !== "completed" || raw.status === "incomplete",
    prescription,
    sets,
    intensitySegments,
    notes:String(raw.userNote || raw.notes || raw.note || ""),
    sourceRef:{ sessionId:session.id || null, exerciseId:raw.id || raw.sourceExerciseId || null },
    original:raw
  };
}

function normalizeSession(raw = {}, prescriptionIndex = new Map(), index = 0) {
  const dateValue = raw.dateInput || raw.completedAt || raw.date || "";
  const timestamp = Date.parse(dateValue) || index;
  const readiness = finite(raw.readinessSnapshot?.score ?? raw.readiness ?? raw.checkin?.readiness);
  const painText = normalizeText(raw.pain || raw.checkin?.pain || "");
  const interrupted = ["interrupted", "discarded", "incomplete", "draft"].includes(String(raw.status || "completed"));
  const session = {
    id:String(raw.id || `session-${hashProgrammingData([dateValue, raw.sessionCode, index])}`),
    dateInput:String(raw.dateInput || ""),
    timestamp,
    programId:String(raw.programId || ""),
    workoutId:String(raw.sheetId || raw.workoutId || ""),
    workoutCode:String(raw.sessionCode || raw.code || ""),
    week:finite(raw.week),
    status:String(raw.status || "completed"),
    source:String(raw.source || "unknown"),
    mode:String(raw.mode || "planned"),
    readiness,
    sleep:finite(raw.sleep ?? raw.readinessSnapshot?.checkin?.sleep),
    stress:finite(raw.stress ?? raw.readinessSnapshot?.checkin?.stress),
    pain:painText,
    hasPain:Boolean(painText && !/^(no|nessuno|none)$/.test(painText)),
    sessionRpe:finite(raw.sessionRpe),
    activeDurationSeconds:finite(raw.activeDurationSeconds),
    totalDurationSeconds:finite(raw.totalDurationSeconds),
    interrupted,
    notes:String(raw.notes || raw.note || ""),
    original:raw
  };
  session.exercises = (raw.exercises || []).map((exercise, exerciseIndex) => normalizeExercise(exercise, session, prescriptionIndex, exerciseIndex));
  session.fingerprint = hashProgrammingData({ date:session.dateInput || timestamp, workout:session.workoutCode, exercises:session.exercises.map((exercise) => ({ name:exercise.canonicalName, sets:exercise.sets.map((set) => [set.load, set.reps, set.kind]) })) });
  return session;
}

export function normalizeProgrammingData(input = {}, options = {}) {
  const source = deepClone(input || {});
  const programs = source.programs || source.state?.programs || [];
  const sessions = source.sessions || source.training?.sessions || source.state?.training?.sessions || [];
  const prescriptionIndex = buildPrescriptionIndex(programs);
  const normalizedSessions = sessions.map((session, index) => normalizeSession(session, prescriptionIndex, index)).sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
  const normalized = {
    version:PROGRAMMING_ENGINE_VERSION,
    programs:deepClone(programs),
    sessions:normalizedSessions,
    checkins:deepClone(source.checkins || source.quiz?.history || source.state?.quiz?.history || []),
    metrics:deepClone(source.metrics || source.state?.metrics || {}),
    exclusions:deepClone(source.exclusions || source.state?.programming?.exclusions || []),
    sourceRefs:{ sessionIds:normalizedSessions.map((session) => session.id) },
    createdAt:deterministicTimestamp(source)
  };
  normalized.dataHash = hashProgrammingData({ programs:normalized.programs, sessions:normalized.sessions.map(stripOriginal), checkins:normalized.checkins, metrics:normalized.metrics, exclusions:normalized.exclusions, options });
  normalized.anomalies = detectProgrammingAnomalies(normalized);
  return normalized;
}

function stripOriginal(value) {
  if (Array.isArray(value)) return value.map(stripOriginal);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "original").map(([key, item]) => [key, stripOriginal(item)]));
}

export function calculateComparability(left = {}, right = {}) {
  const matchingFactors = [];
  const conflictingFactors = [];
  const warnings = [];
  const same = (field, weight, label = field) => {
    const a = normalizeText(left[field]);
    const b = normalizeText(right[field]);
    if (!a || !b) { warnings.push(`${label}: dato mancante`); return 0; }
    if (a === b) { matchingFactors.push(label); return weight; }
    conflictingFactors.push(label); return -weight;
  };
  let score = 0;
  score += same("canonicalName", .32, "stesso esercizio");
  score += same("variant", .12, "stessa variante");
  score += same("equipment", .1, "stessa attrezzatura");
  score += same("side", .06, "stesso lato");
  score += same("loadMode", .08, "stessa modalità di carico");
  const leftUnit = left.prescription?.loadUnit || left.sets?.find((set) => set.unit)?.unit;
  const rightUnit = right.prescription?.loadUnit || right.sets?.find((set) => set.unit)?.unit;
  if (leftUnit && rightUnit && leftUnit === rightUnit) { score += .06; matchingFactors.push("stessa unità"); }
  else if (leftUnit && rightUnit) { score -= .35; conflictingFactors.push("unità incompatibile"); }
  const leftType = left.sets?.find((set) => set.analysisEligible)?.kind;
  const rightType = right.sets?.find((set) => set.analysisEligible)?.kind;
  if (leftType && rightType && leftType === rightType) { score += .06; matchingFactors.push("stesso tipo di serie"); }
  else if (leftType && rightType) { score -= .12; conflictingFactors.push("tipo di serie differente"); }
  if (left.machineId && right.machineId && left.machineId !== right.machineId) { score -= .15; conflictingFactors.push("macchina differente"); }
  if (finite(left.order) !== null && finite(right.order) !== null && Math.abs(left.order - right.order) > 2) { score -= .06; warnings.push("ordine esercizio molto differente"); }
  if (left.substituted || right.substituted) { score -= .08; warnings.push("esercizio sostituito"); }
  if (left.incomplete || right.incomplete) { score -= .08; warnings.push("sessione incompleta"); }
  score = clamp(score, 0, 1);
  const exerciseConflict = conflictingFactors.includes("stesso esercizio");
  const unitConflict = conflictingFactors.includes("unità incompatibile");
  const level = exerciseConflict || unitConflict || score < .25 ? "incompatible" : score >= .78 ? "high" : score >= .5 ? "medium" : "low";
  return { score:round(score), level, compatible:level !== "incompatible", matchingFactors, conflictingFactors, warnings };
}

function validContextReason(exercise, session = {}) {
  const text = normalizeText(`${exercise.skipReason} ${exercise.notes} ${session.notes}`);
  return exercise.substituted || exercise.addedDuringSession || session.hasPain || session.interrupted || session.mode === "free" || /dolore|malessere|attrezzatura|deload|scarico|approvat/.test(text);
}

export function calculateAdherence(actual = {}, prescription = actual.prescription || {}, session = {}) {
  const missingData = [];
  const deviations = [];
  const reasons = [];
  const components = {};
  const sets = (actual.sets || []).filter((set) => set.kind !== "warmup" && set.status !== "skipped");
  const completed = sets.filter((set) => set.status === "completed");
  const contextAdjusted = validContextReason(actual, session);
  const plannedSets = finite(prescription.sets);
  if (plannedSets === null) missingData.push("serie previste");
  else if (contextAdjusted && completed.length < plannedSets) { components.sets = null; reasons.push("scostamento giustificato dal contesto"); }
  else { components.sets = clamp(completed.length / Math.max(1, plannedSets), 0, 1); if (completed.length !== plannedSets) deviations.push({ field:"sets", expected:plannedSets, actual:completed.length }); }
  const range = parseRange(prescription.repRange || prescription.reps);
  if (range.min === null) missingData.push("ripetizioni previste");
  else {
    const repScores = completed.map((set) => set.reps === null ? null : set.reps >= range.min && set.reps <= (range.max ?? range.min) ? 1 : set.reps < range.min ? clamp(set.reps / range.min, 0, 1) : .9).filter((value) => value !== null);
    components.reps = mean(repScores);
    if (!repScores.length) missingData.push("ripetizioni eseguite");
    else if (components.reps < .9) deviations.push({ field:"reps", expected:range, actual:completed.map((set) => set.reps) });
  }
  const prescribedLoad = finite(prescription.load);
  const actualLoads = completed.map((set) => set.netLoad ?? set.load).filter((value) => value !== null);
  if (prescribedLoad === null) missingData.push("carico previsto");
  else if (!actualLoads.length) missingData.push("carico eseguito");
  else { components.load = clamp(1 - Math.abs(mean(actualLoads) - prescribedLoad) / Math.max(1, prescribedLoad), 0, 1); if (components.load < .9) deviations.push({ field:"load", expected:prescribedLoad, actual:round(mean(actualLoads)) }); }
  const targetRir = parseRange(prescription.rir).min;
  const actualRir = mean(completed.map((set) => set.rir));
  const targetRpe = parseRange(prescription.rpe).min;
  const actualRpe = mean(completed.map((set) => set.rpe));
  if (targetRir !== null && actualRir !== null) components.effort = clamp(1 - Math.abs(actualRir - targetRir) / 4, 0, 1);
  else if (targetRpe !== null && actualRpe !== null) components.effort = clamp(1 - Math.abs(actualRpe - targetRpe) / 4, 0, 1);
  else missingData.push("RIR/RPE target o effettivo");
  const targetRest = finite(prescription.restSeconds);
  const actualRest = mean(completed.map((set) => set.restSeconds));
  if (targetRest !== null && actualRest !== null) components.rest = clamp(1 - Math.abs(actualRest - targetRest) / Math.max(30, targetRest), 0, 1);
  else missingData.push("recupero previsto o effettivo");
  if (finite(actual.plannedOrder) !== null && finite(actual.order) !== null) components.order = Math.abs(actual.plannedOrder - actual.order) <= 1 ? 1 : .7;
  else missingData.push("ordine pianificato o effettivo");
  const values = Object.values(components).filter((value) => value !== null && Number.isFinite(value));
  const score = values.length ? round(mean(values)) : null;
  const label = score === null ? "insufficientData" : score >= .9 ? "high" : score >= .7 ? "medium" : "low";
  return { score, label, components, deviations, reasons, missingData, contextAdjusted };
}

function performancePoint(exercise, session = {}) {
  const normalSets = (exercise.sets || []).filter((set) => set.analysisEligible);
  const topSets = normalSets.filter((set) => set.kind === "top-set");
  const selected = topSets.length ? topSets : normalSets;
  const loads = selected.map((set) => set.netLoad ?? set.load).filter((value) => value !== null);
  const reps = selected.map((set) => set.reps).filter((value) => value !== null);
  const e1rms = selected.map((set) => {
    const load = set.netLoad ?? set.load;
    return load !== null && set.reps !== null && set.reps > 0 && set.reps <= 20 ? load * (1 + set.reps / 30) : null;
  }).filter((value) => value !== null);
  const volume = sum(selected.map((set) => {
    const load = set.netLoad ?? set.load;
    return load !== null && set.reps !== null ? load * set.reps : null;
  }));
  return {
    sessionId:session.id || exercise.sessionId,
    timestamp:session.timestamp || 0,
    exercise,
    session,
    setCount:selected.length,
    load:mean(loads),
    maxLoad:loads.length ? Math.max(...loads) : null,
    reps:mean(reps),
    totalReps:sum(reps),
    e1rm:mean(e1rms),
    volume:selected.length ? volume : null,
    rir:mean(selected.map((set) => set.rir)),
    rpe:mean(selected.map((set) => set.rpe)),
    adherence:calculateAdherence(exercise, exercise.prescription, session),
    readiness:session.readiness,
    hasPain:session.hasPain,
    incomplete:session.interrupted || exercise.incomplete,
    comparableSetCount:selected.length
  };
}

function linearSlope(values) {
  const pairs = values.map((value, index) => [index, finite(value)]).filter(([, value]) => value !== null);
  if (pairs.length < 2) return 0;
  const meanX = mean(pairs.map(([x]) => x));
  const meanY = mean(pairs.map(([, y]) => y));
  const denominator = sum(pairs.map(([x]) => (x - meanX) ** 2));
  return denominator ? sum(pairs.map(([x, y]) => (x - meanX) * (y - meanY))) / denominator : 0;
}

function relativeChange(first, last) {
  return first !== null && last !== null && Math.abs(first) > 1e-9 ? (last - first) / Math.abs(first) : null;
}

function isLowReadiness(value, threshold = 40) {
  const numeric = finite(value);
  if (numeric === null) return false;
  return numeric < (numeric <= 10 ? threshold / 10 : threshold);
}

export function calculateConfidence(input = {}) {
  const points = input.points || [];
  const comparabilityScores = input.comparabilityScores || [];
  const missingData = input.missingData || [];
  const anomalies = input.anomalies || [];
  const recentCount = points.filter((point) => point.timestamp >= Math.max(...points.map((item) => item.timestamp || 0), 0) - 1000 * 60 * 60 * 24 * 35).length;
  let score = .15 + Math.min(.35, points.length * .07) + Math.min(.1, recentCount * .025);
  if (comparabilityScores.length) score += mean(comparabilityScores) * .25;
  if (points.some((point) => point.readiness !== null)) score += .05;
  if (points.some((point) => point.rir !== null || point.rpe !== null)) score += .07;
  score -= Math.min(.25, missingData.length * .035);
  score -= Math.min(.2, anomalies.filter((item) => item.severity === "high").length * .08 + anomalies.filter((item) => item.severity === "medium").length * .03);
  score = clamp(score, 0, 1);
  const level = score >= .72 ? "high" : score >= .45 ? "medium" : "low";
  const reasons = compact([
    `${points.length} sessioni utilizzabili`,
    comparabilityScores.length ? `comparabilità media ${Math.round(mean(comparabilityScores) * 100)}%` : null,
    points.some((point) => point.rir !== null || point.rpe !== null) ? "RIR/RPE disponibile" : null,
    points.some((point) => point.readiness !== null) ? "readiness disponibile" : null
  ]);
  const reducingFactors = compact([
    points.length < 3 ? "meno di tre sessioni comparabili" : null,
    !points.some((point) => point.rir !== null || point.rpe !== null) ? "RIR/RPE mancante" : null,
    !points.some((point) => point.readiness !== null) ? "readiness mancante" : null,
    missingData.length ? `dati mancanti: ${[...new Set(missingData)].join(", ")}` : null,
    anomalies.length ? `${anomalies.length} anomalie da revisionare` : null
  ]);
  return { confidenceScore:round(score), confidenceLevel:level, reasons, reducingFactors };
}

export function detectPlateau(points = [], options = {}) {
  const useful = points.filter((point) => point.comparableSetCount > 0 && !point.hasPain && !point.incomplete && !isLowReadiness(point.readiness, options.lowReadinessThreshold || 40));
  if (useful.length < 3) return { code:"insufficientData", level:"insufficientData", evidence:[], rationale:"Servono almeno tre sessioni comparabili senza spiegazioni contestuali." };
  const recent = useful.slice(-(options.window || 5));
  const metric = recent.map((point) => point.e1rm ?? point.volume ?? point.maxLoad ?? point.reps);
  if (metric.some((value) => value === null)) return { code:"insufficientData", level:"insufficientData", evidence:[], rationale:"Manca una metrica di prestazione coerente." };
  const change = relativeChange(metric[0], metric.at(-1));
  const adherence = mean(recent.map((point) => point.adherence.score));
  const effortWorsening = linearSlope(recent.map((point) => point.rpe ?? (point.rir !== null ? 10 - point.rir : null))) > .15;
  const noProgress = Math.abs(change) < (options.progressThreshold || .015);
  const repeatedMisses = recent.filter((point) => point.adherence.score !== null && point.adherence.score < .8).length;
  const evidence = [
    { metric:"relativeChange", value:round(change) },
    { metric:"adherence", value:round(adherence) },
    { metric:"effortWorsening", value:effortWorsening },
    { metric:"repeatedTargetMisses", value:repeatedMisses }
  ];
  if (noProgress && adherence >= .82 && (effortWorsening || recent.length >= 5)) return { code:recent.length >= 5 ? "probable" : "possible", level:recent.length >= 5 ? "probable" : "possible", evidence, rationale:"Più sessioni comparabili mostrano alta aderenza senza progresso apprezzabile." };
  return { code:"none", level:"none", evidence, rationale:"I dati non soddisfano i criteri prudenziali di stallo." };
}

export function detectRegression(points = [], options = {}) {
  if (points.length < 2) return { code:"insufficientData", evidence:[], rationale:"Servono almeno due sessioni comparabili." };
  const recent = points.slice(-(options.window || 4));
  const metric = recent.map((point) => point.e1rm ?? point.volume ?? point.maxLoad ?? point.reps);
  if (metric.some((value) => value === null)) return { code:"insufficientData", evidence:[], rationale:"Prestazioni non confrontabili." };
  const change = relativeChange(metric[0], metric.at(-1));
  const contextual = recent.at(-1).hasPain || recent.at(-1).incomplete || isLowReadiness(recent.at(-1).readiness, 40);
  const negativeCount = metric.slice(1).filter((value, index) => value < metric[index] * .97).length;
  const evidence = [{ metric:"relativeChange", value:round(change) }, { metric:"negativeSessions", value:negativeCount }, { metric:"contextualExplanation", value:contextual }];
  if (contextual && recent.length <= 2) return { code:"normalVariability", evidence, rationale:"Il calo isolato ha una spiegazione contestuale registrata." };
  if (change < -.08 && negativeCount >= 3 && !contextual) return { code:"probableRegression", evidence, rationale:"Calo ripetuto e non spiegato in più sessioni comparabili." };
  if (change < -.04 && negativeCount >= 2) return { code:"possibleNegativeTrend", evidence, rationale:"Più prestazioni recenti sono inferiori, ma il trend richiede conferma." };
  if (change < -.03) return { code:"singleRegression", evidence, rationale:"Una prestazione è inferiore; non viene trattata come trend." };
  return { code:"normalVariability", evidence, rationale:"Oscillazione compatibile con la normale variabilità." };
}

export function detectFatiguePattern(input = {}, options = {}) {
  const sessions = Array.isArray(input) ? input : input.sessions || [];
  if (sessions.length < 2) return { code:"insufficientData", confidenceScore:.2, evidence:[], warnings:["Servono più sessioni."] };
  const recent = sessions.slice(-(options.window || 6));
  const lowReadiness = recent.filter((session) => isLowReadiness(session.readiness, 45)).length;
  const pain = recent.filter((session) => session.hasPain).length;
  const interruptions = recent.filter((session) => session.interrupted).length;
  const highRpe = recent.filter((session) => session.sessionRpe !== null && session.sessionRpe >= 9).length;
  const longSessions = recent.filter((session) => session.totalDurationSeconds !== null && session.totalDurationSeconds > 3 * 60 * 60).length;
  const decliningExercises = recent.flatMap((session) => session.exercises || []).filter((exercise) => exercise.notes && /fatica|stanca|crollo|dolore/.test(normalizeText(exercise.notes))).length;
  const systemicSignals = lowReadiness + interruptions + highRpe + Math.min(2, longSessions);
  const localSignals = pain + decliningExercises;
  const evidence = [{ metric:"lowReadinessSessions", value:lowReadiness }, { metric:"painSessions", value:pain }, { metric:"interruptedSessions", value:interruptions }, { metric:"highRpeSessions", value:highRpe }, { metric:"excessiveDurationSessions", value:longSessions }];
  const code = systemicSignals >= 5 && recent.length >= 4 ? "possibleDeloadNeed" : systemicSignals >= 3 ? "possibleSystemicFatigue" : localSignals >= 2 ? "possibleLocalFatigue" : systemicSignals + localSignals === 1 ? "isolatedBadDay" : "observe";
  return { code, confidenceScore:round(clamp(.25 + recent.length * .06 + (systemicSignals + localSignals) * .035, 0, .9)), evidence, warnings:["Indicazione prudenziale, non diagnosi medica."] };
}

export function detectProgrammingAnomalies(normalized = {}) {
  const anomalies = [];
  const fingerprintMap = new Map();
  (normalized.sessions || []).forEach((session) => {
    if (fingerprintMap.has(session.fingerprint)) anomalies.push({ anomalyType:"duplicateSession", severity:"medium", affectedData:[fingerprintMap.get(session.fingerprint), session.id], reason:"Due sessioni hanno data, workout e serie equivalenti.", suggestedAction:"Conferma o escludi una duplicazione." });
    else fingerprintMap.set(session.fingerprint, session.id);
    if (session.totalDurationSeconds !== null && (session.totalDurationSeconds < 0 || session.totalDurationSeconds > 12 * 60 * 60)) anomalies.push({ anomalyType:"impossibleDuration", severity:"high", affectedData:[session.id], reason:"Durata fuori dall'intervallo plausibile configurato.", suggestedAction:"Correggi o escludi dall'analisi." });
    session.exercises.forEach((exercise) => {
      const setKeys = new Map();
      const normalLoads = exercise.sets.filter((set) => set.kind !== "warmup" && set.load !== null).map((set) => set.load);
      const typical = median(normalLoads);
      exercise.sets.forEach((set) => {
        if (set.load !== null && ((typical !== null && typical > 0 && set.load > typical * 3) || set.load > 1000)) anomalies.push({ anomalyType:"loadOutlier", severity:"high", affectedData:[session.id, exercise.id, set.id], reason:"Carico enormemente differente dalle altre serie.", suggestedAction:"Conferma il valore o correggi la digitazione." });
        if (set.reps !== null && (set.reps < 0 || set.reps > 100)) anomalies.push({ anomalyType:"repetitionOutlier", severity:"high", affectedData:[session.id, exercise.id, set.id], reason:"Ripetizioni fuori dall'intervallo prudenziale.", suggestedAction:"Conferma o correggi." });
        if (set.load !== null && set.load < 0) anomalies.push({ anomalyType:"invalidLoad", severity:"high", affectedData:[session.id, exercise.id, set.id], reason:"Il carico non può essere negativo.", suggestedAction:"Correggi o escludi." });
        if (set.rir !== null && (set.rir < 0 || set.rir > 10)) anomalies.push({ anomalyType:"invalidRir", severity:"high", affectedData:[session.id, exercise.id, set.id], reason:"RIR deve essere compreso fra 0 e 10.", suggestedAction:"Correggi o escludi." });
        if (set.rpe !== null && (set.rpe < 1 || set.rpe > 10)) anomalies.push({ anomalyType:"invalidRpe", severity:"high", affectedData:[session.id, exercise.id, set.id], reason:"RPE deve essere compreso fra 1 e 10.", suggestedAction:"Correggi o escludi." });
        const key = `${set.kind}|${set.load}|${set.reps}|${set.rir}|${set.rpe}`;
        if (setKeys.has(key) && set.id === setKeys.get(key)) anomalies.push({ anomalyType:"duplicateSet", severity:"medium", affectedData:[session.id, exercise.id, set.id], reason:"Identificatore serie duplicato.", suggestedAction:"Conferma la serie." });
        setKeys.set(key, set.id);
      });
      const units = new Set(exercise.sets.map((set) => set.unit).filter(Boolean));
      if (units.size > 1) anomalies.push({ anomalyType:"mixedUnits", severity:"high", affectedData:[session.id, exercise.id], reason:"Unità di misura incoerenti nello stesso esercizio.", suggestedAction:"Uniforma o escludi le serie incompatibili." });
      const completed = exercise.sets.filter((set) => set.status === "completed");
      if (completed.length >= 2 && completed.every((set) => set.rir !== null) && new Set(completed.map((set) => set.rir)).size === 1 && completed.some((set, index) => index && finite(set.reps) !== finite(completed[index - 1].reps))) anomalies.push({ anomalyType:"repeatedEffortValue", severity:"low", affectedData:[session.id, exercise.id], reason:"RIR identico su tutte le serie nonostante ripetizioni diverse.", suggestedAction:"Rivedi se il valore è stato copiato automaticamente." });
    });
  });
  return anomalies;
}

function exerciseRecords(normalized, selector) {
  const text = normalizeText(selector);
  const records = normalized.sessions.flatMap((session) => session.exercises.map((exercise) => ({ session, exercise })));
  const exact = records.filter(({ exercise }) => exercise.id === selector || exercise.canonicalName === text || normalizeText(exercise.name) === text);
  return exact.sort((a, b) => a.session.timestamp - b.session.timestamp || a.session.id.localeCompare(b.session.id));
}

export function analyzeExerciseProgress(input, selector, options = {}) {
  const normalized = input?.dataHash ? input : normalizeProgrammingData(input || {});
  const records = exerciseRecords(normalized, selector);
  if (!records.length) return insufficientAnalysis(selector, ["storico esercizio"]);
  const anchor = records.at(-1).exercise;
  const comparable = records.map((record) => ({ ...record, comparability:calculateComparability(anchor, record.exercise) })).filter((record) => record.comparability.compatible && record.comparability.level !== "low");
  const windowSize = options.window === "last" ? 1 : options.window === 3 || options.window === 5 ? options.window : options.window === "4weeks" ? 99 : finite(options.window) || 5;
  const cutoff = options.window === "4weeks" ? records.at(-1).session.timestamp - 28 * 86400000 : -Infinity;
  const selected = comparable.filter((record) => record.session.timestamp >= cutoff).slice(-windowSize);
  const points = selected.map(({ exercise, session }) => performancePoint(exercise, session));
  const missingData = [];
  if (!points.some((point) => point.load !== null)) missingData.push("carico");
  if (!points.some((point) => point.reps !== null)) missingData.push("ripetizioni");
  if (!points.some((point) => point.rir !== null || point.rpe !== null)) missingData.push("RIR/RPE");
  if (!points.some((point) => point.readiness !== null)) missingData.push("readiness");
  const anomalies = normalized.anomalies.filter((item) => item.affectedData?.includes(anchor.id) || selected.some((record) => item.affectedData?.includes(record.session.id)));
  const confidence = calculateConfidence({ points, comparabilityScores:selected.map((record) => record.comparability.score), missingData, anomalies });
  const plateau = detectPlateau(points, options);
  const regression = detectRegression(points, options);
  const metric = points.map((point) => point.e1rm ?? point.volume ?? point.maxLoad ?? point.reps);
  let code = "insufficientData";
  if (points.length >= 2 && metric.every((value) => value !== null)) {
    const change = relativeChange(metric[0], metric.at(-1));
    const positiveSteps = metric.slice(1).filter((value, index) => value > metric[index] * 1.01).length;
    const negativeSteps = metric.slice(1).filter((value, index) => value < metric[index] * .97).length;
    if (plateau.code === "probable") code = "probablePlateau";
    else if (plateau.code === "possible") code = "possiblePlateau";
    else if (regression.code === "probableRegression" || regression.code === "possibleNegativeTrend") code = "possibleRegression";
    else if (change > .04 && positiveSteps >= points.length - 1) code = "improvementStable";
    else if (change > .02) code = "improvementOccasional";
    else if (Math.abs(change) <= .015 && negativeSteps === 0) code = "stable";
    else if (negativeSteps === 1 && points.length <= 3) code = "normalVariability";
    else code = "watch";
  }
  const labels = { improvementStable:"In crescita", improvementOccasional:"Progressione stabile", stable:"Mantenimento", normalVariability:"Variabile", watch:"Da osservare", possiblePlateau:"Possibile stallo", probablePlateau:"Stallo probabile", possibleRegression:"Possibile regressione", insufficientData:"Dati insufficienti" };
  const evidence = points.map((point) => ({ sessionId:point.sessionId, load:round(point.load), reps:round(point.reps), e1rm:round(point.e1rm), volume:round(point.volume), rir:round(point.rir), rpe:round(point.rpe), adherence:point.adherence.score, readiness:point.readiness }));
  return {
    exerciseId:anchor.id,
    exerciseName:anchor.name,
    code,
    label:labels[code],
    dataUsed:selected.map((record) => record.session.id),
    excludedData:records.filter((record) => !selected.includes(record)).map((record) => ({ sessionId:record.session.id, reason:record.comparability?.level || "outsideWindow" })),
    rationale:explainAnalysis(code, points, plateau, regression),
    confidence,
    evidence,
    missingData,
    anomalies,
    plateau,
    regression,
    progressionScore:calculateProgressionScore({ code, points, confidence, plateau, regression }),
    currentPrescription:deepClone(anchor.prescription),
    latestExercise:anchor,
    dataHash:hashProgrammingData({ selector, options, evidence, prescription:anchor.prescription })
  };
}

function insufficientAnalysis(selector, missingData) {
  const confidence = calculateConfidence({ points:[], missingData });
  return { exerciseId:String(selector || ""), exerciseName:String(selector || ""), code:"insufficientData", label:"Dati insufficienti", dataUsed:[], excludedData:[], rationale:"Non ci sono dati sufficienti e comparabili.", confidence, evidence:[], missingData, anomalies:[], plateau:{ code:"insufficientData" }, regression:{ code:"insufficientData" }, progressionScore:{ value:null, label:"Dati insufficienti", trend:"unknown", confidence, factors:[], limitations:missingData }, currentPrescription:null, latestExercise:null, dataHash:hashProgrammingData([selector, missingData]) };
}

function explainAnalysis(code, points, plateau, regression) {
  const messages = {
    improvementStable:"Le prestazioni comparabili migliorano in modo ripetuto.",
    improvementOccasional:"Il risultato complessivo migliora, ma non in ogni sessione.",
    stable:"La prestazione è stabile entro la normale tolleranza.",
    normalVariability:"È presente un'oscillazione isolata, non uno stallo.",
    watch:"Il segnale è misto e richiede altre sessioni.",
    possiblePlateau:plateau.rationale,
    probablePlateau:plateau.rationale,
    possibleRegression:regression.rationale,
    insufficientData:"Mancano sessioni o metriche comparabili."
  };
  return `${messages[code]} Dati utilizzati: ${points.length} sessioni.`;
}

export function calculateProgressionScore({ code = "insufficientData", points = [], confidence = calculateConfidence({ points }), plateau = {}, regression = {} } = {}) {
  if (!points.length || code === "insufficientData") return { value:null, label:"Dati insufficienti", trend:"unknown", confidence, factors:[], limitations:["storico insufficiente"] };
  const base = { improvementStable:85, improvementOccasional:70, stable:58, normalVariability:50, watch:42, possiblePlateau:32, probablePlateau:20, possibleRegression:18 }[code] ?? 40;
  const adherence = mean(points.map((point) => point.adherence.score));
  const value = clamp(base + (adherence !== null ? (adherence - .75) * 20 : 0), 0, 100);
  const labels = { improvementStable:"In crescita", improvementOccasional:"Progressione stabile", stable:"Mantenimento", normalVariability:"Variabile", watch:"Da osservare", possiblePlateau:"Possibile stallo", probablePlateau:"Stallo probabile", possibleRegression:"Possibile regressione" };
  return { value:round(value, 1), label:labels[code] || "Da osservare", trend:code, confidence, factors:[{ name:"classificazione", value:code }, { name:"aderenza media", value:round(adherence) }, { name:"plateau", value:plateau.code }, { name:"regressione", value:regression.code }], limitations:confidence.reducingFactors };
}

function equipmentIncrement(exercise = {}, currentLoad = null) {
  const configured = finite(exercise.prescription?.progression?.parameters?.increment);
  if (configured !== null && configured > 0) return configured;
  const equipment = exercise.equipment;
  if (equipment === "barbell") return 2.5;
  if (equipment === "dumbbell") return 1;
  if (equipment === "cable") return 2.5;
  if (equipment === "machine") return 5;
  if (equipment === "bodyweight") return currentLoad === null ? null : 1;
  return currentLoad !== null ? Math.max(.5, round(currentLoad * .025, 1)) : null;
}

function suggestionBase(analysis, progressionType, type, proposed, rationale, extra = {}) {
  const current = deepClone(analysis.currentPrescription || {});
  const seed = { scope:"exercise", exerciseId:analysis.exerciseId, progressionType, type, current, proposed, evidence:analysis.evidence, dataHash:analysis.dataHash };
  const id = `suggestion-${hashProgrammingData(seed)}`;
  const createdAt = deterministicTimestamp(analysis.evidence);
  return {
    id,
    createdAt,
    updatedAt:createdAt,
    scope:"exercise",
    programId:analysis.latestExercise?.programId || "",
    workoutId:analysis.latestExercise?.workoutId || "",
    exerciseId:analysis.exerciseId,
    sessionIds:[...analysis.dataUsed],
    progressionType,
    type,
    status:"generated",
    priority:extra.priority || (type === "deload" || type === "reviewAnomaly" ? "high" : type === "insufficientData" ? "low" : "medium"),
    confidence:analysis.confidence.confidenceLevel,
    confidenceScore:analysis.confidence.confidenceScore,
    confidenceReasons:analysis.confidence.reasons,
    evidence:deepClone(analysis.evidence),
    excludedData:deepClone(analysis.excludedData),
    currentPrescription:current,
    proposedPrescription:deepClone(proposed),
    rationale,
    expectedEffect:extra.expectedEffect || "Modifica prudenziale da valutare; nessuna applicazione automatica.",
    warnings:[...(extra.warnings || []), ...analysis.confidence.reducingFactors],
    missingData:[...analysis.missingData],
    source:"barbell-diva-programming-engine",
    dataHash:hashProgrammingData(seed),
    expiresAt:extra.expiresAt || null,
    userDecision:null,
    appliedAt:null,
    revertedAt:null,
    alternative:deepClone(extra.alternative || null)
  };
}

export function suggestExerciseProgression(input, selector, options = {}) {
  const analysis = input?.code ? input : analyzeExerciseProgress(input, selector, options);
  if (!analysis.latestExercise || analysis.code === "insufficientData") return suggestionBase(analysis, analysis.currentPrescription?.progressionId || "unknown", "insufficientData", { ...(analysis.currentPrescription || {}), load:null }, "Non suggerisco un carico: mancano dati comparabili.", { warnings:["Registra carico, ripetizioni e almeno tre sessioni comparabili."] });
  const exercise = analysis.latestExercise;
  const current = deepClone(analysis.currentPrescription);
  const progressionId = options.progressionId || current.progressionId || "maintenance";
  if (!SUPPORTED_PROGRESSION_IDS.includes(progressionId)) return suggestionBase(analysis, progressionId, "unsupportedProgression", current, `La progressione “${progressionId}” non dispone di una strategia verificata.`, { warnings:["Nessuna proposta inventata."] });
  const last = analysis.evidence.at(-1) || {};
  const load = finite(current.load) ?? finite(last.load);
  const reps = parseRange(current.repRange);
  const lastExercise = exercise;
  const working = lastExercise.sets.filter((set) => set.analysisEligible);
  const allAtTop = working.length > 0 && reps.max !== null && working.every((set) => set.reps !== null && set.reps >= reps.max);
  const allAtMin = working.length > 0 && reps.min !== null && working.every((set) => set.reps !== null && set.reps >= reps.min);
  const effort = mean(working.map((set) => set.rir));
  const targetRir = parseRange(current.rir).min;
  const effortAcceptable = targetRir === null || effort === null || effort >= targetRir - .5;
  const highAdherence = finite(last.adherence) !== null && last.adherence >= .85;
  const fatigue = analysis.latestExercise.original?.sessionFatigue || false;
  if (analysis.anomalies.some((item) => item.severity === "high")) return suggestionBase(analysis, progressionId, "reviewAnomaly", current, "Un'anomalia ad alta priorità deve essere revisionata prima della progressione.", { warnings:analysis.anomalies.map((item) => item.reason) });
  if (analysis.latestExercise.original?.pain || fatigue) return suggestionBase(analysis, progressionId, "holdProgression", current, "Dolore o fatica registrati: mantieni la prescrizione e rivaluta il contesto.", { warnings:["Indicazione prudenziale, non diagnosi."] });
  if (["possiblePlateau", "probablePlateau", "possibleRegression"].includes(analysis.code)) return suggestionBase(analysis, progressionId, "holdProgression", current, "Il trend richiede osservazione o revisione; non aumento simultaneamente carico, volume e intensità.", { alternative:{ type:"repeatWeek", prescription:current } });
  const increment = equipmentIncrement(exercise, load);
  const proposed = deepClone(current);
  if (progressionId === "double-progression") {
    if (load === null) return suggestionBase(analysis, progressionId, "insufficientData", { ...current, load:null }, "Il carico manca: non posso calcolare l'incremento.");
    if (allAtTop && effortAcceptable && analysis.confidence.confidenceLevel !== "low" && increment !== null) { proposed.load=round(load+increment,2); return suggestionBase(analysis, progressionId, "increaseLoad", proposed, "Tutte le serie hanno consolidato il limite alto con margine compatibile.", { alternative:{ type:"maintainLoad", prescription:current } }); }
    if (allAtMin && reps.max !== null) { proposed.repRange={ ...reps, min:Math.min(reps.max, Math.max(reps.min, Math.floor(mean(working.map((set) => set.reps)) + 1))), max:reps.max }; return suggestionBase(analysis, progressionId, "increaseReps", proposed, "Il carico resta invariato mentre si consolida il range di ripetizioni."); }
    return suggestionBase(analysis, progressionId, "maintainLoad", current, "Il range non è ancora consolidato oppure l'intensità è borderline.");
  }
  if (progressionId === "linear-load" || progressionId === "intensity-progression") {
    if (load === null || increment === null) return suggestionBase(analysis, progressionId, "insufficientData", { ...current, load:null }, "Manca il carico di partenza o un incremento compatibile.");
    if (allAtMin && effortAcceptable && highAdherence) { proposed.load=round(load+increment,2); return suggestionBase(analysis, progressionId, "increaseLoad", proposed, "Target raggiunto con aderenza e margine sufficienti."); }
    return suggestionBase(analysis, progressionId, "maintainLoad", current, "Ripeti il carico: il risultato non è abbastanza stabile per un incremento lineare.");
  }
  if (progressionId === "linear-reps") { if (reps.min === null) return suggestionBase(analysis, progressionId, "insufficientData", current, "Manca il target di ripetizioni."); proposed.repRange={ ...reps, min:reps.min+1, max:(reps.max ?? reps.min)+1 }; return suggestionBase(analysis, progressionId, effortAcceptable ? "increaseReps" : "maintainLoad", effortAcceptable ? proposed : current, effortAcceptable ? "Incremento esclusivamente le ripetizioni." : "Mantieni: l'intensità registrata è elevata."); }
  if (progressionId === "linear-sets" || progressionId === "volume-progression") { if (finite(current.sets) === null) return suggestionBase(analysis, progressionId, "insufficientData", current, "Manca il numero di serie prescritte."); if (highAdherence && effortAcceptable && analysis.code !== "watch") { proposed.sets=current.sets+1; return suggestionBase(analysis, progressionId, "increaseSets", proposed, "Aumento soltanto il volume di una serie, mantenendo carico e intensità."); } return suggestionBase(analysis, progressionId, "maintainVolume", current, "Volume mantenuto finché l'aderenza non è stabile."); }
  if (progressionId === "rir-progression") { if (targetRir === null) return suggestionBase(analysis, progressionId, "insufficientData", current, "Manca il target RIR/RPE."); proposed.rir={ min:Math.max(0,targetRir-1),max:Math.max(0,(parseRange(current.rir).max??targetRir)-1),sequence:[],label:"" }; return suggestionBase(analysis, progressionId, "adjustRir", highAdherence&&effortAcceptable?proposed:current, highAdherence&&effortAcceptable?"Aggiusto soltanto il target RIR come previsto dal template.":"Mantieni il RIR finché il target non è consolidato."); }
  if (progressionId === "top-set-backoff") { const top=working.find((set)=>set.kind==="top-set"),backoffs=working.filter((set)=>set.kind==="back-off"); if(!top||!backoffs.length)return suggestionBase(analysis,progressionId,"insufficientData",current,"Top set e back-off non sono entrambi disponibili e non vengono trattati come equivalenti."); if(load!==null&&effortAcceptable&&increment!==null){proposed.load=round(load+increment,2);return suggestionBase(analysis,progressionId,"increaseLoad",proposed,"Incremento proposto soltanto per il top set; i back-off restano separati.",{warnings:["La UI 20B dovrà applicare la modifica al segmento corretto."]});} return suggestionBase(analysis,progressionId,"maintainLoad",current,"Mantieni top set e back-off separati."); }
  if (progressionId === "density" || progressionId === "recovery-decreasing") { if(finite(current.restSeconds)===null)return suggestionBase(analysis,progressionId,"insufficientData",current,"Manca il recupero prescritto."); if(highAdherence){proposed.restSeconds=Math.max(30,current.restSeconds-10);return suggestionBase(analysis,progressionId,"reduceRest",proposed,"Riduzione prudente di 10 secondi senza cambiare carico o volume.");} return suggestionBase(analysis,progressionId,"maintainLoad",current,"Mantieni il recupero finché l'aderenza non migliora."); }
  if (["undulating","pyramid","reverse-pyramid"].includes(progressionId)) return suggestionBase(analysis,progressionId,"progressWeek",current,"Il template cambia struttura per settimana; propongo di avanzare senza inventare valori fuori dalla progressione esistente.");
  if (progressionId === "deload") { proposed.sets=finite(current.sets)!==null?Math.max(1,Math.round(current.sets*.6)):current.sets; proposed.load=load!==null?round(load*.85,2):null; proposed.rir={min:(targetRir??1)+2,max:(targetRir??1)+2,sequence:[],label:""}; return suggestionBase(analysis,progressionId,"deload",proposed,"Applico alla simulazione la strategia di scarico del template, senza modificare il programma."); }
  return suggestionBase(analysis, progressionId, "maintenance", current, "Il template richiede mantenimento della prescrizione.");
}

export function simulateProgrammingChange(current = {}, proposed = {}, scope = "exercise") {
  const currentReps = parseRange(current.repRange || current.reps);
  const proposedReps = parseRange(proposed.repRange || proposed.reps);
  const currentSets = finite(current.sets);
  const proposedSets = finite(proposed.sets);
  const currentLoad = finite(current.load);
  const proposedLoad = finite(proposed.load);
  const currentRepValue = currentReps.max ?? currentReps.min;
  const proposedRepValue = proposedReps.max ?? proposedReps.min;
  const currentVolume = currentSets !== null && currentRepValue !== null && currentLoad !== null ? currentSets * currentRepValue * currentLoad : null;
  const proposedVolume = proposedSets !== null && proposedRepValue !== null && proposedLoad !== null ? proposedSets * proposedRepValue * proposedLoad : null;
  const result = {
    scope,
    setDifference:currentSets !== null && proposedSets !== null ? proposedSets-currentSets : null,
    repetitionDifference:currentRepValue !== null && proposedRepValue !== null ? proposedRepValue-currentRepValue : null,
    loadDifference:currentLoad !== null && proposedLoad !== null ? round(proposedLoad-currentLoad) : null,
    estimatedVolumeDifference:currentVolume !== null && proposedVolume !== null ? round(proposedVolume-currentVolume) : null,
    estimatedVolumePercent:currentVolume ? round((proposedVolume-currentVolume)/currentVolume) : null,
    intensityDifference:parseRange(proposed.rir).min !== null && parseRange(current.rir).min !== null ? parseRange(current.rir).min-parseRange(proposed.rir).min : null,
    restDifference:finite(current.restSeconds)!==null&&finite(proposed.restSeconds)!==null?proposed.restSeconds-current.restSeconds:null,
    warnings:[]
  };
  const changed = [result.setDifference,result.repetitionDifference,result.loadDifference,result.intensityDifference].filter((value)=>value!==null&&value!==0).length;
  if(changed>1)result.warnings.push("Più dimensioni cambiano insieme: richiede motivazione esplicita.");
  if(result.estimatedVolumePercent!==null&&Math.abs(result.estimatedVolumePercent)>.25)result.warnings.push("Variazione di volume stimata superiore al 25%.");
  if(proposedLoad===null&&currentLoad!==null)result.warnings.push("Carico proposto mancante.");
  return result;
}

export function validateProgrammingSuggestion(suggestion = {}, context = {}) {
  const errors = [];
  const warnings = [];
  if (!suggestion.id) errors.push("id mancante");
  if (!SUGGESTION_SCOPES.includes(suggestion.scope)) errors.push("scope non valido");
  if (!SUGGESTION_TYPES.includes(suggestion.type)) errors.push("tipo non valido");
  if (!SUGGESTION_STATUSES.includes(suggestion.status)) errors.push("stato non valido");
  if (suggestion.confidenceScore < 0 || suggestion.confidenceScore > 1) errors.push("confidenza fuori intervallo");
  if (!Array.isArray(suggestion.evidence)) errors.push("evidenze mancanti");
  if (!suggestion.rationale) errors.push("motivazione mancante");
  if (["history", "sessions", "completedSets"].some((key) => Object.prototype.hasOwnProperty.call(suggestion.proposedPrescription || {}, key))) errors.push("il suggerimento non può contenere modifiche allo storico");
  const proposed = suggestion.proposedPrescription || {};
  if (finite(proposed.sets) !== null && (proposed.sets < 0 || proposed.sets > 30)) errors.push("serie non valide");
  const reps = parseRange(proposed.repRange || proposed.reps);
  if (reps.min !== null && (reps.min < 0 || reps.min > 100)) errors.push("ripetizioni non valide");
  if (reps.min !== null && reps.max !== null && reps.min > reps.max) errors.push("range ripetizioni incoerente");
  if (finite(proposed.load) !== null && (proposed.load < 0 || proposed.load > 2000)) errors.push("carico non valido");
  if (finite(proposed.restSeconds) !== null && (proposed.restSeconds < 0 || proposed.restSeconds > 3600)) errors.push("recupero non valido");
  if (context.exerciseIds && suggestion.exerciseId && !context.exerciseIds.includes(suggestion.exerciseId)) errors.push("esercizio inesistente");
  if (context.programIds && suggestion.programId && !context.programIds.includes(suggestion.programId)) errors.push("programma inesistente");
  const simulation = simulateProgrammingChange(suggestion.currentPrescription || {}, proposed, suggestion.scope);
  warnings.push(...simulation.warnings);
  return { valid:errors.length===0, applicable:errors.length===0&&!["insufficientData","unsupportedProgression","reviewAnomaly"].includes(suggestion.type), errors, warnings, simulation };
}

export function explainProgrammingSuggestion(suggestion = {}) {
  return { summary:suggestion.rationale || "Motivazione non disponibile.", evidenceCount:Array.isArray(suggestion.evidence)?suggestion.evidence.length:0, confidence:`Confidenza ${suggestion.confidence || "low"}: ${(suggestion.confidenceReasons || []).join("; ") || "dati limitati"}.`, limitations:[...(suggestion.warnings || []), ...(suggestion.missingData || []).map((item)=>`Manca: ${item}`)] };
}

export function suggestDeload(input, options = {}) {
  const normalized = input?.dataHash ? input : normalizeProgrammingData(input || {});
  const fatigue = detectFatiguePattern(normalized, options);
  const currentWeek = finite(options.currentWeek);
  const blockWeeks = finite(options.blockWeeks);
  const alreadyPlanned = options.deloadPlanned === true;
  let code = "none";
  if (normalized.sessions.length < 3) code = "insufficientData";
  else if (alreadyPlanned) code = "none";
  else if (fatigue.code === "possibleDeloadNeed") code = "possibleDeload";
  else if (fatigue.code === "possibleSystemicFatigue") code = "lightReduction";
  else if (fatigue.code === "isolatedBadDay" || fatigue.code === "possibleLocalFatigue") code = "observeOneMoreWeek";
  if (blockWeeks && currentWeek && currentWeek >= blockWeeks && fatigue.code !== "observe") code = code === "none" ? "observeOneMoreWeek" : code;
  const proposals = { none:null, observeOneMoreWeek:null, lightReduction:{ setsFactor:.8, loadFactor:1, rirIncrease:1, removeIntensityTechniques:true }, possibleDeload:{ setsFactor:.6, loadFactor:.85, rirIncrease:2, removeIntensityTechniques:true }, insufficientData:null };
  return { code, fatigue, proposedAdjustment:proposals[code], rationale:code==="possibleDeload"?"Più segnali sistemici persistono: valuta uno scarico prudente.":code==="lightReduction"?"Riduzione leggera proposta senza diagnosi.":code==="observeOneMoreWeek"?"Osserva un'altra settimana senza aumentare più variabili.":code==="insufficientData"?"Dati insufficienti.":"Nessun segnale sufficiente.", warnings:["Non applicato automaticamente.","Non è una diagnosi medica."] };
}

export function analyzeWorkoutProgress(input, workoutId, options = {}) {
  const normalized = input?.dataHash ? input : normalizeProgrammingData(input || {});
  const sessions = normalized.sessions.filter((session) => session.workoutId === workoutId || session.workoutCode === workoutId);
  const exerciseIds = [...new Set(sessions.flatMap((session) => session.exercises.map((exercise) => exercise.id)))];
  const exercises = exerciseIds.map((id) => analyzeExerciseProgress(normalized, id, options));
  const confidence = calculateConfidence({ points:exercises.flatMap((exercise) => exercise.evidence || []).map((evidence) => ({ ...evidence, timestamp:0, comparableSetCount:1 })) });
  return { scope:"workout", workoutId, sessionIds:sessions.map((session)=>session.id), exercises, fatigue:detectFatiguePattern({ sessions }), confidence, dataHash:hashProgrammingData({ workoutId, sessions:sessions.map(stripOriginal), options }) };
}

export function analyzeProgramProgress(input, programId, options = {}) {
  const normalized = input?.dataHash ? input : normalizeProgrammingData(input || {});
  const program = normalized.programs.find((item) => item.id === programId || item.code === programId) || null;
  const workoutIds = program ? (program.sheets || program.workouts || []).map((item) => item.id || item.code) : [...new Set(normalized.sessions.filter((session)=>session.programId===programId).map((session)=>session.workoutId||session.workoutCode))];
  const workouts = workoutIds.map((id)=>analyzeWorkoutProgress(normalized,id,options));
  return { scope:"program", programId, workouts, deload:suggestDeload(normalized,{...options,blockWeeks:program?.durationWeeks}), confidence:calculateConfidence({points:workouts.flatMap((workout)=>workout.exercises.flatMap((exercise)=>exercise.evidence||[])).map((item)=>({...item,timestamp:0,comparableSetCount:1}))}), dataHash:hashProgrammingData({programId,workouts:workouts.map((item)=>item.dataHash)}) };
}

export function analyzeWeeklyProgress(input, week, options = {}) {
  const normalized = input?.dataHash ? input : normalizeProgrammingData(input || {});
  const sessions = normalized.sessions.filter((session) => String(session.week) === String(week));
  const volume = sessions.reduce((total, session) => total + session.exercises.reduce((exerciseTotal, exercise) => exerciseTotal + (performancePoint(exercise,session).volume || 0),0),0);
  return { scope:"week", week, sessionIds:sessions.map((session)=>session.id), workoutCount:sessions.length, volume:round(volume), fatigue:detectFatiguePattern({sessions}), dataHash:hashProgrammingData({week,sessions:sessions.map(stripOriginal),options}) };
}

export function suggestWeeklyAdjustments(input, week, options = {}) {
  const analysis = analyzeWeeklyProgress(input, week, options);
  const deload = suggestDeload(input, options);
  return { analysis, suggestions:deload.code==="possibleDeload"||deload.code==="lightReduction"?[{ scope:"week", type:deload.code==="possibleDeload"?"deload":"holdProgression", proposedAdjustment:deload.proposedAdjustment, rationale:deload.rationale }]:[{ scope:"week", type:"progressWeek", proposedAdjustment:null, rationale:"Nessun segnale sufficiente per modificare la settimana." }] };
}

class AnalysisCache {
  constructor(){this.entries=new Map();this.hits=0;this.misses=0;}
  get(key){if(this.entries.has(key)){this.hits+=1;return deepClone(this.entries.get(key));}this.misses+=1;return null;}
  set(key,value,meta={}){this.entries.set(key,{value:deepClone(value),meta:{...meta,key}});return deepClone(value);}
  read(key){const row=this.get(key);return row?.value??null;}
  invalidate(filter={}){let removed=0;for(const [key,row] of this.entries){const meta=row.meta||{};const match=!Object.keys(filter).length||Object.entries(filter).every(([field,value])=>value==null||meta[field]===value||key.includes(String(value)));if(match){this.entries.delete(key);removed+=1;}}return removed;}
  stats(){return{size:this.entries.size,hits:this.hits,misses:this.misses};}
}

export function createProgrammingEngine({ dataProvider = () => ({}), persisted = {}, onPersist = null } = {}) {
  const cache = new AnalysisCache();
  const decisions = new Map(Object.entries(persisted.decisions || {}));
  let latest = null;
  const persist = () => { if(typeof onPersist==="function")onPersist({ version:PROGRAMMING_ENGINE_VERSION, decisions:Object.fromEntries(decisions), cacheMeta:cache.stats(), lastAnalysisHash:latest?.dataHash||null, updatedAt:latest?.createdAt||null }); };
  const normalized = (force=false) => {
    const data = normalizeProgrammingData(dataProvider());
    const key=`normalized:${data.dataHash}`;
    if(!force){const hit=cache.read(key);if(hit)return hit;}
    cache.set(key,data,{scope:"all",dataHash:data.dataHash});
    return data;
  };
  const exerciseAnalysis = (selector,options={}) => {
    const data=normalized();const key=`exercise:${selector}:${hashProgrammingData(options)}:${data.dataHash}`;const hit=cache.read(key);if(hit)return hit;const result=analyzeExerciseProgress(data,selector,options);cache.set(key,result,{scope:"exercise",exerciseId:result.exerciseId,dataHash:data.dataHash});return result;
  };
  const suggestions = (options={}) => {
    const data=normalized();const key=`suggestions:${hashProgrammingData(options)}:${data.dataHash}`;const hit=cache.read(key);if(hit)return hit;
    const ids=[...new Set(data.sessions.flatMap((session)=>session.exercises.map((exercise)=>exercise.id)))];
    const result=ids.map((id)=>suggestExerciseProgression(exerciseAnalysis(id,options),id,options)).map((suggestion)=>decisions.has(suggestion.id)?{...suggestion,userDecision:decisions.get(suggestion.id),status:decisions.get(suggestion.id).decision}:suggestion);
    cache.set(key,result,{scope:"suggestions",dataHash:data.dataHash});return result;
  };
  const refresh = (options={}) => { const data=normalized(true); cache.invalidate({dataHash:data.dataHash}); const exerciseIds=[...new Set(data.sessions.flatMap((session)=>session.exercises.map((exercise)=>exercise.id)))]; const exerciseAnalyses=exerciseIds.map((id)=>exerciseAnalysis(id,options)); latest={ dataHash:data.dataHash, createdAt:data.createdAt, exercises:exerciseAnalyses, suggestions:suggestions(options), weekly:options.week!=null?analyzeWeeklyProgress(data,options.week,options):null, programs:(data.programs||[]).map((program)=>analyzeProgramProgress(data,program.id,options)), anomalies:data.anomalies };persist();return deepClone(latest); };
  return Object.freeze({
    getProgrammingSuggestions:suggestions,
    getExerciseAnalysis:exerciseAnalysis,
    getWeeklyAnalysis:(week,options={})=>analyzeWeeklyProgress(normalized(),week,options),
    getProgramAnalysis:(programId,options={})=>analyzeProgramProgress(normalized(),programId,options),
    getSuggestionEvidence:(id)=>suggestions().find((item)=>item.id===id)?.evidence||[],
    getSuggestionSimulation:(id)=>{const item=suggestions().find((suggestion)=>suggestion.id===id);return item?simulateProgrammingChange(item.currentPrescription,item.proposedPrescription,item.scope):null;},
    refreshProgrammingAnalysis:refresh,
    invalidateProgrammingAnalysis:(filter={})=>{const removed=cache.invalidate(filter);persist();return removed;},
    markSuggestionViewed:(id)=>{const existing=decisions.get(id)||{};decisions.set(id,{...existing,decision:"viewed",viewedAt:deterministicTimestamp(dataProvider())});persist();return true;},
    recordSuggestionDecision:(id,decision,details={})=>{if(!VALID_DECISIONS.has(decision))return{ok:false,error:"decisione non valida"};const suggestion=suggestions().find((item)=>item.id===id);if(!suggestion)return{ok:false,error:"suggerimento non trovato"};const row={decision,details:deepClone(details),recordedAt:deterministicTimestamp(dataProvider()),dataHash:suggestion.dataHash};decisions.set(id,row);cache.invalidate({scope:"suggestions"});persist();return{ok:true,decision:deepClone(row),programModified:false};},
    getCacheStats:()=>cache.stats(),
    getLatestAnalysis:()=>deepClone(latest),
    normalizeProgrammingData:()=>normalized()
  });
}

const publicApi = Object.freeze({
  PROGRAMMING_ENGINE_VERSION, SUGGESTION_SCOPES, SUGGESTION_TYPES, SUGGESTION_STATUSES,
  SUPPORTED_PROGRESSION_IDS, UNSUPPORTED_PROGRESSION_IDS, stableStringify, hashProgrammingData,
  normalizeProgrammingData, calculateComparability, calculateAdherence, calculateConfidence,
  calculateProgressionScore, detectPlateau, detectRegression, detectFatiguePattern,
  detectProgrammingAnomalies, analyzeExerciseProgress, analyzeWorkoutProgress,
  analyzeProgramProgress, analyzeWeeklyProgress, suggestExerciseProgression,
  suggestWeeklyAdjustments, suggestDeload, simulateProgrammingChange,
  explainProgrammingSuggestion, validateProgrammingSuggestion, createProgrammingEngine
});

if (typeof window !== "undefined") {
  window.BarbellDivaProgrammingEngine = publicApi;
  document.documentElement.dataset.programmingEngine = PROGRAMMING_ENGINE_VERSION;
  window.dispatchEvent(new CustomEvent("barbell-diva:programming-engine-ready", { detail:{ version:PROGRAMMING_ENGINE_VERSION } }));
}

export default publicApi;
