import fs from "node:fs/promises";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const manifest = JSON.parse((await fs.readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8")).replace(/^\uFEFF/, ""));
const sw = await fs.readFile(new URL("../service-worker.js", import.meta.url), "utf8");

const required = [
  "Lavender Diva 2026",
  "--bg-main:#c9a9e8",
  "--surface:#fffafd",
  "linear-gradient(135deg,#ff3d91,#9c3df1)",
  ".bottom-nav {",
  "background:rgba(255,250,255,.92)",
  "@media(max-width:430px)",
  "workout-tabs-compact",
  "Midnight Diva 2026",
  "body[data-theme=\"dark\"]",
  "--bg-main:#070817",
  "linear-gradient(145deg,#050612 0%,#0b0b20 52%,#080719 100%)",
  "syncThemeUi()",
  "Passa al tema chiaro",
  "Passa al tema scuro"
];
required.forEach((token) => {
  if (!html.includes(token)) throw new Error(`tema incompleto: ${token}`);
});
if (!html.includes('meta name="theme-color" content="#c9a7ef"')) throw new Error("theme-color HTML non aggiornato");
if (manifest.theme_color !== "#090918" || manifest.background_color !== "#080817") throw new Error("manifest non coordinato");
if (!sw.includes('CACHE_NAME = "atlas-app-v95"')) throw new Error("cache PWA non aggiornata");
if (html.includes('<div class="battery"')) throw new Error("batteria finta ancora presente");
if (!html.includes('state.profile.theme = state.profile.theme === "light" ? "dark" : "light"')) throw new Error("pulsante tema non collegato");
if (!html.includes('themeMeta.setAttribute("content", theme === "light" ? "#c9a7ef" : "#090918")')) throw new Error("barra browser non sincronizzata al tema");
if (!html.includes('workoutView: "tabs-compact"') || !html.includes('target.training.workoutView = "tabs-compact"')) throw new Error("vista workout compatta alterata");

console.log(JSON.stringify({ ok:true, themes:["lavender-diva","midnight-diva"], toggle:true, battery:false, mobile:true, workoutView:"tabs-compact", cache:"v92" }));
