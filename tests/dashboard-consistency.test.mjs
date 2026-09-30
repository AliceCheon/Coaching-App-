import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const main = read("src/app-main.js");
const html = read("index.html");
const sw = read("service-worker.js");

assert.match(main, /function dashboardStreakWeeks\(\)/, "manca il calcolo della streak settimanale");
assert.match(main, /function dashboardHeatmapHtml\(/, "manca la heatmap di costanza");
assert.match(main, /function dashboardRecentPRs\(/, "manca il calcolo dei PR recenti");
assert.match(main, /\$\{dashboardConsistencyHtml\(\)\}/, "la dashboard non monta la sezione costanza/record");
assert.match(html, /diva-dashboard\.css/, "lo stile della dashboard non è collegato");
assert.match(sw, /\.\/diva-dashboard\.css/, "diva-dashboard.css non è nell'APP_SHELL (offline)");

console.log(JSON.stringify({ ok: true, dashboard: "streak + heatmap + PR recenti" }));
