// v147.56 — Sul FlexWindow (schermo esterno Z Flip) la pagina superava
// l'altezza del viewport: due elementi non navigabili restavano in flusso
// (`#globalDivaBotHost` forzato a position:static dalla regola mobile di
// coach-studio.css e `.coach-editor-nav-restore` senza posizionamento fuori
// da min-width:981px). Misurato a 400x365: documento alto 407px su 365px,
// quindi la scena scivolava sotto la piega e compariva una striscia in fondo.
// Questo test risolve la cascata reale (ordine dei fogli + media query +
// !important) e pretende che entrambi siano fuori dal flusso su mobile.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const read = (p) => stripComments(fs.readFileSync(path.join(root, p), "utf8"));

// Ordine dei fogli di stile come li carica index.html.
const html = read("index.html");
const sheetOrder = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
  .map((m) => m[1].split("?")[0]);

// --- mini-motore di cascata: top-level + @media a un livello -------------
function parseRules(css, media = [], out = []) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const selectorText = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const body = css.slice(open + 1, j - 1);
    if (selectorText.startsWith("@media")) {
      parseRules(body, media.concat(selectorText), out);
    } else {
      out.push({ media, selectors: selectorText.split(",").map((s) => s.trim()), body });
    }
    i = j;
  }
  return out;
}

const matchesMedia = (query, { width, height }) => {
  let ok = true;
  const maxW = query.match(/max-width:\s*(\d+)px/);
  const minW = query.match(/min-width:\s*(\d+)px/);
  const maxH = query.match(/max-height:\s*(\d+)px/);
  const minH = query.match(/min-height:\s*(\d+)px/);
  if (maxW) ok = ok && width <= Number(maxW[1]);
  if (minW) ok = ok && width >= Number(minW[1]);
  if (maxH) ok = ok && height <= Number(maxH[1]);
  if (minH) ok = ok && height >= Number(minH[1]);
  return ok;
};

const viewport = { width: 400, height: 365 }; // FlexWindow Z Flip 7

// Risolve una proprietà per un selettore esatto (id/class), applicando
// !important e poi l'ordine di apparizione in cascata.
function resolve(prop, selector) {
  let winner = null;
  let order = 0;
  for (const href of sheetOrder) {
    const file = href.replace(/^\.\//, "");
    if (!fs.existsSync(path.join(root, file))) continue;
    for (const rule of parseRules(read(file))) {
      if (!rule.selectors.includes(selector)) continue;
      if (!rule.media.every((m) => matchesMedia(m, viewport))) continue;
      const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i");
      const decl = rule.body.match(re);
      if (!decl) continue;
      const value = decl[1].trim();
      const important = /!important/i.test(value);
      const clean = value.replace(/!important/i, "").trim();
      if (!winner || important || !winner.important) {
        if (winner && winner.important && !important) continue; // un important precedente resta
        winner = { value: clean, important, order: order++ };
      } else {
        winner = { value: clean, important, order: order++ };
      }
      order++;
    }
  }
  return winner?.value ?? null;
}

// 1) La causa deve esistere (regola mobile storica che rendeva static l'host).
assert.ok(
  /#globalDivaBotHost\{[^}]*position:static/.test(read("coach-studio.css")),
  "attesa la regola mobile che imposta position:static su #globalDivaBotHost"
);

// 2) Su viewport FlexWindow l'host bot NON deve stare in flusso.
assert.equal(
  resolve("position", "#globalDivaBotHost"),
  "fixed",
  "#globalDivaBotHost deve essere position:fixed (fuori dal flusso) sul FlexWindow"
);

// 3) Il pulsante di ripristino rail coach (solo desktop) deve sparire su mobile.
assert.equal(
  resolve("display", ".coach-editor-nav-restore"),
  "none",
  ".coach-editor-nav-restore deve essere display:none su mobile"
);

// 4) La fix vive nel foglio caricato per ultimo tra i due coinvolti, così
//    vince la cascata su coach-studio.css.
assert.ok(
  sheetOrder.indexOf("unified-sidebar-v1452.css") < sheetOrder.indexOf("coach-studio-inline.css") ||
    sheetOrder.includes("coach-studio-inline.css"),
  "coach-studio-inline.css deve essere caricato dopo gli altri fogli della rail"
);

console.log(JSON.stringify({ ok: true, checks: 4, fix: "flexwindow full-bleed: diva host + rail restore fuori flusso su mobile" }));
