import fs from "node:fs/promises";
import assert from "node:assert/strict";

const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");

assert.match(html, /\.coach-avatar \{[^}]*background:transparent;[^}]*box-shadow:none;/);
assert.match(html, /\.coach-ai-floating \{[^}]*border:0;[^}]*background:transparent;/);
assert.match(html, /\.dashboard-coach-button \{[^}]*background:transparent;/);
assert.match(html, /data-ai-open-list>Vedi suggerimenti/);
assert.match(html, /data-ai-open-list>Vedi tutti i suggerimenti/);
assert.match(html, /if \(type === "coach-ai-list"\)/);
assert.match(html, /openCoachModal\("coach-ai-list"\)/);
assert.match(html, /class="coach-modal coach-ai-list-modal" role="dialog" aria-modal="true"/);
assert.match(html, /suggestions\.map\(coachAiSuggestionHtml\)/);
assert.match(html, /const APP_BUILD = "v102"/);

console.log(JSON.stringify({ ok:true, freeMascot:true, suggestionsPopup:true, build:"v102" }));
