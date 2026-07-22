(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.BarbellDivaAthleteContext = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const SCHEMA_VERSION = 2;
  const GOALS = ["ipertrofia", "forza massimale", "forza resistente", "ricomposizione", "dimagrimento", "mantenimento", "performance", "powerbuilding", "bodybuilding", "tecnica", "ritorno allo sport", "benessere", "preparazione gara", "personalizzato"];
  const BLOCK_TYPES = ["adattamento anatomico", "accumulo", "volume", "ipertrofia", "intensificazione", "forza", "peaking", "tecnica", "specializzazione", "realizzazione", "deload", "taper", "mantenimento", "ricondizionamento", "personalizzato"];
  const MUSCLES = ["pettorali", "dorsali", "spalle", "bicipiti", "tricipiti", "quadricipiti", "femorali", "glutei", "polpacci", "adduttori", "abduttori", "core"];
  const PATTERNS = ["squat", "hinge", "spinta orizzontale", "tirata orizzontale", "spinta verticale", "tirata verticale", "flessione ginocchio", "estensione ginocchio", "carry", "core"];
  const EQUIPMENT = ["bilanciere", "manubri", "cavi", "macchinari", "multipower", "rack", "panca", "elastici", "corpo libero", "kettlebell", "cardio"];
  const NUTRITION_PHASES = ["bulk", "lean bulk", "mantenimento", "cut", "mini cut", "reverse diet", "ricomposizione", "peak week", "non definita"];
  const PRIORITY_LEVELS = ["bassa", "media", "alta", "massima"];
  const SEVERITY_LEVELS = ["lieve", "moderata", "alta", "limitante"];
  const PAIN_STATUSES = ["attivo", "in miglioramento", "stabile", "risolto", "da valutare"];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const text = (value, fallback = "") => typeof value === "string" ? value.trim() : fallback;
  const numberOrNull = (value) => Number.isFinite(Number(value)) && value !== "" && value != null ? Number(value) : null;
  const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
  const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  function normalizeMuscleName(value) {
    const clean = text(value).toLowerCase();
    if (["deltoide", "deltoidi", "spalla", "spalle"].includes(clean)) return "spalle";
    return clean;
  }
  function muscleList(value) {
    return [...new Set(list(value).map((item) => normalizeMuscleName(typeof item === "string" ? item : item?.muscle || item?.name)).filter(Boolean))];
  }

  function createDefaultAthlete(legacy = {}) {
    const profile = legacy.profile || legacy || {};
    return {
      id: "athlete-alice",
      general: {
        name: text(profile.name, "Alice"), birthDate: "", age: null, sex: "", heightCm: null,
        weightKg: numberOrNull(profile.weight), level: text(profile.level), trainingYears: null,
        weeklySessions: null, sessionMinutes: null, coachNotes: ""
      },
      goals: { primary: "ipertrofia", secondary: [], notes: "", targetMetrics: [], targetDate: "" },
      muscles: { priorities: [], deficits: [], strengths: [], maintain: [] },
      pains: [], motorLimitations: [],
      preferences: { favoriteExercises: [], dislikedExercises: [], excludedExercises: [], preferredEquipment: [], preferredDays: [], modality: "", sessionMinutes: null, notes: "" },
      equipment: { preset: "palestra completa", items: [], custom: [] },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  }

  function normalizeAthlete(input = {}, legacy = {}) {
    const base = createDefaultAthlete(legacy);
    const general = input.general || {};
    const goals = input.goals || {};
    const muscles = input.muscles || {};
    return {
      ...base, ...input, id: text(input.id, base.id),
      general: { ...base.general, ...general, name: text(general.name, base.general.name), age: numberOrNull(general.age), heightCm: numberOrNull(general.heightCm), weightKg: numberOrNull(general.weightKg), trainingYears: numberOrNull(general.trainingYears), weeklySessions: numberOrNull(general.weeklySessions), sessionMinutes: numberOrNull(general.sessionMinutes) },
      goals: { ...base.goals, ...goals, secondary: list(goals.secondary), targetMetrics: list(goals.targetMetrics) },
      muscles: { ...base.muscles, ...muscles, priorities: list(muscles.priorities).map((item,index)=>typeof item === "string" ? { muscle:normalizeMuscleName(item), level:index===0?"alta":"media" } : { muscle:normalizeMuscleName(item.muscle || item.name), level:PRIORITY_LEVELS.includes(item.level) ? item.level : Number(item.priority)===1 ? "massima" : Number(item.priority)===2 ? "alta" : "media" }).filter((item,index,rows)=>item.muscle && rows.findIndex((other)=>other.muscle===item.muscle)===index), deficits: muscleList(muscles.deficits), strengths: muscleList(muscles.strengths), maintain: muscleList(muscles.maintain) },
      pains: list(input.pains).map((item,index)=>typeof item === "string" ? { id:`pain-legacy-${index}`, area:item, side:"non indicato", intensity:null, status:"da valutare", onsetDate:"", aggravatingMovements:[], toleratedExercises:[], notes:"", legacy:true } : { id:item.id || `pain-${index}`, area:text(item.area), side:text(item.side,"non indicato"), intensity:numberOrNull(item.intensity ?? item.severity), status:PAIN_STATUSES.includes(item.status) ? item.status : "da valutare", onsetDate:text(item.onsetDate), aggravatingMovements:list(item.aggravatingMovements), toleratedExercises:list(item.toleratedExercises), notes:text(item.notes), type:text(item.type) }),
      motorLimitations: list(input.motorLimitations).map((item,index)=>typeof item === "string" ? { id:`limit-legacy-${index}`, movement:item, severity:"moderata", status:"da valutare", description:"", affectedPatterns:[], notes:"", legacy:true } : { id:item.id || `limit-${index}`, movement:text(item.movement), severity:SEVERITY_LEVELS.includes(item.severity) ? item.severity : "moderata", status:PAIN_STATUSES.includes(item.status) ? item.status : "da valutare", description:text(item.description), affectedPatterns:list(item.affectedPatterns), notes:text(item.notes) }),
      preferences: { ...base.preferences, ...(input.preferences || {}), favoriteExercises: list(input.preferences?.favoriteExercises), dislikedExercises: list(input.preferences?.dislikedExercises), excludedExercises: list(input.preferences?.excludedExercises), preferredEquipment: list(input.preferences?.preferredEquipment), preferredDays: list(input.preferences?.preferredDays) },
      equipment: { ...base.equipment, ...(input.equipment || {}), items: list(input.equipment?.items), custom: list(input.equipment?.custom) }
    };
  }

  function createDefaultStrategy(athleteId = "athlete-alice") {
    return {
      id: "strategy-default", athleteId, name: "Strategia attuale", blockType: "intensificazione", primaryGoal: "ipertrofia",
      secondaryGoals: [], durationWeeks: 8, frequency: null, targetVolume: "moderato", targetFatigue: "moderata",
      targetRpe: "7-9", targetRir: "1-3", failurePolicy: "selettivo", restPolicy: "adeguato al gesto",
      density: "moderata", techniques: [], performanceMarkers: [], targetPatterns: [], targetMuscles: [], notes: "",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  }

  function normalizeNutrition(input = {}) {
    const phase = NUTRITION_PHASES.includes(input.phase) ? input.phase : "non definita";
    return {
      phase, source: input.source === "manual" ? "manual" : input.source === "nutrition" ? "nutrition" : "estimated",
      confidence: input.confidence || "bassa", reason: text(input.reason), targetCalories: numberOrNull(input.targetCalories),
      actualCalories: numberOrNull(input.actualCalories), maintenanceCalories: numberOrNull(input.maintenanceCalories),
      balanceCalories: numberOrNull(input.balanceCalories), weightTrend: text(input.weightTrend), adherence: numberOrNull(input.adherence),
      notes: text(input.notes), updatedAt: input.updatedAt || new Date().toISOString()
    };
  }

  function normalizeStore(input = {}, legacy = {}) {
    const raw = input && typeof input === "object" ? input : {};
    const athletes = list(raw.athletes).length ? raw.athletes.map((item) => normalizeAthlete(item, legacy)) : [createDefaultAthlete(legacy)];
    const activeAthleteId = athletes.some((item) => item.id === raw.activeAthleteId) ? raw.activeAthleteId : athletes[0].id;
    const strategies = list(raw.strategies).length ? raw.strategies.map((item) => ({ ...createDefaultStrategy(item.athleteId || activeAthleteId), ...item, secondaryGoals: list(item.secondaryGoals), techniques: list(item.techniques), performanceMarkers: list(item.performanceMarkers), targetPatterns: list(item.targetPatterns), targetMuscles: muscleList(item.targetMuscles) })) : [createDefaultStrategy(activeAthleteId)];
    const nutritionByAthlete = {};
    Object.entries(raw.nutritionByAthlete || {}).forEach(([key, value]) => { nutritionByAthlete[key] = normalizeNutrition(value); });
    if (!nutritionByAthlete[activeAthleteId]) nutritionByAthlete[activeAthleteId] = normalizeNutrition(estimateNutritionPhase(legacy.nutrition || {}));
    return {
      schemaVersion: SCHEMA_VERSION, activeAthleteId, athletes, strategies,
      nutritionByAthlete, programLinks: { ...(raw.programLinks || {}) }, insightHistory: { ...(raw.insightHistory || {}) },
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  function getAthlete(store, athleteId) { return store.athletes.find((item) => item.id === (athleteId || store.activeAthleteId)) || store.athletes[0]; }
  function getStrategy(store, strategyId, athleteId) { return store.strategies.find((item) => item.id === strategyId) || store.strategies.find((item) => item.athleteId === (athleteId || store.activeAthleteId)) || null; }
  function upsertAthlete(store, athlete) {
    const next = normalizeStore(store); const normalized = normalizeAthlete(athlete); const index = next.athletes.findIndex((item) => item.id === normalized.id);
    if (index >= 0) next.athletes[index] = normalized; else next.athletes.push(normalized); next.updatedAt = new Date().toISOString(); return next;
  }
  function upsertStrategy(store, strategy) {
    const next = normalizeStore(store); const normalized = { ...createDefaultStrategy(strategy.athleteId || next.activeAthleteId), ...strategy, updatedAt: new Date().toISOString() }; const index = next.strategies.findIndex((item) => item.id === normalized.id);
    if (index >= 0) next.strategies[index] = normalized; else next.strategies.push(normalized); next.updatedAt = normalized.updatedAt; return next;
  }
  function linkProgram(store, programId, link = {}) {
    const next = normalizeStore(store); next.programLinks[programId] = { athleteId: link.athleteId || next.activeAthleteId, strategyId: link.strategyId || "", blockType: link.blockType || "personalizzato", nutritionalPhase: link.nutritionalPhase || "non definita", freeProgram: Boolean(link.freeProgram), linkedAt: new Date().toISOString() }; next.updatedAt = new Date().toISOString(); return next;
  }

  function estimateNutritionPhase(raw = {}) {
    const target = numberOrNull(raw.kcal ?? raw.targetCalories ?? raw.targets?.calories);
    const actual = numberOrNull(raw.actualCalories ?? raw.averageCalories ?? raw.dashboard?.averageCalories);
    const maintenance = numberOrNull(raw.maintenanceCalories ?? raw.tdee ?? raw.dashboard?.tdee);
    const balance = target != null && maintenance != null ? target - maintenance : null;
    let phase = "non definita", confidence = "bassa", reason = "Dati calorici insufficienti: nessuna fase inventata.";
    if (balance != null) {
      if (balance > 300) phase = "bulk"; else if (balance > 100) phase = "lean bulk"; else if (balance < -500) phase = "mini cut"; else if (balance < -100) phase = "cut"; else phase = "mantenimento";
      confidence = "media"; reason = `Stima basata sul target calorico rispetto al mantenimento (${Math.round(balance)} kcal).`;
    }
    return { phase, source: "estimated", confidence, reason, targetCalories: target, actualCalories: actual, maintenanceCalories: maintenance, balanceCalories: balance };
  }

  function syncNutrition(store, athleteId, raw = {}) {
    const next = normalizeStore(store); const key = athleteId || next.activeAthleteId; const current = normalizeNutrition(next.nutritionByAthlete[key] || {}); const estimate = normalizeNutrition({ ...estimateNutritionPhase(raw), source: "nutrition", updatedAt: new Date().toISOString() });
    next.nutritionByAthlete[key] = current.source === "manual" ? { ...estimate, ...current, source: "manual", reason: current.reason || "Fase impostata manualmente dal coach." } : estimate;
    next.updatedAt = new Date().toISOString(); return next;
  }

  function missingFields(athlete = {}) {
    const missing = [];
    if (!athlete.general?.level) missing.push({ key: "level", label: "Livello atleta", where: "Profilo atleta › Dati generali", why: "Serve a calibrare complessità e progressione." });
    if (!athlete.goals?.primary) missing.push({ key: "goal", label: "Obiettivo primario", where: "Profilo atleta › Obiettivi", why: "Dà una direzione alle scelte del programma." });
    if (!athlete.equipment?.items?.length && athlete.equipment?.preset !== "palestra completa") missing.push({ key: "equipment", label: "Attrezzatura", where: "Profilo atleta › Attrezzatura", why: "Evita suggerimenti non eseguibili." });
    if (!athlete.muscles?.priorities?.length) missing.push({ key: "priorities", label: "Priorità muscolari", where: "Profilo atleta › Priorità", why: "Consente di confrontare volume e frequenza con le priorità reali." });
    return missing;
  }

  function selectors(storeInput, appState = {}, programId = "") {
    const store = normalizeStore(storeInput, appState); const link = store.programLinks[programId] || {}; const athlete = getAthlete(store, link.athleteId); const strategy = getStrategy(store, link.strategyId, athlete.id); const nutrition = normalizeNutrition(store.nutritionByAthlete[athlete.id] || {});
    return { schemaVersion: SCHEMA_VERSION, athlete: clone(athlete), strategy: strategy ? clone(strategy) : null, nutrition: clone(nutrition), programLink: clone(link), missing: missingFields(athlete), history: clone(store.insightHistory[athlete.id] || []) };
  }

  function validate(storeInput) {
    const store = normalizeStore(storeInput); const errors = [];
    if (!store.athletes.length) errors.push("Manca almeno un atleta.");
    if (!store.athletes.some((item) => item.id === store.activeAthleteId)) errors.push("Atleta attivo non valido.");
    Object.entries(store.programLinks).forEach(([programId, link]) => { if (!store.athletes.some((item) => item.id === link.athleteId)) errors.push(`Programma ${programId}: atleta non valido.`); });
    return { ok: errors.length === 0, errors };
  }

  return { SCHEMA_VERSION, GOALS, BLOCK_TYPES, MUSCLES, PATTERNS, EQUIPMENT, NUTRITION_PHASES, PRIORITY_LEVELS, SEVERITY_LEVELS, PAIN_STATUSES, normalizeMuscleName, createDefaultAthlete, createDefaultStrategy, normalizeAthlete, normalizeStore, normalizeNutrition, getAthlete, getStrategy, upsertAthlete, upsertStrategy, linkProgram, estimateNutritionPhase, syncNutrition, missingFields, selectors, validate, id };
});
