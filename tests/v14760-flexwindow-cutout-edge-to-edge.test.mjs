// v147.60 — Cover screen (FlexWindow) del Galaxy Z Flip 7: i due livelli.
//
// Requisito di prodotto:
//   1. LAYOUT/CANVAS: deve essere edge-to-edge su TUTTA la superficie fisica,
//      anche dietro/attorno al foro delle fotocamere. La leva mancante era il
//      manifest: `"orientation": "portrait"` fa trattare la PWA come app a
//      orientamento/aspect fisso, che One UI letterboxa nell'area "sicura"
//      sopra le fotocamere (da qui la scena confinata in alto e la versione
//      "piu' piccola" quando si cambia formato col tasto Samsung).
//   2. UI INTERATTIVA: header, tab, card e bottom-nav NON devono finire sotto
//      il cutout. Gli inset del cutout vanno sugli elementi di interfaccia, mai
//      sul contenitore/sfondo.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const read = (p) => stripComments(fs.readFileSync(path.join(root, p), "utf8"));
const raw = (p) => fs.readFileSync(path.join(root, p), "utf8");

// --- 1) Il manifest NON deve forzare l'orientamento (edge-to-edge). ---------
const manifestRaw = raw("manifest.webmanifest").replace(/^\uFEFF/, "");
const manifest = JSON.parse(manifestRaw);
assert.ok(
  !("orientation" in manifest) || manifest.orientation === "any",
  `manifest non deve forzare l'orientamento (trovato "${manifest.orientation}"): su Z Flip confina la PWA nell'area sopra le fotocamere`
);
assert.equal(manifest.display, "standalone");
assert.deepEqual(manifest.display_override, ["standalone", "fullscreen"], "serve display_override fullscreen per il cover screen");

// --- 2) Il viewport deve optare per il cover (canvas a filo). ----------------
assert.match(raw("index.html"), /<meta\s+name="viewport"[^>]*viewport-fit=cover/, "index.html deve dichiarare viewport-fit=cover");

// --- 3) Il canvas non deve avere inset del cutout (deve arrivare al bordo). -
const inlineCss = read("coach-studio-inline.css");
assert.ok(
  !/(?:^|\})\s*html\s*\{[^}]*safe-area-inset-top/s.test(inlineCss),
  "html non deve avere inset del cutout: il canvas/sfondo deve arrivare ai bordi fisici"
);

// Il canvas deve coprire TUTTA la finestra: alto quanto il viewport e con un
// COLORE opaco, senza `background-attachment: fixed` (su Chrome/Android il
// fixed non ridipinge l'area scoperta quando il viewport cambia -> resta bianca).
const htmlBase = inlineCss.match(/(?:^|\})\s*html\s*\{([^}]*)\}/);
assert.ok(htmlBase, "serve la regola html {...}");
assert.match(htmlBase[1], /height\s*:\s*100%/, "html deve essere alto quanto il viewport");
assert.match(htmlBase[1], /background-color\s*:\s*#080719/, "html deve avere un colore di canvas opaco");
assert.ok(!/background-attachment\s*:\s*fixed/.test(inlineCss), "niente background-attachment: fixed sul canvas (Chrome/Android)");

// --- 4) La UI in alto deve rispettare il cutout. ----------------------------
const cutoutBlock = inlineCss.match(/@media\s*\(max-height:\s*520px\)\s*\{([\s\S]*?)\n\}\s*$/);
assert.ok(cutoutBlock, "serve un blocco @media (max-height: 520px) con gli inset per la UI del cover screen");
const cutout = cutoutBlock[1];
for (const sel of [".app-header", ".phone-status", ".top-tabs"]) {
  const rule = cutout.match(new RegExp(`\\${sel}\\s*\\{([^}]*)\\}`));
  assert.ok(rule, `il blocco cover deve dare un inset a ${sel}`);
  assert.match(rule[1], /env\(safe-area-inset-top/, `${sel} deve rispettare safe-area-inset-top (foro fotocamere)`);
}

// --- Mini-motore di cascata (stesso approccio di v14757/v14761). -------------
const html = raw("index.html");
const sheetOrder = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1].split("?")[0]);
function parseRules(css, media = [], out = []) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const selectorText = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth > 0) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    if (selectorText.startsWith("@media")) parseRules(body, media.concat(selectorText), out);
    else out.push({ media, selectors: selectorText.split(",").map((s) => s.trim()), body });
    i = j;
  }
  return out;
}
const matchesMedia = (q, { width, height }) => {
  let ok = true;
  const mw = q.match(/max-width:\s*(\d+)px/), nw = q.match(/min-width:\s*(\d+)px/);
  const mh = q.match(/max-height:\s*(\d+)px/), nh = q.match(/min-height:\s*(\d+)px/);
  if (mw) ok = ok && width <= Number(mw[1]);
  if (nw) ok = ok && width >= Number(nw[1]);
  if (mh) ok = ok && height <= Number(mh[1]);
  if (nh) ok = ok && height >= Number(nh[1]);
  return ok;
};
const viewport = { width: 400, height: 365 };
function resolve(prop, selector) {
  let winner = null;
  for (const href of sheetOrder) {
    const file = href.replace(/^\.\//, "");
    if (!fs.existsSync(path.join(root, file))) continue;
    for (const rule of parseRules(read(file))) {
      if (!rule.selectors.includes(selector)) continue;
      if (!rule.media.every((m) => matchesMedia(m, viewport))) continue;
      const decl = rule.body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i"));
      if (!decl) continue;
      const value = decl[1].trim();
      if (!winner || /!important/i.test(value)) winner = value;
    }
  }
  return winner;
}

// --- 5) Sul FlexWindow la UI in alto risolve davvero l'inset del cutout. ---
const headerPad = resolve("padding-top", ".app-header");
assert.ok(headerPad, ".app-header deve avere padding-top sul FlexWindow");
assert.match(headerPad, /env\(safe-area-inset-top/, `.app-header deve stare sotto il cutout, risolto "${headerPad}"`);

// --- 6) Il contenitore/sfondo resta SENZA inset (canvas a filo). ------------
const phonePad = resolve("padding-top", ".phone");
assert.ok(
  !phonePad || !/safe-area-inset-top/.test(phonePad),
  `.phone non deve avere inset del cutout (canvas edge-to-edge), risolto "${phonePad}"`
);

// --- 7) La nav resta sopra la gesture bar. ----------------------------------
const navBottom = resolve("bottom", ".bottom-nav");
assert.match(navBottom, /env\(safe-area-inset-bottom/, `.bottom-nav deve stare sopra la gesture bar, risolto "${navBottom}"`);

console.log(JSON.stringify({
  ok: true,
  checks: 10,
  fix: "FlexWindow cutout: manifest senza orientamento forzato + inset del cutout solo sulla UI",
  headerPad,
  navBottom,
}));
