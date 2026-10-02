import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const html = read("index.html");
const inlineCss = read("coach-studio-inline.css");
const studioCss = read("coach-studio.css");

// v147.83 — La fascia in basso sul cover screen (FlexWindow Z Flip) restava
// "immobile" per sempre. Tre cause indipendenti, tutte bloccate qui:

// 1) REGRESSIONE: `body { padding-bottom: env(safe-area-inset-bottom) }` era
//    rientrata (v147.59 l'aveva rimossa). Sul cover screen somma l'inset
//    all'altezza del documento e allarga la fascia scoperta. NON deve tornare.
const bodyRule = inlineCss.match(/\n\s*body\s*\{[\s\S]*?\n\s*\}/)?.[0] || "";
assert.ok(
  !/padding-bottom:\s*env\(safe-area-inset-bottom\)/.test(bodyRule),
  "body: e' tornato padding-bottom: env(safe-area-inset-bottom) (regressione v147.59)"
);

// 2) GATE FULLSCREEN: il cancello `display-mode: standalone` si auto-disattivava
//    (entrando in fullscreen display-mode diventa 'fullscreen' -> standalone
//    falso -> non si rientrava mai piu'). Ora si esclude solo il browser normale.
//    NB: si cerca la CHIAMATA matchMedia, non il testo nel commento esplicativo.
assert.ok(
  !/matchMedia\(\s*["']\(display-mode:\s*standalone\)["']\s*\)/.test(html),
  "index.html: il gate fullscreen usa ancora matchMedia(display-mode: standalone) (si auto-disattiva)"
);
assert.match(html, /matchMedia\(\s*["']\(display-mode:\s*browser\)["']\s*\)/, "index.html: manca l'esclusione del browser normale");
assert.match(html, /innerHeight <= 560/, "index.html: manca il limite di altezza cover screen");
assert.match(html, /innerWidth <= 760/, "index.html: manca il limite di larghezza cover screen");
assert.match(html, /requestFullscreen/, "index.html: manca requestFullscreen per il cutout");

// 3) ELEMENTO FANTASMA: `#globalDivaBotHost` forzato `position: static` entra nel
//    flusso e puo' allungare il documento oltre 100dvh. Deve restare fuori flusso.
assert.ok(
  !/#globalDivaBotHost\s*\{[^}]*position:\s*static/.test(studioCss),
  "coach-studio.css: #globalDivaBotHost e' ancora position: static (elemento fantasma)"
);
assert.match(
  studioCss,
  /#globalDivaBotHost\s*\{[^}]*position:\s*relative/,
  "coach-studio.css: #globalDivaBotHost deve essere position: relative (fuori flusso)"
);

// 4) SUL COVER SCREEN il guscio non deve superare il viewport visibile: niente
//    `min-height: 100vh` su .phone-shell (viewport grande ~400px vs 365 visibili).
const coverBlock = inlineCss.match(
  /@media \(max-height: 430px\) and \(max-width: 560px\) \{[\s\S]*?\.phone \{ min-height: 100dvh[^}]*\}/
);
assert.ok(coverBlock, "manca il pin a 100dvh di .phone-shell/.phone sul cover screen");

console.log(JSON.stringify({ ok: true, flexwindow: "cover screen fullscreen v147.83" }));
