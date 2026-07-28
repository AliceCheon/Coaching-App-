import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "unified-sidebar-v1452.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const check = (condition, message) => assert.ok(condition, message);

for (const text of ["Dashboard","Workout del giorno","Allenamento","Programmi","Progressioni","Libreria esercizi","Coach AI","Analisi progressi","Logbook","Check-in","Impostazioni","Diva Bot"]) {
  check(html.includes(text), `voce navigazione mancante: ${text}`);
}
for (const route of ["programs","progressions","library","ai"]) {
  check(html.includes(`data-main-coach-route="${route}"`), `sottovoce Coach mancante: ${route}`);
}
check(!html.includes('<aside class="coach-video-sidebar"'), "seconda barra Coach ancora generata");
check(!html.includes('data-bottom="coach"'), "vecchia voce Coach Studio ancora nella barra");
check(html.includes('if(next==="program")') && html.includes("state.ui.mainNavCollapsed=true"), "auto-riduzione editor mancante");
check(html.includes("openCoachRouteFromMainNav"), "navigazione Coach unificata non collegata");
check(html.includes("unified-sidebar-v1452.css?v=v1452"), "stile barra unificata non caricato");
check(sw.includes('"./unified-sidebar-v1452.css"'), "stile barra unificata non precaricato");
check(css.includes(".rail-coach-subnav") && css.includes("body.nav-collapsed .rail-coach-subnav"), "stati barra aperta/ridotta mancanti");
check(!/coach-row-more[\s\S]{0,650}Sostituisci/.test(html), "Sostituisci è ancora nel menu Azioni");
check(html.includes('class="coach-exercise-name-text" data-inline-replace='), "sostituzione dal nome esercizio rimossa per errore");

console.log(JSON.stringify({ok:true,build:"v145.2",checks:25,sidebar:"unified",editorAutoCollapse:true}));
