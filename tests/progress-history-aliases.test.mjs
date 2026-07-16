import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"))
  .replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:key=>store.get(key)??null, setItem:(key,value)=>store.set(key,String(value)), removeItem:key=>store.delete(key) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{} };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, window:null, globalThis:null };
context.window = context;
context.globalThis = context;
vm.createContext(context);
new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const byName = (name) => state.training.exercises.find((exercise) => exercise.name === name);
  const history = (name) => { const exercise = byName(name); return exerciseHistory(exercise, 999, exercise.jump || ""); };
  const legCurl = history("Leg_curls_seduta");
  const pulley = history("Pulley_triangolo");
  const hack = history("Hack_Squat_con_elastico");
  if (legCurl.length < 6) throw new Error("storico Leg curl non consolidato");
  if (pulley.length < 6) throw new Error("storico Pulley non consolidato");
  if (hack.length < 3) throw new Error("storico Hack squat non consolidato");
  const heavyLunge = history("Affondo_pesante_triset");
  const rotationLunge = history("Affondo_con_rotazione_busto_triset");
  if (heavyLunge.some((row) => row.name === "Affondo_con_rotazione_busto_triset")) throw new Error("affondi diversi uniti per errore");
  if (rotationLunge.some((row) => row.name === "Affondo_pesante_triset")) throw new Error("affondi diversi uniti per errore");
  const unrelatedPress = history("Lento_avanti_manubri");
  if (unrelatedPress.some((row) => sessionLetter(row.sessionCode) !== "C")) throw new Error("varianti di schede diverse unite per errore");
  trainingHistoryIndex();
  const previousSessions = state.training.sessions;
  state.training.sessions = [...previousSessions, { id:"cache-test", date:"15/07/2026", dateInput:"2026-07-15", sessionCode:"A", exercises:[{ name:"Leg curl", kg:99, value:"99 kg" }] }];
  const refreshed = history("Leg_curls_seduta");
  if (!refreshed.some((row) => row._sessionId === "cache-test")) throw new Error("cache storico non aggiornata dopo importazione");
  return { ok:true, legCurl:legCurl.length, pulley:pulley.length, hack:hack.length, distinctLunges:true, cacheRefresh:true };
})()`, context);

console.log(JSON.stringify(result));
