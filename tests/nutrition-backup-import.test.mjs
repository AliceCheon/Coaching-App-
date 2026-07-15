import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const html = await fs.readFile(new URL("atlas-coach-app.html", root), "utf8");
const backup = JSON.parse(await fs.readFile(new URL("dashboard-alimentazione-backup-2026-07-15.json", root), "utf8"));
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"))
  .replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:k=>store.get(k)??null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{} };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, BARBELL_DIVA_FOOD_BACKUP:structuredClone(backup), fetch:async()=>{throw new Error("fetch non deve essere usato in file locale")}, window:null, globalThis:null };
context.window = context; context.globalThis = context; vm.createContext(context); new vm.Script(script).runInContext(context);

vm.runInContext(`state.nutrition.dashboard={log:[{date:"2026-07-10",weight:"99",kcal:"2400"}]}; state.migrations.nutritionBackup15Jul2026=0;`, context);
const imported = await vm.runInContext("importBundledNutritionBackup()", context);
const result = vm.runInContext(`(() => {
  const food = state.nutrition.dashboard;
  if (!${imported}) throw new Error("importazione non eseguita");
  if (food.log.length !== 3 || food.measures.length !== 4 || food.photos.length !== 7) throw new Error("backup Food incompleto");
  if (food.log.find((row) => row.date === "2026-07-10").weight !== "99") throw new Error("dato locale sovrascritto");
  if (food.profile.phase !== "Lean Bulk - Step 1" || food.checkin.adherence !== 3) throw new Error("profilo o questionario mancanti");
  const before = JSON.stringify(food);
  return {ok:true, log:food.log.length, measures:food.measures.length, photos:food.photos.length, localPriority:food.log.find((row)=>row.date==="2026-07-10").weight};
})()`, context);
console.log(JSON.stringify(result));
