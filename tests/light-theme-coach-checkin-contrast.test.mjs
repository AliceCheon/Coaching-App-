import fs from "node:fs/promises";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");

const required = [
  "Contrasto Lavender Diva",
  'body[data-theme="light"] .coach-ai-filter',
  'body[data-theme="light"] .coach-weeks-grid textarea',
  'body[data-theme="light"] .advanced-volume-card',
  'body[data-theme="light"] .phase-node',
  'body[data-theme="light"] .checkin-option.active',
  'body[data-theme="light"] .checkin-option:has(input:checked)',
  'background:color-mix(in srgb,var(--accent) 24%,#fff)',
  'class="coach-muscle-card coach-mascot-tip"',
  "const aiSuggestionCount = coachAiSuggestions().length",
  "${coachMascotHtml()}"
];

required.forEach((token) => {
  if (!html.includes(token)) throw new Error(`correzione tema chiaro mancante: ${token}`);
});

const workbenchStart = html.indexOf("function coachWorkbenchHtml()");
const workbenchEnd = html.indexOf("function coachProgramArchiveHtml()", workbenchStart);
const workbench = html.slice(workbenchStart, workbenchEnd);
if (workbench.includes("muscle-map-premium.png")) throw new Error("la vecchia immagine anatomica compare ancora nel Coach");
if (!workbench.includes("coachMascotHtml()")) throw new Error("robottino Coach non riutilizzato nel pannello");
if (!html.includes('body[data-theme="dark"] .coach-mascot-tip')) throw new Error("stile scuro del robottino non preservato");
if (!html.includes('sessionStorage.getItem("atlas-v97-reload")')) throw new Error("ricarica PWA v97 mancante");

console.log(JSON.stringify({ ok:true, coachContrast:true, checkinContrast:true, mascot:true, cache:"v92" }));
