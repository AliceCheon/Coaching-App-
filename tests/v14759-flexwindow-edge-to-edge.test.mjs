// v147.59 — Cover screen (FlexWindow) edge-to-edge: la fascia chiara in fondo
// non era solo un overflow, era il FILL DEL CANVAS.
//
// Con `viewport-fit=cover` il browser estende fino al bordo fisico solo il
// background-COLOR del root. La v14757 dipingeva su `html` una background-IMAGE
// (gradiente) ma il background-COLOR restava trasparente: l'area fuori dal
// layout viewport (sul cover screen 100dvh e' piu' basso dello schermo fisico,
// perche' esclude la system navigation) tornava al canvas BIANCO del browser.
//
// In piu' `body { padding-bottom: env(safe-area-inset-bottom) }` sommava
// l'inset all'altezza del documento, che cosi' superava il layout viewport
// (misurato col CDP a 400x365 + inset 32px: documento 397px su 365px),
// allargando proprio la fascia scoperta.
//
// Il test risolve la cascata REALE (ordine dei fogli + media query + !important)
// sul viewport del FlexWindow (400x365).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const read = (p) => stripComments(fs.readFileSync(path.join(root, p), "utf8"));
const readRaw = (p) => fs.readFileSync(path.join(root, p), "utf8");

const html = read("index.html");
const inlineCss = read("coach-studio-inline.css");

// --- 1) viewport-fit=cover: senza questo il browser non estende il canvas. --
const indexRaw = readRaw("index.html");
assert.match(
  indexRaw,
  /<meta\s+name="viewport"[^>]*viewport-fit=cover/,
  "index.html deve dichiarare viewport-fit=cover (edge-to-edge sul cover screen)"
);

// --- 2) `html` deve avere un background-COLOR opaco, non solo un'immagine. --
const htmlRule = inlineCss.match(/(?:^|\})\s*html\s*\{([^}]*)\}/);
assert.ok(htmlRule, "coach-studio-inline.css deve avere una regola html {...}");
const htmlBody = htmlRule[1];
const colorDecl = htmlBody.match(/background-color\s*:\s*([^;]+)/i);
assert.ok(colorDecl, "html deve dichiarare un background-color (il canvas bianco nasce dal colore trasparente)");
const colorValue = colorDecl[1].trim().toLowerCase();
assert.ok(colorValue !== "transparent" && colorValue !== "none", `html background-color non puo' essere ${colorValue}`);
assert.match(colorValue, /^#[0-9a-f]{3,8}$|^rgb/, `html background-color deve essere un colore concreto, trovato "${colorValue}"`);

// Il colore deve venire DOPO la shorthand `background:` (che altrimenti lo
// riazzererebbe a trasparente).
const bgShorthandAt = htmlBody.search(/(?:^|;)\s*background\s*:/i);
const bgColorAt = htmlBody.search(/background-color\s*:/i);
assert.ok(
  bgColorAt > bgShorthandAt,
  "background-color deve essere dichiarato DOPO la shorthand background, altrimenti la shorthand lo azzera"
);

// --- 3) Anche il tema chiaro deve avere un colore di canvas opaco. ---------
const lightRule = inlineCss.match(/html\[data-theme="light"\]\s*\{([^}]*)\}/);
assert.ok(lightRule, "serve una variante html[data-theme=light] per il canvas");
const lightColor = lightRule[1].match(/background-color\s*:\s*([^;]+)/i);
assert.ok(lightColor, "html[data-theme=light] deve dichiarare un background-color");
assert.match(lightColor[1].trim().toLowerCase(), /^#[0-9a-f]{3,8}$|^rgb/, "canvas chiaro deve avere un colore concreto");

// --- 4) `body` non deve sommare l'inset all'altezza (overflow). -------------
const bodyRule = inlineCss.match(/(?:^|\})\s*body\s*\{([^}]*)\}/);
assert.ok(bodyRule, "serve la regola base body {...}");
assert.doesNotMatch(
  bodyRule[1],
  /padding-bottom\s*:\s*env\(safe-area-inset-bottom/i,
  "body non deve avere padding-bottom: env(safe-area-inset-bottom): allunga il documento oltre il layout viewport"
);

// --- Mini-motore di cascata (stesso approccio di v14757-flexwindow). ---------
const sheetOrder = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
  .map((m) => m[1].split("?")[0]);

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
    if (selectorText.startsWith("@media")) parseRules(body, media.concat(selectorText), out);
    else out.push({ media, selectors: selectorText.split(",").map((s) => s.trim()), body });
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

const viewport = { width: 400, height: 365 };

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
      if (!winner || important) winner = { value: clean, important, order: order++ };
      else order++;
    }
  }
  return winner?.value ?? null;
}

// --- 5) Sul FlexWindow il canvas ha un colore concreto risolto dalla cascata.
const resolvedHtmlColor = resolve("background-color", "html");
assert.ok(resolvedHtmlColor, "html deve avere un background-color risolto sul FlexWindow");
assert.ok(
  !/transparent|rgba\(0,\s*0,\s*0,\s*0\)/.test(resolvedHtmlColor),
  `il canvas html non deve essere trasparente sul FlexWindow, trovato "${resolvedHtmlColor}"`
);

// --- 6) Il contenuto resta protetto dall'area gesture/nav. -------------------
const screenPad = resolve("padding-bottom", ".screen");
assert.ok(screenPad, ".screen deve avere un padding-bottom sul FlexWindow");
assert.match(screenPad, /env\(safe-area-inset-bottom/, ".screen deve tener conto della safe-area in basso");

const navBottom = resolve("bottom", ".bottom-nav");
assert.ok(navBottom, ".bottom-nav deve avere un bottom definito sul FlexWindow");
assert.match(navBottom, /env\(safe-area-inset-bottom/, ".bottom-nav deve stare sopra la safe-area in basso");

// --- 7) Il contenitore principale riempie il viewport (nessuna riga fantasma).
const phoneHeight = resolve("height", ".phone");
assert.match(phoneHeight, /100dvh/, ".phone deve usare 100dvh (altezza realmente visibile) sul mobile");

console.log(JSON.stringify({
  ok: true,
  checks: 11,
  fix: "FlexWindow edge-to-edge: background-color del canvas opaco + niente padding extra sul body",
  resolvedHtmlColor,
}));
