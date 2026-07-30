import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const html = fs.readFileSync(new URL("index.html", root), "utf8");
const editorCss = fs.readFileSync(new URL("coach-program-editor-19.8.css", root), "utf8");

const checks = [
  ["Coach integrato nella barra principale", html.includes('data-main-coach-route="programs"') && html.includes("rail-coach-subnav")],
  ["Coach assente dalla barra telefono", !html.includes('class="nav-button coach-nav" data-bottom="coach"')],
  ["Editor a griglia con anteprima laterale", html.includes("coach-layout-grid") && html.includes("coach-reference-panel")],
  ["Anteprima atleta in sola lettura", html.includes("Sola lettura") && html.includes("data-studio-panel-close=\"reference\"")],
  ["Campi inline senza render a ogni carattere", html.includes("updateInlineExerciseField(input,false)") && html.includes("scheduleCoachEditorSave")],
  ["Menu esercizio ancorato e scrollabile", editorCss.includes(".coach-row-more > div") && editorCss.includes("max-height:min(420px")],
  ["Apertura editor progressione", html.includes('data-progression-open') && html.includes('openCoachModalLocally("progression-editor"')],
  ["Rimozione progressione gestita", html.includes('data-progression-remove') && html.includes("Progressione rimossa")],
  ["Filtro muscoli centralizzato", html.includes("function coachExerciseMuscleTokens") && html.includes("coachExerciseMuscleTokens(item)")],
  ["Riduzione movimento rispettata", editorCss.includes("prefers-reduced-motion")],
  ["Pannello Coach aggiornabile localmente", html.includes("renderCoachSidePanelLocal") && html.includes("renderCoachAfterFeedback")],
  ["Board Coach aggiornabile localmente", html.includes("renderCoachProgramBoardLocal") && html.includes("bindCoachEditorDelegation")],
  ["Grafici globali esclusi dal render Coach", html.includes('if (activeScreen !== "coach")') && html.includes("renderEngine()") && html.includes("drawCharts()")],
  ["Modal salvata senza render globale quando possibile", html.includes("refreshCoachAfterLocalModal")],
  ["Nessun modulo Workout Pro standalone", !fs.existsSync(new URL("workout-pro.js", root))],
  ["Nessun modulo Nutrizione standalone", !fs.existsSync(new URL("nutrizione/index.html", root))],
];

for (const [name, ok] of checks) assert.equal(ok, true, name);
console.log(JSON.stringify({ ok:true, build:"v145-coach-safe", checks:checks.length, mobileCoach:false }));
