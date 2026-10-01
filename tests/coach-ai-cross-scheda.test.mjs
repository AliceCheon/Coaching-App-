// Fase 11 — Coach AI deve leggere lo storico di un esercizio su TUTTE le schede
// (non solo quella in esame), usare le note del logbook e produrre testi distinti
// ("cosa ho trovato" ≠ "perché conta"), invece del vecchio "regressione da
// approfondire" senza contesto.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

await import(pathToFileURL(path.join(root, "coach-ai-engine-2.js")).href);
await import(pathToFileURL(path.join(root, "decision-rules.js")).href);

const ai2 = globalThis.BarbellDivaCoachAI2;
const rules = globalThis.BarbellDivaDecisionRules;

const program = {
  id: "p1",
  name: "Programma test",
  sheets: [{ id: "s1", name: "Scheda A", week: 1, exercises: [{ id: "e1", name: "Lat machine", sets: 4, reps: "10", masterExerciseId: "m-lat", variantRole: "standard" }] }],
};

const sessions = [
  { id: "w1", dateInput: "2026-09-01", programId: "p1", sheetId: "s1", exercises: [{ name: "Lat machine", masterExerciseId: "m-lat", completedSets: [{ kg: 50, reps: 10, rir: 2 }] }] },
  { id: "w2", dateInput: "2026-09-08", programId: "p1", sheetId: "s2", exercises: [{ name: "Lat machine", masterExerciseId: "m-lat", completedSets: [{ kg: 55, reps: 10, rir: 2 }], userNote: "buona sensazione" }] },
  { id: "w3", dateInput: "2026-09-15", programId: "p1", sheetId: "s3", exercises: [{ name: "Lat machine", masterExerciseId: "m-lat", completedSets: [{ kg: 60, reps: 10 }] }] },
  { id: "w4", dateInput: "2026-09-22", programId: "p1", sheetId: "s3", exercises: [{ name: "Lat machine", masterExerciseId: "m-lat", completedSets: [{ kg: 62.5, reps: 10 }] }] },
  // Variante con scheda tecnica diversa: NON deve entrare nello storico.
  { id: "w5", dateInput: "2026-09-25", programId: "p1", sheetId: "s4", exercises: [{ name: "Lat machine", masterExerciseId: "m-lat-stretta", completedSets: [{ kg: 100, reps: 3 }] }] },
];

test("lo storico dello stesso esercizio unisce tutte le schede e ignora le varianti con master diverso", () => {
  const out = ai2.analyze({ program, sessions, context: {}, masterLibrary: { records: [] } });
  const analysis = out.metrics.exerciseAnalyses[0];
  assert.equal(analysis.history.length, 4, "le 4 sedute dello stesso esercizio su 3 schede devono unirsi");
  assert.equal(analysis.trend.sedute, 4);
  assert.equal(analysis.trend.schede, 3, "lo storico deve contare le schede diverse");
  assert.equal(analysis.trend.status, "improving");
  assert.match(analysis.trend.reason, /schede/, "il motivo deve dire che unisce più schede");
});

test("le note del logbook finiscono nel trend e fra i dati usati", () => {
  const out = ai2.analyze({ program, sessions, context: {}, masterLibrary: { records: [] } });
  const analysis = out.metrics.exerciseAnalyses[0];
  assert.equal(analysis.trend.note, "buona sensazione");
  const insight = out.insights.find((item) => item.category === "exercise-performance");
  assert.ok(insight, "serve un rilievo sull'esercizio");
  assert.notEqual(insight.description, insight.reason, "'cosa ho trovato' e 'perché conta' devono essere diversi");
  assert.match(insight.description, /schede/, "la descrizione deve contestualizzare sulle schede");
  assert.ok(
    (insight.data || []).some((item) => item.label === "Nota del logbook"),
    "la nota del logbook deve comparire fra i dati usati"
  );
});

test("la regola performance non ripete il testo e passa identità/descrizione", () => {
  const rule = rules.RULES.find((item) => item.id === "performance.stalled-progression");
  const [raw] = rule.evaluate({
    analysis: {
      metrics: {
        exerciseAnalyses: [{
          name: "Lat machine",
          variantLabel: "Lat machine",
          id: "e1",
          sheetId: "s1",
          masterExerciseId: "m-lat",
          identityKey: "program|w1|s1|e1|standard",
          variantRole: "standard",
          trend: { status: "declining", changePct: -12.5, confidence: "media", reason: "Stima di forza su 5 sedute su 2 schede: -12.5%.", sedute: 5, schede: 2 },
          progression: { status: "not-working", reason: "Progressione non efficace." },
        }],
      },
    },
    context: {},
  });
  assert.ok(raw, "la regola deve produrre un rilievo su un calo");
  assert.ok(raw.description && raw.description.length > 0, "serve una descrizione con i fatti");
  assert.notEqual(raw.description, raw.rationale, "descrizione e motivo non devono coincidere");
  assert.match(raw.title, /calo/i, "il titolo non deve più dire genericamente 'regressione da approfondire'");
  assert.equal(raw.identityKey, "program|w1|s1|e1|standard", "l'identità serve a fondere il rilievo della regola con quello del motore");
});

test("la UI compatta mostra le evidenze inline e i punti di forza", () => {
  const appMain = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
  assert.ok(appMain.includes("coachAiPriorityCardsV2Html(items.slice(0,3),true)"), "la scheda compatta deve passare inline=true");
  assert.ok(appMain.includes('class="ai-inline-evidence"'), "manca il blocco dati inline");
  assert.ok(appMain.includes('id="ai-strengths"'), "manca la sezione Punti di forza");
});
