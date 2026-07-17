import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"))
  .replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");
const storage = new Map();
const localStorage = { getItem:k=>storage.get(k)??null, setItem:(k,v)=>storage.set(k,String(v)), removeItem:k=>storage.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, closest(){return null}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, setAttribute(){}, getAttribute(){return null}, innerHTML:"", textContent:"", focus(){} };
const document = { getElementById(){return {...element}}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:{...element}, documentElement:{...element}, addEventListener(){}, hidden:false };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, encodeURIComponent, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"https:",origin:"https://test",hash:"",reload(){}}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(fn){if(fn)fn();return 1}, addEventListener(){}, removeEventListener(){}, matchMedia(){return {matches:false}}, window:null, globalThis:null };
context.window=context; context.globalThis=context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const checks=[]; const check=(name,value)=>{checks.push({name,passed:!!value}); if(!value) throw new Error(name);};
  const first=technicalExerciseLibrary();
  const second=technicalExerciseLibrary();
  check("cache libreria riusata", first === second);
  const countsA=technicalProfileCounts();
  const countsB=technicalProfileCounts();
  check("cache conteggi riusata", countsA === countsB);
  const filteredA=exerciseLabFilteredProfiles();
  const filteredB=exerciseLabFilteredProfiles();
  check("cache filtri riusata", filteredA === filteredB);
  coachProgramUi.labQuery="hip thrust";
  const filteredC=exerciseLabFilteredProfiles();
  check("ricerca invalida risultati", filteredC !== filteredB && filteredC.every(item=>normalizeExerciseName(item.name+" "+item.primaryMuscles.join(" ")+" "+item.equipment).includes("hip thrust")));
  const program=programRepository.createProgram({name:"Cache test",durationWeeks:4,sheets:[]},{save:false}).value;
  const afterProgram=technicalExerciseLibrary();
  check("programma invalida cache", afterProgram !== first);
  const profile=upsertTechnicalExercise({id:"performance-custom",name:"Performance custom",origin:"custom",isCustom:true,primaryMuscles:["Glutei"]});
  check("profilo custom presente dopo invalidazione", technicalExerciseLibrary().some(item=>item.id===profile.id));
  check("pulsante copia kg renderizzato", sourceHtml.includes('class="compact-copy-kg"') && sourceHtml.includes('data-copy-kg='));
  check("copia non forza render completo", !sourceHtml.match(/values\[index \+ 1\] = current;[\s\S]{0,260}renderTrainingOnly\(\)/));
  check("salvataggio locale raggruppato", sourceHtml.includes("setTimeout(flushStateSave, 320)"));
  check("resize tramite frame", sourceHtml.includes('window.addEventListener("resize", scheduleChartRedraw, { passive:true })'));
  check("flush alla chiusura", sourceHtml.includes('window.addEventListener("pagehide"'));
  check("ricerca logbook debounce", sourceHtml.includes("logbookSearchTimer = setTimeout(render, 220)"));
  return {ok:true,checks};
})()`, Object.assign(context,{sourceHtml:html}));

console.log(JSON.stringify(result,null,2));
