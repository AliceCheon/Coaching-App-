import fs from "node:fs";

const css = fs.readFileSync("coach-schede-restyle-v146.css", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");

const checks = [
  [css.includes("width: 14px !important"), "binario nascosto non ridotto"],
  [css.includes("max-width: 14px !important"), "cella nascosta ancora troppo larga"],
  [css.includes("col.col-rpe      { width: 56px !important; }"), "colonna RPE non ampliata"],
  [css.includes("col.col-rir      { width: 56px !important; }"), "colonna RIR non ampliata"],
  [css.includes("col.col-tut      { width: 76px !important; }"), "colonna SOM non ampliata"],
  [css.includes("min-height: 30px !important"), "campi ancora troppo bassi"],
  [css.includes("font-size: 12px !important"), "testo dei campi ancora troppo piccolo"],
  [html.includes("coach-schede-restyle-v146.css?v=v1461c10"), "cache bust CSS c10 mancante"],
  [sw.includes('const CACHE_NAME = "atlas-app-v14719-cleanup"'), "cache PWA c10 mancante"]
];

for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log(JSON.stringify({
  ok: true,
  build: "v146.1c10",
  checks: checks.length,
  fix: "compact hidden rails and readable RPE RIR SOM fields"
}));
