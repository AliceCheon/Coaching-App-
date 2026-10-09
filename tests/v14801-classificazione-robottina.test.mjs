import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const masterLib = fs.readFileSync(path.join(root, "master-exercise-library.js"), "utf8");
const inlineCss = fs.readFileSync(path.join(root, "coach-studio-inline.css"), "utf8");
const studioCss = fs.readFileSync(path.join(root, "coach-studio.css"), "utf8");

// ---- FIX 1 — "Da classificare" è un segnaposto, non una classificazione ----
assert.match(masterLib, /function isPlaceholderCategory\(value\)/);
assert.match(masterLib, /PLACEHOLDER_CATEGORIES/);
// I primari segnaposto non sopravvivono più: la categoria vera diventa primario.
assert.match(masterLib, /filter\(item=>!isPlaceholderCategory\(item\.name\)\)/);
assert.match(masterLib, /!isPlaceholderCategory\(identity\.category\)/);
assert.match(masterLib, /riparo inverso/);
// La proiezione tecnica filtra i segnaposto e preferisce la categoria del coach.
assert.match(mainJs, /function isPlaceholderMuscleLabel\(/);
assert.match(mainJs, /function technicalRealMuscleList\(/);
assert.match(mainJs, /const categoryValue = /);
assert.match(mainJs, /primaryMuscles: realPrimary,/);
assert.doesNotMatch(mainJs, /primaryMuscles: technicalStringList\(source\.primaryMuscles\?\.length/);
// Classificare Dalla scheda aggiorna la Master Library (fine del "Da classificare" eterno).
assert.match(mainJs, /isPlaceholderMuscleLabel\(masterRecord\.identity\?\.category\)/);

// ---- FIX 2 — Statistiche: colonna esercizi del gruppo selezionato ----
assert.match(mainJs, /function coachProgramMuscleExerciseRows\(program, weekNumber\)/);
assert.match(mainJs, /coach-statistics-charts\$\{selected==="all"\?"":" with-exercises"\}/);
assert.match(mainJs, /coach-statistics-exercises/);
assert.match(mainJs, /Esercizi che compongono|qui compaiono tutti gli esercizi/);
assert.match(studioCss, /\.coach-statistics-charts\.with-exercises\{grid-template-columns:minmax\(0,\.8fr\)/);
assert.match(studioCss, /\.coach-statistics-charts\.with-exercises\{grid-template-columns:1fr\}/);

// ---- FIX 3 — Robottina: animazioni e trascinamento ----
// La scelta dentro l'app decide le animazioni (niente override silenzioso del sistema).
assert.match(mainJs, /function effectiveAnimationMode\(\) \{\s*\n\s*return state\.ui\?\.animationMode \|\| "full";/);
assert.doesNotMatch(mainJs, /return window\.matchMedia\?\.\("(prefers-reduced-motion: reduce)"\)\?\.matches \? "reduced" : \(state\.ui\?\.animationMode/);
// Il CSS non spenge più la Diva Bot quando la modalità app è "full".
assert.match(inlineCss, /body:not\(\[data-animation-mode="full"\]\) \.diva-bot/);
// Due strade per il drag: delega document + binding diretto, un solo avvio.
assert.match(mainJs, /function startWorkoutMascotDrag\(event\)/);
assert.match(mainJs, /startWorkoutMascotDrag\(event\);\s*\n\s*\}, true\)/);
assert.match(mainJs, /wmDragDirectBound/);
assert.match(mainJs, /setPointerCapture\?\.\(event\.pointerId\)/);
assert.match(mainJs, /if \(!workoutMascotUi\.drag\) moveWorkoutMascot\(state\.ui\.workoutMascotPosition \|\| "top-right"\)/);

console.log(JSON.stringify({ ok: true, classificazione: true, statisticheEsercizi: true, robottinaAnimataEDraggibile: true }));
