import fs from "node:fs/promises";
import vm from "node:vm";

// v147.57 · Avvio parallelo + idratazione da cloud-cache
// Design: docs/design-avvio-parallelo-cloud-cache.md
// Verifica: idratazione iniziale dall'ultima versione vista sul cloud (con guardie
// uid/stamp/schema), download speculativo consumato da loadCloudState senza seconda
// get, sub-load in Promise.all, scrittura della cloud-cache mai bloccante.

const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js","master-exercise-library.js","app-config-v144.js","athlete-context.js","coach-ai-engine-2.js","knowledge-graph.js","decision-rules.js","decision-engine.js","coach-ai3-programming.js","coach-studio.js"].map(p => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const VM_PROLOGUE = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now(){return Date.now()}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + VM_PROLOGUE + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "");
const storage = new Map();
const localStorage = { getItem:k=>storage.get(k)??null, setItem:(k,v)=>storage.set(k,String(v)), removeItem:k=>storage.delete(k) };
const drawing = new Proxy({}, { get(target,key){ if(key==="measureText") return ()=>({width:10}); return ()=>{}; }, set(){return true;} });
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, closest(){return null}, replaceChildren(){}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, setAttribute(){}, getAttribute(name){return name==="height"?"180":name==="width"?"320":null}, getBoundingClientRect(){return {width:320,height:180}}, getContext(){return drawing}, innerHTML:"", textContent:"", scrollTop:0, scrollLeft:0, width:320, height:180 };
const document = { getElementById(){return {...element}}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:{...element}, documentElement:{...element}, addEventListener(){} };
const Response = class { constructor(body){ this._body = String(body); } json(){ return JSON.parse(this._body); } text(){ return this._body; } };
const Request = class { constructor(url){ this.url = String(url); } };
const cacheStore = new Map();
const cachesFake = { open: async (name) => {
  if (!cacheStore.has(name)) cacheStore.set(name, new Map());
  const store = cacheStore.get(name);
  return { put: async (url, response) => { store.set(String(url), response); }, match: async (url) => store.get(String(url)) };
} };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, localStorage, sessionStorage:localStorage, document, navigator:{onLine:true}, location:{protocol:"https:",origin:"https://example.test",hash:"",reload(){}}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, Response, Request, caches:cachesFake, setTimeout(fn,ms){ return globalThis.setTimeout(fn,Math.min(Number(ms)||0,20)); }, clearTimeout(id){globalThis.clearTimeout(id)}, requestAnimationFrame(fn){ if(typeof fn==="function") fn(); return 1; }, addEventListener(){}, removeEventListener(){}, matchMedia(){return {matches:true}}, window:null, globalThis:null };
context.window = context; context.globalThis = context;
vm.createContext(context);
new vm.Script(script).runInContext(context);

