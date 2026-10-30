import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");
const engineSrc = fs.readFileSync(path.join(root, "sync-reliability.js"), "utf8");

// --- v148.23 · I CONFLITTI ETERNI E LA CODA CHE NON SI SVUOTAVA ---
// Alice: "esce errore di sincronizzazione ... 'conflitto da controllare' e '26
// schede in coda'", con le schede del programma però arrivate sul telefono.
//
// Radice: ogni seduta nasce con revision 1 e nessuno la incrementava mai. Quindi
// la PRIMA differenza di contenuto fra telefono e cloud (la scheda D rifatta sul
// PC) cadeva nel ramo "stessa revisione, contenuti diversi" = conflitto. Il
// conflitto veniva marcato su una riga che spesso non esisteva (le sedute
// ricavate dallo stato locale non venivano accodate), quindi: badge acceso per
// sempre, nessun pulsante in grado di risolverlo, e la stessa seduta riprovata a
// ogni giro. In più il flush mandava TUTTE le 26 operazioni in un solo giro:
// 26 letture + 26 scritture, con timeout che ripartivano da capo.
// Questo test fallisce sulla v148.21/v148.22.

const sandbox = { console, Date, Math, JSON, Map, Set, Object, Array, String, Number, Boolean, RegExp, Promise, Error, parseInt, parseFloat, isNaN, setTimeout, clearTimeout, window: { dispatchEvent() { return true; } }, document: { documentElement: { dataset: {} } }, CustomEvent: class { constructor(type) { this.type = type; } } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
new vm.Script(engineSrc.replace(/^export default .*$/gm, "").replace(/^export /gm, ""), { filename: "sync-reliability.js" }).runInContext(sandbox);
const engine = sandbox.window.BarbellDivaSyncEngine;

assert.ok(engine, "il motore deve esporsi su window.BarbellDivaSyncEngine");

const body = (tag) => ({ id: "sess-1", dateInput: "2026-10-24", sessionCode: "D", total: tag });
const withHash = (tag, patch = {}) => {
  const entity = { id: "sess-1", revision: 1, updatedAt: "2026-10-24T18:00:00.000Z", ...patch };
  entity.dataHash = engine.dataHash(body(tag));
  return entity;
};

// 1) stessa revisione, contenuti diversi, questo dispositivo più recente:
//    vince il locale invece di restare in conflitto per sempre.
const localNewer = withHash("pc", { updatedAt: "2026-10-24T19:30:00.000Z" });
const remoteOlder = withHash("cloud", { updatedAt: "2026-10-24T18:00:00.000Z" });
const r1 = engine.reconcileSessionVersions(localNewer, remoteOlder);
assert.equal(r1.status, "merged", "stessa revisione con istanti diversi non è più un conflitto");
assert.equal(r1.value.dataHash, localNewer.dataHash, "deve vincere la copia modificata più di recente (qui il PC)");
assert.equal(r1.stampWinner, "local");

// 2) stessa revisione, il cloud è più recente: si adotta il cloud.
const r2 = engine.reconcileSessionVersions(withHash("pc", { updatedAt: "2026-10-24T18:00:00.000Z" }), withHash("cloud", { updatedAt: "2026-10-24T20:00:00.000Z" }));
assert.equal(r2.status, "merged");
assert.equal(r2.stampWinner, "cloud", "deve vincere la copia cloud più recente");

// 3) istanti identici e contenuti diversi: qui la scelta è davvero dell'utente.
const r3 = engine.reconcileSessionVersions(withHash("pc"), withHash("cloud"));
assert.equal(r3.status, "conflict", "l'ambiguità vera (stesso istante) resta un conflitto da mostrare");

// 4) revisione più alta vince comunque.
const r4 = engine.reconcileSessionVersions(withHash("pc", { revision: 3 }), withHash("cloud", { revision: 1 }));
assert.equal(r4.status, "merged");
assert.equal(r4.value.revision, 3, "la revisione maggiore resta la più autorevole");

// 5) coda: i conflitti si leggono, si possono rimuovere e si azzerano.
const storage = new Map();
const queue = engine.createPersistentSyncQueue({
  storage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)) },
  key: "q", auditKey: "a"
});
const op = { operationId: "op-1", entityId: "sess-1", entityType: "workoutSession", operationType: "upsert", payload: withHash("pc"), createdAt: "x", attempts: 0, lastAttemptAt: null, status: "pending", error: "", deviceId: "d1", revision: 1, dataHash: "h" };
queue.enqueue(op);
queue.markConflict("op-1", "Stesso record e revisione, contenuti differenti.");
assert.equal(queue.stats().conflict, 1, "il conflitto deve essere contato");
assert.equal(queue.conflicts().length, 1, "i conflitti devono essere leggibili uno per uno");
assert.equal(queue.pending().length, 0, "un conflitto non è un invio pendente");
queue.removeOperation("op-1");
assert.equal(queue.list().length, 0, "risolto un conflitto la riga deve sparire dalla coda");

// 6) il flush: riga in coda prima di partire, revisione +1, blocchi di 8.
assert.ok(/operations\.slice\(0, 8\)/.test(mainJs), "il flush deve inviare a blocchi, non tutte le sedute in un giro");
assert.ok(/if \(queued\) operations\.push/.test(mainJs), "le operazioni ricavate dallo stato locale devono avere una riga in coda");
assert.ok(/payload\.revision=Math\.max\(Number\(remote\.revision\|\|0\),Number\(operation\.payload\.revision\|\|0\),Number\(result\.value\?\.revision\|\|0\)\)\+1/.test(mainJs), "scrivendo si deve incrementare la revisione: è ciò che impedisce il conflitto eterno");
assert.ok(/ref\.get>?, 15000\)/.test(mainJs) || /withTimeout\(ref\.get\(\), 15000\)/.test(mainJs), "la lettura non deve restare appesa 30 secondi");
assert.ok(/conflict-resolved/.test(mainJs), "la risoluzione dei conflitti deve finire nel registro tecnico");
assert.ok(/data-conflict-resolve/.test(mainJs), "la card deve offrire i pulsanti per risolvere i conflitti");
assert.ok(/sessionStamp/.test(engineSrc), "il confronto per istante deve vivere nel motore, non sparire alla prossima release");

console.log(JSON.stringify({ ok: true, engine: engine.SYNC_ENGINE_VERSION }));
