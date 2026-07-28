import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "coach-tools-v1451.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const check = (condition, message) => assert.ok(condition, message);

for (const marker of [
  "coachProgramToolsToolbarHtml",
  "openCoachWeekCopyModal",
  "copyCoachProgramWeek",
  "undoCoachProgramWeekCopy",
  "openCoachWeekCompareModal",
  "openCoachWeekTrendModal",
  "data-coach-week-copy",
  "data-coach-week-compare",
  "data-coach-week-trend",
  "weekCopyUndo"
]) check(html.includes(marker), `strumento Coach mancante: ${marker}`);

check(html.includes('class="coach-exercise-name-text" data-inline-replace='), "il nome esercizio non apre la sostituzione");
check(html.includes("coach-tools-v1451.css?v=v1451"), "foglio stile strumenti non caricato");
check(sw.includes('"./coach-tools-v1451.css"'), "foglio stile strumenti non precaricato");
check(css.includes("@media (prefers-reduced-motion: reduce)"), "manca la riduzione animazioni");
check(!html.includes("/api/coach/state"), "sync esterno incompatibile reintrodotto");

console.log(JSON.stringify({ok:true,build:"v145.1",checks:15,features:"copy/undo/compare/trend/replace"}));
