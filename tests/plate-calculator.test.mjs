import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "../plate-calculator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const P = globalThis.BarbellDivaPlates;
assert.ok(P, "il modulo BarbellDivaPlates non è stato caricato");

// Dischi: caso esatto (100 kg, bilanciere 20 → 40 kg per lato = 25 + 15).
const exact = P.platesFor(100, 20, [25, 20, 15, 10, 5, 2.5, 1.25]);
assert.equal(exact.ok, true, "100 kg deve essere raggiungibile");
assert.equal(exact.achievable, 100);
assert.deepEqual(exact.perSide, [25, 15]);

// Dischi: caso non esatto con set ridotto.
const inexact = P.platesFor(101, 20, [25, 20]);
assert.equal(inexact.ok, false, "101 kg non è raggiungibile con soli 25/20");
assert.ok(inexact.message.length > 0, "manca il messaggio per il caso non esatto");

// Dischi: peso sotto il bilanciere.
assert.equal(P.platesFor(15, 20).ok, false, "15 kg < bilanciere non è valido");

// Rampa: crescente, sotto il carico di lavoro, mai sotto il bilanciere.
const warm = P.warmupSets(100, 20);
assert.ok(warm.length >= 3, "attese almeno 3 serie di riscaldamento");
assert.ok(warm.every((step) => step.kg < 100 && step.kg >= 20), "rampa fuori range");

// Integrazione: file collegato e in cache offline.
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const flow = fs.readFileSync(path.join(root, "workout-flow-v147.js"), "utf8");
assert.match(html, /plate-calculator\.js/, "plate-calculator.js non collegato in index.html");
assert.match(sw, /\.\/plate-calculator\.js/, "plate-calculator.js non è nell'APP_SHELL");
assert.match(flow, /data-v147-plates-open/, "manca il pulsante Dischi nel flusso workout");

console.log(JSON.stringify({ ok: true, plates: "calcoli + integrazione verificati" }));
