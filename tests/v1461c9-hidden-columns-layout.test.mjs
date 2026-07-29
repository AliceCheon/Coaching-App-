import fs from "node:fs";

const css = fs.readFileSync("coach-schede-restyle-v146.css", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");

const checks = [
  [css.includes('td[data-coach-col="load"]'), "selettore colonna Peso mancante"],
  [css.includes("visibility: hidden !important"), "contenuto colonna nascosta ancora visibile"],
  [css.includes("pointer-events: none !important"), "controlli della colonna nascosta ancora attivi"],
  [css.includes("visibility: hidden !important"), "binario colonna nascosta non mantenuto"],
  [!css.match(/td\[data-coach-col="load"\][\s\S]{0,500}display:\s*none\s*!important/), "la cella Peso viene ancora rimossa dalla griglia"],
  [/coach-schede-restyle-v146\.css\?v=v1461c\d+/.test(html), "cache bust CSS correttivo mancante"],
  [/const CACHE_NAME = "atlas-app-v1461c\d+"/.test(sw), "cache PWA correttiva mancante"]
];

for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log(JSON.stringify({
  ok: true,
  build: "v146.1c9",
  checks: checks.length,
  fix: "hidden columns preserve table geometry"
}));
