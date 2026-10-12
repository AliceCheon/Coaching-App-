import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const mainJs = fs.readFileSync(path.join(root, "src/app-main.js"), "utf8");

// --- v148.16 · le sedute arrivano al cloud anche con la quota piena ---
// Alice: "sul telefono ho salvate le sedute C e D (7-10 ottobre), sul PC non escono,
// anche se la sincronizzazione dice attiva". Causa doppia: (1) la coda cloud veniva
// riempita SOLO dopo una scrittura locale VERIFICATA — e con la quota piena la scrittura
// locale fallisce sempre; (2) la coda persistente vive in localStorage, che è pieno,
// quindi non riusciva a scrivere nemmeno le operazioni.

const vmLibs = await Promise.all([
  "exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js",
  "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js",
  "coach-ai3-programming.js", "coach-studio.js", "plate-calculator.js"
].map((p) => fs.readFileSync(path.join(root, p), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const bootPart = mainJs.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + bootPart;

const storage = new Map();
let quotaFallite = 0;
const document_ = (quotaAttiva) => ({ getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => { if (quotaAttiva) { quotaFallite += 1; const e = new Error("QuotaExceededError"); e.name = "QuotaExceededError"; e.code = 22; throw e; } storage.set(k, String(v)); }, removeItem: (k) => storage.delete(k), key: (i) => Array.from(storage.keys())[i], get length() { return storage.size; } });
const ls = document_(true);
const drawing = new Proxy({}, { get(t, k) { if (k === "measureText") return () => ({ width: 10 }); return () => {}; }, set() { return true; } });
const element = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, replaceChildren() {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {}, dataset: {}, setAttribute() {}, getAttribute() { return null; }, getBoundingClientRect() { return { width: 320, height: 180 }; }, getContext() { return drawing; }, innerHTML: "", textContent: "", value: "", checked: false, hidden: false };
const documentFake = { getElementById() { return { ...element }; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {}, hidden: false, visibilityState: "visible" };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent,
  localStorage: ls, sessionStorage: ls, document: documentFake, navigator: { onLine: false, userAgent: "node" }, location: { protocol: "https:", origin: "https://example.test", hash: "", reload() {} },
  URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, caches: { open: async () => ({ put: async () => {}, match: async () => undefined }) },
  setTimeout(fn, ms) { return globalThis.setTimeout(fn, Math.min(Number(ms) || 0, 10)); }, clearTimeout(id) { globalThis.clearTimeout(id); }, requestAnimationFrame(fn) { if (typeof fn === "function") fn(); return 1; },
  addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: true }; }, window: null, globalThis: null };
context.window = context; context.globalThis = context;
vm.createContext(context);
new vm.Script(script, { filename: "v14816.js" }).runInContext(context);

const esito = vm.runInContext(`(() => {
  const out = {};
  // motore di sync FINTO (il vero è un modulo ES, non caricabile in questa VM):
  // basta l'API che il codice usa davvero.
  const enqueued = [];
  window.BarbellDivaSyncEngine = {
    createPersistentSyncQueue: () => ({ enqueue: (op) => { enqueued.push(String(op.entityId)); }, pending: () => [], markSyncing() {}, markSynced() {}, markFailed() {}, markConflict() {}, removeSynced() {}, removeEntity() {}, audit() {}, auditLog: () => [], stats: () => ({ pending: 0, syncing: 0, synced: 0, failed: 0, conflict: 0 }) }),
    createSyncOperation: (session) => ({ operationId: "op-" + session.id, entityId: String(session.id), payload: session }),
    normalizeSyncSession: (s) => s,
    reconcileSessionVersions: () => ({ status: "merged", value: null })
  };
  initReliableSync();

  const seduta = { id: "seduta-C-telefono", status: "completed", source: "App", dateInput: "2026-10-08", sessionCode: "C", exercises: [{ name: "Hip_Thrust", completedSets: [{ kg: 60 }] }], dataHash: "hash-c" };
  state.training.sessions = [seduta];

  // la quota è davvero piena
  let scritturaLocale = "ok";
  try { localStorage.setItem("prova-quota", "x"); } catch (error) { scritturaLocale = error.name; }

  const salvata = persistWorkoutJournalSession(seduta);
  out.scritturaLocale = scritturaLocale;
  out.copiaLocaleRiuscita = salvata;
  out.inCodaAlCloud = enqueued.includes("seduta-C-telefono");
  out.daFare = pendingSessionOperations().map((operation) => operation.entityId);

  // una seduta già sincronizzata non rientra nel lavoro da fare (nessun ciclo)
  state.training.sessions = [{ ...seduta, syncStatus: "synced" }];
  out.dopoLaSync = pendingSessionOperations().map((operation) => operation.entityId);

  // una seduta NON completata non deve mai andare al cloud
  state.training.sessions = [{ ...seduta, id: "bozza", status: "active" }];
  out.bozzaInCoda = pendingSessionOperations().map((operation) => operation.entityId);
  return out;
})()`, context);

assert.equal(esito.scritturaLocale, "QuotaExceededError", "il test deve simulare davvero la quota piena");
assert.equal(esito.copiaLocaleRiuscita, false, "con la quota piena la copia locale NON riesce (scenario reale)");
assert.equal(esito.inCodaAlCloud, true, "con la quota piena la seduta deve comunque entrare in coda al cloud");
assert.ok(esito.daFare.includes("seduta-C-telefono"), "il lavoro da fare deve includere le sedute non sincronizzate");
assert.ok(!esito.dopoLaSync.includes("seduta-C-telefono"), "le sedute sincronizzate non devono rientrare (nessun ciclo)");
assert.ok(!esito.bozzaInCoda.includes("bozza"), "una seduta non completata non va al cloud");
assert.ok(quotaFallite > 0, "il test deve provocare davvero dei QuotaExceededError");

// guardie statiche
assert.match(mainJs, /function armSessionCloudQueue\(session\)/);
assert.match(mainJs, /let reliableDeviceIdCache = "";/);
assert.match(mainJs, /function safeDeviceIdPersist\(key, value\) \{ try \{ localStorage\.setItem\(key, value\); \} catch \(error\) \{\} \}/);
assert.match(mainJs, /function reliableDeviceIdUncached\(\)/);
assert.match(mainJs, /function pendingSessionOperations\(\)/);
assert.match(mainJs, /if \(verified\) armSessionCloudQueue\(session\); \/\/ v148\.15/);
assert.match(mainJs, /armSessionCloudQueue\(session\); \/\/ quota piena: la copia durabile c'è, il cloud deve partire comunque/);
assert.match(mainJs, /indexedRows\.forEach\(\(row\) => armSessionCloudQueue\(row\)\);/);
assert.match(mainJs, /for \(const operation of pendingSessionOperations\(\)\) \{ \/\/ v148\.15/);

console.log(JSON.stringify({ ok: true, v: "v148.16", quotaPiena: esito.scritturaLocale, inCodaAlCloud: esito.inCodaAlCloud, daFare: esito.daFare }));
