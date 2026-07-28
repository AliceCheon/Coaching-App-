import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const enhancer = read("coach-schede-v146-enhance.js");
const restyle = read("coach-schede-restyle-v146.css");
const sidebar = read("unified-sidebar-v1452.css");
const studio = read("coach-studio.css");
const check = (condition, message) => assert.ok(condition, message);

const rowStart = html.lastIndexOf('function coachInlineExerciseRowHtml');
const rowEnd = html.indexOf('function coachProgramSheetHtml', rowStart);
const row = html.slice(rowStart, rowEnd);
const labels = [
  "Storico pesi",
  "Copia esercizio",
  "Allegati",
  "Elimina esercizio",
  "Progressione",
  "Aggiungi",
];
let cursor = -1;
for (const label of labels) {
  const position = row.indexOf(label, cursor + 1);
  check(position > cursor, `azione ${label} mancante o fuori ordine`);
  cursor = position;
}

check(html.includes('data-program-board-add-kind="exercise"'), "azione Aggiungi exercise mancante");
for (const kind of ["superset", "multiset", "alternative", "circuit"]) {
  check(html.includes(`data-set-group-action="${kind}"`), `azione Aggiungi ${kind} mancante`);
}

check(!enhancer.includes('className = "schede-v146-row-trend"'), "Trend duplicato ancora iniettato nella riga");
check(html.includes('class="coach-statistics-fab coach-trend-launch"'), "Trend non è accanto a Statistiche");
check(html.includes("coach-trend-filters") && html.includes("coach-trend-kpis"), "Trend interattivo incompleto");
check(restyle.includes(".coach-trend-filters button.active"), "stile filtri Trend mancante");

check(enhancer.includes("schede-v146-focus-pills"), "gruppi muscolari della scheda mancanti");
check(enhancer.includes("ensureExerciseMuscles"), "autocompilazione muscoli non collegata");
check(html.includes("ensureExerciseMuscles(programId,sheetId,exerciseId)"), "bridge autocompilazione muscoli mancante");
check(html.includes("technicalEvidenceProfile"), "fallback Coach AI per muscoli mancante");
check(restyle.includes(".coach-inline-sub span::before"), "secondario sotto esercizio non visibile");

check(html.includes("data-editor-nav-restore"), "pulsante ripristino barra mancante");
check(sidebar.includes("body.coach-mode.coach-editor-nav-hidden .desktop-rail"), "barra non scompare nell'editor");
check(sidebar.includes(".coach-editor-nav-restore"), "stile pulsante ripristino barra mancante");

check(html.includes("data-global-diva-draggable"), "Diva Bot non trascinabile");
check(html.includes('addEventListener("pointermove"'), "drag Diva Bot non collegato");
check(studio.includes("cursor:grab") && studio.includes(".global-diva-bot.is-dragging"), "stile drag Diva Bot mancante");

console.log(JSON.stringify({
  ok: true,
  build: "v146.1",
  checks: 25,
  ux: "sidebar/actions/trend/muscles/diva"
}));
