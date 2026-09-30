import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const main = read("src/app-main.js");
const diva = read("src/diva-personality.js");

// Import: guardia sulla dimensione prima di leggere il file.
assert.match(main, /function rejectOversizedImport\(file\)/, "manca la guardia sulla dimensione dell'import");
assert.match(main, /IMPORT_MAX_BYTES/, "manca il limite di dimensione");
assert.ok(
  (main.match(/rejectOversizedImport\(file\)/g) || []).length >= 3,
  "la guardia deve coprire tutti gli import (backup, restore, Alice logbook)"
);

// XSS: il popup Diva non deve concatenare testo grezzo in innerHTML.
assert.match(diva, /function escapePopupText\(/, "manca l'escape del testo del popup Diva");
assert.match(diva, /escapePopupText\(message\)/, "il popup Diva deve usare escapePopupText(message)");
assert.ok(!/\+\s*message\s*\+\s*'<\/div>'/.test(diva), "il messaggio grezzo non deve finire in innerHTML");

console.log(JSON.stringify({ ok: true, hardening: "import max-size + escape popup Diva" }));
