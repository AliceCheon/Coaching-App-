// v147.93 — FASE 3 (Animazioni + mascotte).
// Guardie anti-regressione sul layer motion introdotto/rifinito in questa fase:
//  3.1 transizioni di schermata + cambio route Coach Studio + ingresso modali;
//  3.2 micro-animazioni UI (nav pop, hover-lift su puntatori fini);
//  3.3 nuove reazioni della mascotte (salvataggio programma, export backup).
// Le guardie verificano anche che i modi di accessibilità (reduced/off e
// prefers-reduced-motion) degradino correttamente: le animazioni NON devono
// restare obbligatorie.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const css = await fs.readFile(new URL("../coach-studio-inline.css", import.meta.url), "utf8");
const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");

test("3.1 — transizione di schermata e di route del Coach Studio", () => {
  // La transizione di schermata resta agganciata e non parte mai senza changement reale.
  assert.ok(css.includes(".screen.screen-enter"), "manca la transizione .screen-enter");
  assert.ok(css.includes("@keyframes premiumScreenIn"), "manca premiumScreenIn");
  // Route interna del Coach Studio.
  assert.ok(css.includes(".coach-studio-page.route-enter"), "manca .coach-studio-page.route-enter");
  assert.ok(css.includes("@keyframes premiumRouteIn"), "manca premiumRouteIn");
  assert.ok(appMain.includes('coachStudioState().route'), "render() non legge la route del Coach Studio");
  assert.ok(appMain.includes("renderKeyChanged"), "render() non rileva il cambio di chiave (schermo+route)");
  assert.ok(appMain.includes('classList.add("route-enter")'), "render() non applica route-enter al cambio route");
});

test("3.1 — ingresso animato dei modali", () => {
  assert.ok(css.includes("@keyframes coachModalIn"), "manca coachModalIn");
  assert.ok(/\.coach-modal \{ animation:coachModalIn/.test(css), "il modale non ha l'animazione d'ingresso");
  assert.ok(/\.coach-modal-backdrop \{ animation:premiumFadeIn/.test(css), "il backdrop non ha la dissolvenza d'ingresso");
});

test("3.2 — micro-animazioni UI con hover limitato a puntatori fini", () => {
  assert.ok(css.includes("@media (hover:hover) and (pointer:fine)"), "l'hover-lift non è limitato ai puntatori fini");
  assert.ok(/\.coach-studio-card:hover,\s*\.coach-studio-kpi:hover/.test(css), "manca l'hover-lift delle card coach");
  assert.ok(css.includes("@keyframes navPop"), "manca navPop");
  assert.ok(/\.top-tab\.active, \.nav-button\.active \{ animation:navPop/.test(css), "il pop di navigazione non è agganciato ai tab attivi");
});

test("3.2/3.1 — degradazione accessibilità (reduced/off e prefers-reduced-motion)", () => {
  assert.ok(/body\[data-animation-mode="reduced"\] \.coach-studio-page\.route-enter/.test(css), "route-enter non degrada in reduced");
  assert.ok(/body\[data-animation-mode="reduced"\] \.coach-modal/.test(css), "il modale non degrada in reduced");
  assert.ok(/body\[data-animation-mode="reduced"\] \.top-tab\.active/.test(css), "nav pop non disattivato in reduced");
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "manca la guardia prefers-reduced-motion");
  assert.ok(/body\[data-animation-mode="off"\]/.test(css), "manca il modo 'off'");
});

test("3.3 — nuove reazioni della mascotte su azioni del Coach Studio", () => {
  assert.ok(appMain.includes("program_saved:{"), "manca l'evento program_saved");
  assert.ok(appMain.includes("backup_exported:{"), "manca l'evento backup_exported");
  assert.ok(appMain.includes('program_saved:{ balanced:'), "manca il messaggio di program_saved");
  assert.ok(appMain.includes('backup_exported:{ balanced:'), "manca il messaggio di backup_exported");
  assert.ok(appMain.includes('triggerDivaBotReaction("program_saved")'), "il salvataggio programma non innesca la reazione");
  assert.ok(appMain.includes('triggerDivaBotReaction("backup_exported")'), "l'export backup non innesca la reazione");
});

test("3 — la mascotte resta fuori flusso (nessuna regressione del FlexWindow)", () => {
  // #globalDivaBotHost deve restare position:relative (non static): altrimenti
  // torna in flusso e allunga il documento oltre 100dvh sul cover screen.
  assert.ok(!/#globalDivaBotHost\s*\{\s*position:\s*static/.test(css), "#globalDivaBotHost non deve tornare in flusso (position:static)");
});

console.log(JSON.stringify({ ok: true, phase: 3, animations: true, mascot: true, reducedMotion: true }));