const results = await vm.runInContext(`(async () => {
  const results = [];
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); results.push(msg); };
  const cachesBak = window.caches; const putCache = async (entry) => { const cache = await caches.open("atlas-cloud-snap-v1"); await cache.put("/__cloud-snap-v1__", new Response(JSON.stringify(entry))); };
  const hasSession = (id) => (state.training?.sessions || []).some((item) => item.id === id);
  const STAMP_CACHE = "2026-09-30T08:00:00.000Z";

  // T1 — REGRESSIONE "29 AGOSTO": il locale si dichiara PIÙ NUOVO della cache
  // perché ad ogni avvio meta.updatedAt viene riscritto a "adesso" (touch:true).
  // La cache non è però mai stata applicata: l'idratazione DEVE comunque farla
  // vincere, altrimenti il primo paint resta la foto congelata.
  state.profile.account = { uid: "alice-test", cloudStatus: "locale", syncReady: false };
  state.meta = { ...(state.meta || {}), updatedAt: "2026-10-05T12:00:00.000Z" }; // locale "più nuovo" (falso)
  delete state.meta.cloudAppliedStamp;
  await putCache({ schema: 1, uid: "alice-test", updatedAt: STAMP_CACHE, savedAt: STAMP_CACHE, state: { meta: { updatedAt: STAMP_CACHE }, programs: [], training: { sessions: [{ id: "s-cloud", date: "2026-09-29", source: "App", status: "completed", exercises: [], dataHash: "hash-s-cloud", startedAt: "2026-09-29T08:00:00.000Z", updatedAt: "2026-09-29T09:00:00.000Z", cloudSyncedAt: "2026-09-30T08:00:00.000Z" }] } } });
  assert(await hydrateFromCloudSnapshotCache() === true, "idratazione: cache applicata anche se il locale si dichiara più nuovo");
  assert(hasSession("s-cloud"), "idratazione: la seduta della cache è nello stato");
  assert(String(state.meta.cloudAppliedStamp) === STAMP_CACHE, "idratazione: cloudAppliedStamp segnato (non più meta.updatedAt)");
  assert(String(lastCloudSnapshotAt) === STAMP_CACHE, "idratazione: lastCloudSnapshotAt segnato come già visto");
  assert(state.profile.account.syncReady === true && state.profile.account.cloudStatus === "sync", "idratazione: profilo pronto per la sync");

  // T1b — riapplicare la stessa cache è idempotente: nessuna seduta duplicata
  assert(await hydrateFromCloudSnapshotCache() === true, "idratazione: stessa cache riapplicata senza errori");
  assert((state.training.sessions || []).filter((item) => item.id === "s-cloud").length === 1, "idratazione: nessuna seduta duplicata");

  // T2 — cache più vecchia dello stamp cloud già applicato → saltata
  await putCache({ schema: 1, uid: "alice-test", updatedAt: "2026-09-29T00:00:00.000Z", savedAt: "2026-09-29T00:00:00.000Z", state: { meta: { updatedAt: "2026-09-29T00:00:00.000Z" }, programs: [], training: { sessions: [{ id: "s-old" }] } } });
  assert(await hydrateFromCloudSnapshotCache() === false, "cache più vecchia: idratazione saltata");
  assert(!hasSession("s-old"), "cache più vecchia: nessun dato applicato");

  // T3 — cache di un altro account → scartata senza guardarla
  await putCache({ schema: 1, uid: "other-uid", updatedAt: "2026-10-01T00:00:00.000Z", savedAt: "2026-10-01T00:00:00.000Z", state: { meta: { updatedAt: "2026-10-01T00:00:00.000Z" }, programs: [], training: { sessions: [{ id: "s-other" }] } } });
  assert(await hydrateFromCloudSnapshotCache() === false, "cache di altro uid: idratazione scartata");
  assert(!hasSession("s-other"), "cache di altro uid: nessun dato applicato");
  assert(String(lastCloudSnapshotAt) === STAMP_CACHE, "cache scartata: lastCloudSnapshotAt invariato");

  // T4 — schema sconosciuto → scartato
  await putCache({ schema: 99, uid: "alice-test", updatedAt: "2026-10-01T00:00:00.000Z", savedAt: "2026-10-01T00:00:00.000Z", state: { meta: { updatedAt: "2026-10-01T00:00:00.000Z" }, programs: [], training: { sessions: [{ id: "s-schema" }] } } });
  assert(await hydrateFromCloudSnapshotCache() === false, "schema sconosciuto: idratazione scartata");
  assert(!hasSession("s-schema"), "schema sconosciuto: nessun dato applicato");

  // T5 — download speculativo: la get() parte subito con l'uid salvato e loadCloudState
  // consuma quel risultato invece di pagare un secondo round-trip
  let listener = null;
  let getCalls = 0;
  const collections = {};
  const ensure = (name) => (collections[name] || (collections[name] = new Map()));
  const collectionFor = (name) => ({
    get: async () => ({ forEach(fn) { for (const [id, value] of ensure(name).entries()) fn({ id, data: () => value }); } }),
    onSnapshot() { return () => {}; },
    doc(id) { return { set: async (value) => { ensure(name).set(id, value); return true; }, get: async () => ({ exists: false, data: () => null }), delete: async () => { ensure(name).delete(id); } }; }
  });
  const doc = {
    get: async () => { getCalls += 1; return { exists: true, data: () => ({ updatedAt: "2026-09-30T10:00:00.000Z", app: "barbell-method-app", programStorage: "subcollection-v2", programIds: [], sessionStorage: "subcollection-v1", blobFields: [], state: { meta: { updatedAt: "2026-09-30T10:00:00.000Z" }, profile: { account: {} }, training: { sessions: [] }, programs: [] } }) }; },
    set: async () => true,
    collection: (name) => collectionFor(name),
    onSnapshot: (next) => { listener = next; return () => { listener = null; }; }
  };
  dbService = { collection: () => ({ doc: () => doc }) };
  cloudUser = { uid: "alice-test" };
  state.profile.account = { uid: "alice-test", syncReady: true };
  assert(startSpeculativeDownload("alice-test") === true, "download speculativo avviato");
  assert(getCalls === 1, "download speculativo: la get() parte subito con l'uid salvato");
  assert(await loadCloudState({ silent: true }) === true, "loadCloudState riuscita con backend finto");
  assert(getCalls === 1, "loadCloudState consuma la speculativa: nessuna seconda get");
  const cacheAfterDownload = await caches.open("atlas-cloud-snap-v1");
  const snap = await cacheAfterDownload.match("/__cloud-snap-v1__");
  const snapData = snap ? await snap.json() : null;
  assert(snapData && snapData.updatedAt === "2026-09-30T10:00:00.000Z" && snapData.uid === "alice-test", "cloud-cache scritta dopo il download");

  // T6 — speculativa di un altro uid: scartata, loadCloudState rifà la get
  getCalls = 0;
  assert(startSpeculativeDownload("other-uid") === true, "speculativa con uid estraneo avviata");
  await loadCloudState({ silent: true });
  assert(getCalls === 2, "uid estraneo: speculativa non consumata, get fresca fatta");

  // T7 — senza Cache Storage tutto degrada senza lanciare errori
  window.caches = undefined;
  assert(await writeCloudSnapshotCache("alice-test", STAMP_CACHE, { meta: {} }) === false, "scrittura cache senza caches: false, nessun errore");
  assert(await readCloudSnapshotCache() === null, "lettura cache senza caches: null, nessun errore");
  window.caches = cachesBak;
  assert(await writeCloudSnapshotCache("", STAMP_CACHE, { meta: {} }) === false, "scrittura cache senza uid: false");

  return results;
})()`, context);

