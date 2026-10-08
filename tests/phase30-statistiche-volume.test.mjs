import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const css = fs.readFileSync(path.join(root, "coach-studio-inline.css"), "utf8");
const all = html + "\n" + app + "\n" + css;

// --- Navigazione: "Analisi progressi" rinominata in "Statistiche" ---
assert.match(html, /data-screen="progress">Statistiche</);
assert.match(html, /data-jump="progress" title="Statistiche"/);
assert.doesNotMatch(html, /data-screen="progress">Analisi progressi</);
assert.match(app, /progress: \["Statistiche", "Analisi progressi e volume"\]/);

// --- Route: la schermata progress monta statisticsHtml ---
assert.match(app, /activeScreen === "progress"\) newScreenHtml = statisticsHtml\(\)/);

// --- Due tab dentro Statistiche ---
assert.match(app, /function statisticsHtml\(\)/);
assert.match(app, /function statisticsTab\(\)/);
assert.match(app, /data-statistics-tab="progress"/);
assert.match(app, /data-statistics-tab="volume"/);
assert.match(all, /\.statistics-tabs/);
assert.match(all, /\.statistics-tab\.active/);

// --- Tab Volume: dati da VOLUME_HISTORY (volume per gruppo muscolare) ---
assert.match(app, /function statisticsVolumeHtml\(\)/);
assert.match(app, /const total = rows\.reduce\(\(sum, row\) => sum \+ row\.total, 0\)/);
assert.match(app, /function currentVolumeRows\(\)/);
assert.match(app, /function currentVolumeBlock\(\)/);
assert.match(app, /id="volumeSheetSelect"/);

// --- Grafici: torta (gruppi muscolari) + linee (settimane) ---
assert.match(app, /id="volumePieChart"/);
assert.match(app, /id="volumeLineChart"/);
assert.match(app, /function drawVolumeCharts\(\)/);
assert.match(app, /function drawVolumePie\(\)/);
assert.match(app, /function drawVolumeLines\(\)/);
assert.match(app, /drawVolumeCharts\(\);[\s\S]{0,20}\}/);

// --- Confronto schede per gruppo muscolare ---
assert.match(app, /function volumeComparisonHtml\(blocks\)/);
assert.match(app, /Confronto schede per gruppo muscolare/);
assert.match(all, /\.volume-compare-row/);
assert.match(all, /\.vc-cell/);

// --- Binding tab + selettore scheda ---
assert.match(app, /data-statistics-tab/);
assert.match(app, /state\.ui\.statisticsTab = button\.dataset\.statisticsTab === "volume"/);
assert.match(app, /state\.ui\.volumeSheet = clampVolumeIndex/);

console.log(JSON.stringify({ ok:true, statististiche:true, tabs:["progress","volume"], volume:true, pie:true, lines:true, compare:true }));
