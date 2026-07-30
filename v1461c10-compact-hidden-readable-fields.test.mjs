import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "workout-flow-v147.js"), "utf8");
const css = fs.readFileSync(path.join(root, "workout-flow-v147.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

test("la build carica il nuovo workout senza immagini decorative", () => {
  assert.match(html, /workout-flow-v147\.css/);
  assert.match(html, /workout-flow-v147\.js/);
  assert.doesNotMatch(js, /<img|background-image|generated_images/i);
});

test("il flusso separa anteprima e workout attivo", () => {
  assert.match(js, /INIZIA WORKOUT/);
  assert.match(js, /Scaletta workout/);
  assert.match(js, /Workout in corso/);
  assert.match(js, /NOTE PERSONALI/);
  assert.match(js, /NOTA COACH/);
  assert.match(js, />SOM</);
});

test("non introduce timer o pannelli recupero", () => {
  assert.doesNotMatch(js, /data-rest-timer|timerRemaining|Recupero previsto/);
});

test("registra kg ripetizioni e RIR reali nel salvataggio", () => {
  assert.match(js, /completedSetsFor/);
  assert.match(js, /data-v147-set-field="kg"/);
  assert.match(js, /data-v147-set-field="reps"/);
  assert.match(js, /data-v147-set-field="rpe"/);
  assert.match(js, /data-v147-set-field="rir"/);
  assert.match(html, /BarbellDivaWorkoutV147\?\.completedSetsFor/);
});

test("la conferma chiude davvero la serie e consente di riaprirla", () => {
  assert.match(js, /v147-set-row-closed/);
  assert.match(js, /Serie completata/);
  assert.match(js, /data-v147-reopen-set/);
  assert.match(js, /nextIncomplete/);
});

test("copia una serie completa nella successiva", () => {
  assert.match(js, /function copySetToNext/);
  assert.match(js, /data-v147-copy-set/);
  assert.match(js, /\["kg", "reps", "rpe", "rir"\]/);
});

test("l'anteprima mostra serie e ripetizioni ed è espandibile", () => {
  assert.match(js, /serie ·/);
  assert.match(js, /rip/);
  assert.match(js, /data-v147-preview-toggle/);
  assert.match(js, /workoutPreviewExpanded/);
});

test("annulla workout elimina la bozza senza inviarla al Logbook", () => {
  assert.match(js, /function cancelWorkout/);
  assert.match(js, /data-v147-cancel/);
  assert.match(js, /state\.training\.activeWorkout = null/);
  assert.match(js, /Nessun dato è stato salvato nel Logbook/);
});

test("gli asset v147 sono inclusi nella cache PWA", () => {
  assert.match(sw, /workout-flow-v147\.css/);
  assert.match(sw, /workout-flow-v147\.js/);
});

test("il layout mobile conserva campi utilizzabili", () => {
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /grid-template-columns: 42px minmax\(50px/);
});
