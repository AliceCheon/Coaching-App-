import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const enhancer = read("coach-schede-v146-enhance.js");
const css = read("coach-schede-restyle-v146.css");
const check = (condition, message) => assert.ok(condition, message);

check(html.includes('data-exercise-name-edit data-sheet-id='), "matita esercizio senza riferimenti");
check(html.includes('openCoachModalLocally("exercise-details"'), "matita non apre la scheda tecnica");
check(html.includes("✓ Esercizio salvato. La scheda tecnica è stata chiusa."), "conferma salvataggio scheda tecnica mancante");
check(html.includes("✓ Profilo tecnico salvato e finestra chiusa."), "profilo Libreria non si chiude dopo il salvataggio");

check(html.includes("COACH_HIDEABLE_COLUMNS"), "configurazione colonne nascondibili mancante");
check(html.includes("data-coach-column-toggle"), "frecce colonne mancanti");
check(html.includes("toggleCoachProgramColumn"), "toggle colonne non collegato");
check(css.includes(".coach-hide-col-type") && css.includes(".coach-hide-col-som"), "stili colonne nascoste incompleti");
check(css.includes('td[data-coach-col="load"]'), "peso non nascondibile");

check(html.includes('data-label="SOM"') && html.includes("data-inline-som-open"), "TUT non sostituito dal SOM espandibile");
check(html.includes('type === "exercise-som"'), "modale SOM mancante");
check(html.includes('inlineExercisePatch(exercise,"som"'), "salvataggio SOM globale mancante");
check(html.includes("coachExerciseSom(exercise)"), "SOM settimana 1 non condiviso");
check(html.includes("<strong>SOM</strong>") && html.includes("<strong>Note scheda</strong>"), "SOM e note non arrivano insieme nel workout");
check(enhancer.includes('t === "tut" || t === "som"'), "compatibilità TUT/SOM non mantenuta");

console.log(JSON.stringify({
  ok: true,
  build: "v146.1c8",
  checks: 15,
  fixes: "exercise-editor/save-feedback/hide-columns/som/workout"
}));
