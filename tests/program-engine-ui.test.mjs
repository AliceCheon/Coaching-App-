import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const main = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "programming-engine.js"), "utf8");

// Il motore espone le API richieste dalla UI.
assert.match(engine, /export function createProgrammingEngine/, "createProgrammingEngine mancante");
assert.match(engine, /getProgrammingSuggestions:suggestions/, "il runtime non espone getProgrammingSuggestions");

// La UI legge i suggerimenti e li rende nel workspace Coach AI.
assert.match(main, /function programEngineSuggestionsHtml\(\)/, "manca il render dei suggerimenti 20A");
assert.match(main, /getProgrammingSuggestions\(\{\}\)/, "la UI non chiama il motore");
assert.match(main, /\$\{programEngineSuggestionsHtml\(\)\}/, "la sezione 20A non è montata nel workspace Coach AI");
assert.match(main, /data-programming-view=/, "manca il pulsante 'segna come rivisto'");
assert.match(main, /recordSuggestionDecision\?\.\(button\.dataset\.programmingIgnore, "ignored"\)/, "manca la registrazione della decisione 'ignored'");

console.log(JSON.stringify({ ok: true, engine20a: "UI collegata ai suggerimenti a dati reali" }));
