import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const html = read("index.html");
const coachCss = read("coach-studio.css");
const serviceWorker = read("service-worker.js");
const config = read("app-config-v144.js");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(config.includes('build: "v145.2"'), "La build non è v145.2.");
check(serviceWorker.includes('const CACHE_NAME = "atlas-app-v1452"'), "La cache PWA non è v145.2.");
check(html.includes("data-unified-training-toggle"), "Allenamento non è più un menu espandibile nella barra principale.");
for (const unwanted of ["Completato", "Workout", "Pacchetti", "Abbonamenti"]) {
  check(!html.includes(`["${unwanted}"`), `Voce Coach indesiderata reintrodotta: ${unwanted}.`);
}
check(html.includes("closeCoachSidePanelLocal"), "Manca la chiusura locale veloce di Anteprima atleta.");
check(html.includes("coachProgramStatisticsModalHtml"), "Manca la finestra Statistiche programma.");
check(html.includes("data-coach-stats-muscle"), "I muscoli delle statistiche non sono selezionabili.");
check(coachCss.includes(".program-board-bot{display:none!important}"), "La seconda Diva Bot potrebbe tornare visibile.");
check(!html.includes("/api/coach/state"), "È stato reintrodotto l'auto-sync incompatibile con GitHub Pages.");
for (const file of ["coach-extras.js", "coach-layout-refactor.js", "coach-video-polish.js", ".ruff_cache"]) {
  check(!fs.existsSync(path.join(root, file)), `File rischioso o temporaneo presente: ${file}.`);
}
check(fs.existsSync(path.join(root, ".nojekyll")), "Manca .nojekyll per GitHub Pages.");

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({ ok:true, build:"v145.2", checks:15, guard:"coach navigation/stats/preview/sync/cache" }));
