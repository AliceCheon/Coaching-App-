import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile(new URL("../atlas-coach-app.html", import.meta.url), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"))
  .replace(/\s+initFirebase\(\);\s+render\(\);\s+importBundledNutritionBackup\(\);\s*$/, "");
const store = new Map();
const localStorage = { getItem:key=>store.get(key)??null, setItem:(key,value)=>store.set(key,String(value)), removeItem:key=>store.delete(key) };
const elements = new Map();
const makeElement = () => ({
  listeners:{}, addEventListener(type,listener){this.listeners[type]=listener}, querySelector(){return null}, querySelectorAll(){return[]},
  classList:{add(){},remove(){},toggle(){}}, style:{}, dataset:{}, innerHTML:"", textContent:"", title:"",
  setAttribute(name,value){this[name]=value}, getBoundingClientRect(){return {width:360}}
});
const document = {
  getElementById(id){if(!elements.has(id)) elements.set(id,makeElement());return elements.get(id)},
  querySelector(selector){return selector === 'meta[name="theme-color"]' ? document.getElementById("themeMeta") : null},
  querySelectorAll(){return[]}, createElement(){return makeElement()}, body:makeElement(), documentElement:makeElement(), addEventListener(){}
};
const context = { console, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage:localStorage, document, navigator:{}, location:{protocol:"file:",origin:"null",hash:""}, URL:{createObjectURL(){return "blob:test"},revokeObjectURL(){}}, Blob:class{}, FileReader:class{}, setTimeout(){return 1}, clearTimeout(){}, requestAnimationFrame(){return 1}, addEventListener(){}, removeEventListener(){}, window:null, globalThis:null };
context.window=context; context.globalThis=context; vm.createContext(context); new vm.Script(script).runInContext(context);

const result = vm.runInContext(`(() => {
  const button = document.getElementById("themeButton");
  if (typeof button.listeners.click !== "function") throw new Error("pulsante tema senza listener");
  state.profile.theme = "dark";
  render();
  if (document.body.dataset.theme !== "dark" || !button.title.includes("chiaro")) throw new Error("stato scuro non sincronizzato");
  button.listeners.click();
  if (state.profile.theme !== "light" || document.body.dataset.theme !== "light" || !button.title.includes("scuro")) throw new Error("passaggio al chiaro non riuscito");
  flushStateSave();
  const saved = JSON.parse(localStorage.getItem("alice-method-app.v8"));
  if (saved.profile.theme !== "light") throw new Error("tema chiaro non persistito");
  button.listeners.click();
  if (state.profile.theme !== "dark" || document.body.dataset.theme !== "dark") throw new Error("ritorno allo scuro non riuscito");
  flushStateSave();
  const savedDark = JSON.parse(localStorage.getItem("alice-method-app.v8"));
  if (savedDark.profile.theme !== "dark") throw new Error("tema scuro non persistito");
  return {ok:true,toggle:true,persisted:savedDark.profile.theme,button:button.title,battery:false};
})()`,context);

console.log(JSON.stringify(result));
