import fs from "node:fs/promises";
import vm from "node:vm";

// v147.58 · Pre-riscaldo della copia locale (eco localStorage riarmata col cloud attivo)
// Design: docs/design-avvio-parallelo-cloud-cache.md + checkpoint 13
// Verifica: l'eco silenziosa (touch:false) scrive davvero STORE_KEY anche col cloud
// attivo, senza toccare meta.updatedAt; touch:true resta no-op col cloud attivo;
// l'idratazione da cloud-cache finisce a sua volta in STORE_KEY (ponte); la quota
// esaurita degrada in silenzio.

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
  const KEY = "alice-method-app.v8";
  const STAMP = "2026-09-30T12:00:00.000Z";

  // T1 — cloud attivo: l'eco silenziosa scrive davvero STORE_KEY, senza toccare meta.updatedAt
  cloudUser = { uid: "alice-test" };
  state.profile.account = { uid: "alice-test", syncReady: true, cloudStatus: "sync" };
  state.meta = { ...(state.meta || {}), updatedAt: STAMP };
  state.training.sessions = [{ id: "s-echo", date: "2026-09-30", source: "App", status: "completed", exercises: [] }];
  localStorage.removeItem(KEY);
  assert(echoLocalStateQuietly() === true, "eco silenziosa col cloud attivo: riuscita");
  const written = JSON.parse(localStorage.getItem(KEY) || "null");
  assert(!!written && (written.training?.sessions || []).some((s) => s.id === "s-echo"), "eco silenziosa: STORE_KEY contiene lo stato corrente");
  assert(written.meta?.updatedAt === STAMP, "eco silenziosa: meta.updatedAt NON toccato (touch:false)");

  // T2 — touch:true col cloud attivo: resta no-op (non finge un locale più nuovo del cloud)
  localStorage.removeItem(KEY);
  assert(echoLocalStateQuietly({ touch: true }) === true, "touch:true col cloud attivo: no-op come prima del pre-riscaldo");
  assert(localStorage.getItem(KEY) === null, "touch:true col cloud attivo: nessuna scrittura");

  // T3 — idratazione da cloud-cache: lo stato idratato finisce in STORE_KEY (ponte di pre-riscaldo)
  const cache = await caches.open("atlas-cloud-snap-v1");
  const STAMP_CACHE = "2026-09-30T15:00:00.000Z";
  await cache.put("/__cloud-snap-v1__", new Response(JSON.stringify({ schema: 1, uid: "alice-test", updatedAt: STAMP_CACHE, savedAt: STAMP_CACHE, state: { meta: { updatedAt: STAMP_CACHE }, programs: [], training: { sessions: [{ id: "s-cache", date: "2026-09-30", source: "App", status: "completed", exercises: [] }] } } })));
  state.meta = { ...(state.meta || {}), updatedAt: STAMP }; // locale più vecchio della cache
  assert(await hydrateFromCloudSnapshotCache() === true, "idratazione: cache più nuova applicata");
  assert((state.training.sessions || []).some((s) => s.id === "s-cache"), "idratazione: la seduta della cache è nello stato");
  const bridged = JSON.parse(localStorage.getItem(KEY) || "null");
  assert(!!bridged && (bridged.training?.sessions || []).some((s) => s.id === "s-cache"), "pre-riscaldo ponte: lo stato idratato finisce in STORE_KEY");
  assert(bridged.meta?.updatedAt === STAMP_CACHE, "pre-riscaldo ponte: lo stamp cloud è preservato, non finguito");

  // T4 — quota esaurita col cloud attivo: fallimento silenzioso, nessun errore esposto
  const realSet = localStorage.setItem;
  localStorage.setItem = () => { throw Object.assign(new Error("quota exceeded"), { name: "QuotaExceededError" }); };
  assert(echoLocalStateQuietly() === false, "quota esaurita col cloud attivo: false, senza eccezioni");
  assert(lastPersistenceError === null, "quota esaurita col cloud attivo: nessun errore esposto all'utente");
  localStorage.setItem = realSet;

  return results;
})()`, context);

// Struttura: il no-op generalizzato col cloud attivo è sparito, ma la guardia touch:true resta
if (/if \(cloudUser && state\.profile\.account\?\.syncReady\) return true;/.test(appMain)) throw new Error("L'eco è ancora no-op col cloud attivo: il pre-riscaldo non è attivo");
if (!/if \(options\.touch === true && cloudUser && state\.profile\.account\?\.syncReady\) return true;/.test(appMain)) throw new Error("La guardia touch:true col cloud attivo è sparita (protezione meta.updatedAt persa)");
if (!appMain.includes("PRE-RISCALDO")) throw new Error("Manca il commento segnaletico del pre-riscaldo");

console.log("v14765-dashboard-costanza: " + results.length + " verifiche passate");
for (const item of results) console.log("  ✓ " + item);
