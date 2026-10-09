// v14752 · Verifica statica: tema chiaro intatto + testata workout non bloccata.
import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("..", import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), "utf8");
const css = read("coach-studio-inline.css");
const html = read("index.html");
const manifest = JSON.parse(read("manifest.webmanifest"));
const sw = read("service-worker.js");
const config = read("app-config-v144.js");

// ---- A · il tema chiaro NON deve essere forzato a scuro dall'app ----
assert.ok(!/#090918\s*!important/.test(css), "il CSS forza ancora uno sfondo scuro !important");
assert.ok(!/:root \{ color-scheme: dark; \}/.test(css), "la regola color-scheme dark aggiunta da v14751 e\' ancora presente");
assert.ok(!/\/\* === v1475[01]/.test(css), "blocchi v14750/v14751 non rimossi");
assert.ok(!/name="color-scheme"/.test(html), "index.html: color-scheme forzato ancora presente");
assert.match(html, /<meta name="theme-color" content="#090918">/, "manca theme-color");
assert.equal(manifest.background_color, "#080817", "manifest: background_color alterato");
assert.equal(manifest.theme_color, "#090918", "manifest: theme_color alterato");
assert.match(css, /body\[data-theme="light"\]/, "manca il tema chiaro dell'app");
assert.match(css, /background:linear-gradient\(155deg,#d5b8eb 0%,#f1dfee 58%,#c8a6df 100%\)/, "il gradiente chiaro del body e' stato alterato");
assert.match(css, /\.phone \{ background:linear-gradient\(155deg,#eadbf6 0%,#f9edf5 55%,#dfc6ed 100%\); \}/, "il phone chiaro e' stato alterato");

// ---- B · la testata workout non deve agganciarsi sugli schermi bassi ----
assert.match(css, /@media \(max-height: 520px\) \{[\s\S]{0,600}\.v147-active-head \{[\s\S]{0,200}position: static !important/, "manca la regola che libera la testata workout sugli schermi bassi");
assert.ok(!/\.v147-active-head \{[\s\S]{0,200}height: 100[sv]?[hd]/.test(css), "la testata workout ha un'altezza a tutto schermo");
assert.ok(!/\.stage,\s*\.phone,\s*\.phone-shell \{\s*height: auto/.test(css), "altezze del guscio ancora forzate");

// ---- C · coerenza versione ----
const build = config.match(/build:\s*"([^"]+)"/)?.[1];
const m = build.match(/^v(\d+)\.(\d+)/);
const token = `v${m[1]}${m[2]}`;
assert.equal(token, "v14803", `token inatteso: ${token}`);
assert.ok([...html.matchAll(/\?v=([A-Za-z0-9._-]+)/g)].every((x) => x[1] === token), "index.html non allineato");
assert.ok([...read("manifest.webmanifest").matchAll(/\?v=([A-Za-z0-9._-]+)/g)].every((x) => x[1] === token), "manifest non allineato");
assert.equal(sw.match(/const CACHE_NAME = "([^"]+)"/)[1], config.match(/cache:\s*"([^"]+)"/)[1], "CACHE_NAME non allineato");

console.log(JSON.stringify({ ok: true, token, checks: 15 }, null, 2));
