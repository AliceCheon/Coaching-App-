import fs from "node:fs/promises";
import vm from "node:vm";
import { performance } from "node:perf_hooks";

const requested = process.argv[2] || "../atlas-coach-app.html";
const html = await fs.readFile(new URL(requested, import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"))
  .replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");
const storage = new Map();
let storageWrites = 0;
const localStorage = { getItem:k=>storage.get(k)??null, removeItem:k=>storage.delete(k), setItem(k,v){storageWrites += 1; storage.set(k,String(v));} };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, closest(){return null}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, setAttribute(){}, getAttribute(){return null}, getBoundingClientRect(){return {width:1200,height:800}}, innerHTML:"", textContent:"", disabled:false, scrollIntoView(){}, focus(){} };
const document = { getElementById(){return {...element}}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:{...element}, documentElement:{...element}, addEventListener(){}, visibilityState:"visible", hidden:false };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"https:",origin:"https://example.test",hash:"",reload(){}}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, performance, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(fn){if(typeof fn==="function")fn();return 1}, cancelAnimationFrame(){}, addEventListener(){}, removeEventListener(){}, matchMedia(){return {matches:false}}, window:null, globalThis:null };
context.window=context; context.globalThis=context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const bench = (name, fn, iterations) => {
    fn();
    const start = performance.now();
    let value;
    for (let index=0; index<iterations; index+=1) value=fn();
    const elapsed = performance.now()-start;
    return { name, iterations, totalMs:Number(elapsed.toFixed(3)), averageMs:Number((elapsed/iterations).toFixed(3)), nodes:typeof value === "string" ? (value.match(/<[a-z][^>]*>/gi)||[]).length : undefined };
  };
  state.profile.mode="coach";
  state.coach.activeTab="create";
  coachProgramUi.labQuery="";
  return [
    bench("technicalExerciseLibrary", ()=>technicalExerciseLibrary(), 30),
    bench("technicalProfileCounts", ()=>technicalProfileCounts(), 30),
    bench("trainingHtml", ()=>trainingHtml(), 20),
    bench("coachHtml", ()=>coachHtml(), 8),
    bench("exerciseLabHtml", ()=>exerciseLabHtml(), 20)
  ];
})()`, context);

console.log(JSON.stringify({ file:requested, bytes:html.length, localStorageWritesDuringLoad:storageWrites, measurements:result }, null, 2));
