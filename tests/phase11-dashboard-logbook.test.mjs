import fs from "node:fs/promises";
import vm from "node:vm";
const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>")).replace(/\s+initFirebase\(\);\s+render\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{} };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, window:null, globalThis:null };
context.window=context; context.globalThis=context; context.sourceHtml=html; vm.createContext(context); new vm.Script(script).runInContext(context);
const result = vm.runInContext(`(() => {
  state.training.sessions = [
    { dateInput:"2026-07-13", sessionCode:"C6", sessionName:"Lower body", phase:"Intensificazione", week:6, status:"completed", exercises:[{name:"Hip Thrust",kg:80,reps:8,sets:[{kg:80,reps:8}]}] },
    { dateInput:"2026-07-10", sessionCode:"B", sessionName:"Upper body", phase:"Intensificazione", week:5, exercises:[{name:"Military",kg:30,reps:10,sets:[{kg:30,reps:10}]}] }
  ];
  const dashboard = dashboardHtml();
  if (!dashboard.includes("phase11-summary-grid") || !dashboard.includes("Inizia allenamento") || !dashboard.includes("phase11-bars")) throw new Error("Dashboard Fase 11 incompleta");
  const logbook = logbookHtml();
  if (!logbook.includes("phase11LogbookSearch") || !logbook.includes("C6") || !logbook.includes("Dettagli seduta")) throw new Error("Logbook Fase 11 incompleto");
  state.ui = { logbookSearch:"Military" };
  const filtered = logbookSessionsForUi();
  if (filtered.length !== 1 || filtered[0].sessionCode !== "B") throw new Error("filtro logbook non funzionante");
  if (!trainingHtml().includes("workout-progress")) throw new Error("progressione workout non presente");
  return {ok:true, sessions:state.training.sessions.length, filtered:filtered.length};
})()`, context);
console.log(JSON.stringify(result,null,2));
