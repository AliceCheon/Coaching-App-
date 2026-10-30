// Fase 10 — La schermata d'avvio (splash) deve restare centrata e a piena
// pagina su ogni viewport: l'utente l'ha vista "storta" su desktop. Queste
// asserzioni bloccano una regressione del centraggio (flex + margin:auto) e
// delle coordinate di ancoraggio (inset + fallback top/right/bottom/left).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const css = fs.readFileSync(path.join(root, "coach-studio-inline.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const splashRule = css.match(/\.premium-splash\s*\{[^}]*\}/)?.[0] || "";
const cardRule = css.match(/\.premium-splash-card\s*\{[^}]*\}/)?.[0] || "";

for (const token of [
  "position:fixed",
  "inset:0",
  "left:0",
  "right:0",
  "top:0",
  "bottom:0",
  "display:flex",
  "align-items:center",
  "justify-content:center",
  "min-height:100dvh",
]) {
  assert.ok(splashRule.includes(token), `regola .premium-splash: manca "${token}"`);
}

assert.match(cardRule, /margin:auto/, ".premium-splash-card: manca margin:auto (centraggio)");

// Lo splash è il primo figlio di <body>: nessun antenato può spostarlo.
assert.ok(
  /<body>\s*<div id="premiumSplash"/.test(html),
  "index.html: #premiumSplash deve essere il primo figlio di <body>"
);

console.log(JSON.stringify({ ok: true, splash: true, centered: true }));
