import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>")).replace(/\s+initFirebase\(\);\s+render\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{} };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, window:null, globalThis:null };
context.window = context; context.globalThis = context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const july = state.training.sessions.filter((session) => String(session.dateInput || "").startsWith("2026-07"));
  const volumes = july.map(sessionVolumeInfo);
  if (volumes.length !== 5 || volumes.some((item) => !item.available || item.volume <= 0)) throw new Error("volume luglio non calcolato");
  if (volumes.some((item) => item.countedSets < 2)) throw new Error("serie della scheda non recuperate");
  const stats = dashboardWorkoutStats();
  if (!stats.volumeAvailable || stats.volume <= 0) throw new Error("volume dashboard non disponibile");
  if (stats.adherence <= 0) throw new Error("aderenza dashboard ancora a zero");
  const dashboard = dashboardHtml();
  if (dashboard.includes("Volume non disponibile") || dashboard.includes(">0%</strong>")) throw new Error("dashboard mostra ancora zeri o vecchi messaggi");
  return {ok:true, july:july.length, volume:Math.round(stats.volume), adherence:stats.adherence};
})()`, context);
console.log(JSON.stringify(result));
