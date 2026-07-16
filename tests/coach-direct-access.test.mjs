import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>")).replace(/\s+initFirebase\(\);\s+render\(\);\s*$/, "");
const storage = new Map();
const localStorage = { getItem:k=>storage.get(k)??null, setItem:(k,v)=>storage.set(k,String(v)), removeItem:k=>storage.delete(k) };
const element = { addEventListener(){}, querySelector(){return null}, querySelectorAll(){return[]}, classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, setAttribute(){}, innerHTML:"", textContent:"" };
const document = { getElementById(){return element}, querySelector(){return null}, querySelectorAll(){return[]}, createElement(){return {...element}}, body:element, documentElement:element, addEventListener(){} };
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:"",reload(){}}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, matchMedia(){return {matches:true}}, window:null, globalThis:null };
context.window=context; context.globalThis=context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const checks=[]; const check=(name,value)=>{checks.push({name,passed:!!value});if(!value)throw new Error(name);};
  state=clone(baseState); state.profile.mode="athlete"; render=()=>{}; saveState=()=>{};
  check("coachHtml accessibile in modalita atleta", !coachHtml().includes("Coach Studio <span>bloccato</span>"));
  setScreen("coach");
  check("navigazione diretta Coach", activeScreen==="coach"&&activeBottom==="coach"&&state.profile.mode==="coach"&&state.coach.unlocked===true);
  state.profile.mode="athlete"; activeScreen="dashboard"; setBottom("coach");
  check("accesso diretto anche dalla navigazione", activeScreen==="coach"&&state.profile.mode==="coach"&&state.coach.unlocked===true);
  return {ok:true,checks};
})()`, context);

if (html.includes('if (state.profile.mode !== "coach") return coachLockHtml();')) throw new Error("blocco PIN ancora collegato al Coach");
if (html.includes('id="modeButton" title="Coach" aria-label="Coach">PIN</button>')) throw new Error("pulsante PIN ancora visibile");
if (html.includes("coachPinInput") || html.includes("PIN non corretto") || html.includes("coachLockHtml")) throw new Error("vecchio blocco PIN ancora presente");
if (!html.includes('window.matchMedia("(min-width: 981px)")')) throw new Error("protezione interfaccia mobile rimossa");
console.log(JSON.stringify(result,null,2));