// Struttura: sub-load in Promise.all e idratazione agganciata al boot (dopo initFirebase)
if (!/Promise\.all\(\s*\[[\s\S]*loadCloudPrograms[\s\S]*loadCloudStateBlobs[\s\S]*loadCloudSessions/.test(appMain)) throw new Error("I sub-load non sono in Promise.all");
if (!/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*?hydrateFromCloudSnapshotCache\(\)\.catch/.test(appMain)) throw new Error("L'idratazione non è agganciata al boot dopo initFirebase");
if (!appMain.includes("writeCloudSnapshotCache(cloudUser?.uid")) throw new Error("Manca un hook di scrittura della cloud-cache");
// v147.79 · la freschezza della cache si decide sullo stamp cloud già applicato,
// non su meta.updatedAt locale (che ad ogni avvio viene riscritto a "adesso").
if (!/const appliedStamp = Date\.parse\(state\.meta\?\.cloudAppliedStamp/.test(appMain)) throw new Error("L'idratazione non usa più cloudAppliedStamp (regressione 29 agosto)");
if (!/cachedStamp < appliedStamp/.test(appMain)) throw new Error("La guardia dell'idratazione non confronta con appliedStamp");
if (!appMain.includes("saveState({ cloud: false, touch: false })")) throw new Error("Il boot non persiste più l'account con touch:false");

console.log("v14779-dashboard-costanza-cloud-cache: " + results.length + " verifiche passate");
for (const item of results) console.log("  ✓ " + item);
