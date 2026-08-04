import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const enhancer = read("coach-schede-v146-enhance.js");
const restyle = read("coach-schede-restyle-v146.css");
const config = read("app-config-v144.js");
const manifest = read("manifest.webmanifest");
const sw = read("service-worker.js");
const workflow = read(".github/workflows/tests.yml");
const check = (condition, message) => assert.ok(condition, message);

const buildMatch = config.match(/build:\s*"([^"]+)"/);
const cacheMatch = config.match(/cache:\s*"([^"]+)"/);
const currentBuild = buildMatch?.[1] || "";
const currentCache = cacheMatch?.[1] || "";
check(!!currentBuild, "build non leggibile in app-config-v144.js");
check(!!currentCache, "cache non leggibile in app-config-v144.js");
check(sw.includes(`const CACHE_NAME = "${currentCache}"`), "service worker non allineato alla cache corrente");
check(sw.includes('"./coach-schede-restyle-v146.css"'), "CSS v146 non precaricato");
check(sw.includes('"./coach-schede-v146-enhance.js"'), "JS v146 non precaricato");
check(manifest.includes("index.html?v=v1461c10"), "manifest contrasto non aggiornato");
check(html.includes("coach-schede-restyle-v146.css?v=v1461c10"), "CSS senza cache bust contrasto");
check(html.includes("coach-schede-v146-enhance.js?v=v1461c10"), "JS senza cache bust v146.1");

check(html.includes("window.BarbellDivaV146Bridge={"), "bridge correttivo mancante");
check(html.includes('openCoachModalLocally("sheet-edit",{sheetId})'), "rinomina locale non collegata");
check(enhancer.includes("BarbellDivaV146Bridge?.openSheetEdit"), "pennino non usa la modale locale");
check(enhancer.includes("closeSheetEditReliably") && html.includes("closeModal(){"), "chiusura rinomina affidabile mancante");
check(enhancer.includes('openExerciseLibrary(sheetId, "circuit")'), "Circuito non apre la libreria in modo sicuro");
check(!/data-schede-add-circuit[\s\S]{0,1200}setTimeout/.test(enhancer), "Circuito contiene ancora click ritardati");
check(!/data-schede-add-circuit[\s\S]{0,1200}set-link-button/.test(enhancer), "Circuito modifica ancora i collegamenti esistenti");

check(html.includes("function openCoachExerciseTrendModal"), "Trend esercizio mancante");
check(html.includes("serie programmate per questo esercizio"), "Trend esercizio non specifico");
check(html.includes("function openCoachExerciseWeightHistoryModal"), "Storico pesi reale mancante");
check(html.includes("openExerciseHistory(programId,sheetId,exerciseId)"), "bridge Storico pesi mancante");
check(html.includes("exerciseMedia(exerciseName)"), "risoluzione media esercizio mancante");
check(enhancer.includes("BarbellDivaV146Bridge?.exerciseMedia"), "thumbnail non usa la libreria reale");

check(workflow.includes("v1461-corrections.test.mjs"), "test v146.1 non eseguito da GitHub");
check(restyle.includes('body[data-theme="light"] .schede-v146-duration-pill'), "contrasto durata tema chiaro mancante");
check(restyle.includes('body[data-theme="light"] .schede-v146-day-footer button'), "contrasto pulsanti footer tema chiaro mancante");
check(restyle.includes('body[data-theme="light"] .coach-editor-weekly button:disabled'), "contrasto controlli disabilitati tema chiaro mancante");

console.log(JSON.stringify({
  ok: true,
  build: currentBuild,
  checks: 24,
  corrections: "circuit/trend/media/rename/cache/ci/light-contrast"
}));
