import fs from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const appMain = await fs.readFile(new URL("../src/app-main.js", import.meta.url), "utf8");
const workoutFlow = await fs.readFile(new URL("../workout-flow-v147.js", import.meta.url), "utf8");
const vmLibs = await Promise.all(["exercise-library-19.8.js", "master-exercise-library.js", "app-config-v144.js", "athlete-context.js", "coach-ai-engine-2.js", "knowledge-graph.js", "decision-rules.js", "decision-engine.js", "coach-ai3-programming.js", "coach-studio.js"].map((p) => fs.readFile(new URL("../" + p, import.meta.url), "utf8")));
const prologue = "window.matchMedia=window.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));window.AudioContext=window.AudioContext||function(){};window.webkitAudioContext=window.AudioContext;window.setInterval=window.setInterval||function(){return 1};window.clearInterval=window.clearInterval||function(){};window.history=window.history||{pushState(){},replaceState(){},back(){}};window.performance=window.performance||{now:()=>Date.now(),mark(){},measure(){},getEntriesByType(){return[]}};";
const script = vmLibs.join("\n;\n") + "\n;\n" + prologue + appMain.replace(/\s*const firebaseBootStarted = initFirebase\(\);[\s\S]*$/, "") + "\n;\n" + workoutFlow;

const storage = new Map();
const localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const element = { addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {}, remove() {}, click() {}, focus() {}, scrollIntoView() {}, classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, innerHTML: "", textContent: "", disabled: false };
const document = { activeElement: null, getElementById() { return { ...element, contains(node) { return node?.insideScreen === true; } }; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { ...element }; }, body: { ...element }, documentElement: { ...element }, addEventListener() {} };
const context = { console, TextEncoder, TextDecoder, structuredClone, Date, Math, JSON, Intl, Map, Set, WeakMap, Array, Object, String, Number, Boolean, RegExp, Promise, parseInt, parseFloat, isNaN, localStorage, sessionStorage: localStorage, document, navigator: {}, location: { protocol: "file:", origin: "null", hash: "" }, URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }, Blob: class {}, FileReader: class {}, setTimeout() { return 1; }, clearTimeout() {}, requestAnimationFrame() { return 1; }, addEventListener() {}, removeEventListener() {}, postMessage() {}, window: null, globalThis: null };
context.window = context; context.globalThis = context; vm.createContext(context); new vm.Script(script).runInContext(context);

test("typing in the Coach portal defers full and local board replacement", () => {
  const result = vm.runInContext(`(() => {
    const portalInput={tagName:"INPUT",type:"text",insideScreen:false};
    document.getElementById=(id)=>id==="coachModalPortalHost"?{contains(node){return node===portalInput;}}:id==="screen"?{contains(){return false;}}:null;
    document.activeElement=portalInput;
    activeScreen="coach"; pendingRemoteRender=false;
    const editing=userIsEditingScreen();
    const replaced=renderCoachProgramBoardLocal();
    activeScreen="training"; pendingRemoteRender=false;
    const trainingRedraw=renderTrainingOnly();
    activeScreen="coach"; pendingRemoteRender=false;
    const sideRedraw=renderCoachSidePanelLocal();
    return {editing,replaced,pending:pendingRemoteRender,trainingRedraw,sideRedraw};
  })()`, context);
  assert.deepEqual({ ...result }, { editing: true, replaced: false, pending: true, trainingRedraw:false, sideRedraw:false });
});

test("cleared RIR stays cleared and workout logs start without assumed RIR", () => {
  const result = vm.runInContext(`(() => {
    state=clone(baseState); state.programs=[]; state.training.sessions=[]; state.coach.progressionTemplates=[];
    const p=programRepository.createProgram({id:"rir-reg-p",name:"RIR regression",durationWeeks:2,sheets:[]},{save:false}).value;
    const s=programRepository.createSheet(p.id,{id:"rir-reg-s",code:"A",name:"A"},{save:false}).value;
    const e=programRepository.createExercise(p.id,s.id,{id:"rir-reg-e",name:"Hip Thrust",sets:2,reps:"8",rir:"2",prescription:{sets:2,reps:"8",rir:"2"},progression:{weeks:[{weekNumber:1,sets:2,reps:"8",rir:"1"}]}},{save:false}).value;
    const patch=inlineExercisePatch(e,"rir","",1);
    const saved=programRepository.updateExercise(p.id,s.id,e.id,patch,{save:false,forceLocked:true});
    const reread=programRepository.getExerciseById(p.id,s.id,e.id);
    const displayed=coachWeekPrescription(reread,1).rir;
    const exercise=exercisePrescriptionForTrainingWeek({...reread,sets:"2",reps:"8",rir:"1"},1);
    const key="0:"+normalizeExerciseName(exercise.name);
    state.training.activeWorkout={status:"active",logs:{[key]:{kg:["40","35"],reps:["8","8"]}}};
    const context={session:{exercises:[exercise]}};
    window.BarbellDivaWorkoutV147.completedSetsFor(exercise,context);
    const loggedRir=state.training.activeWorkout.logs[key].rir;
    return {saved:saved.ok,cleared:!!reread.progression.weeks[0].rir.cleared,displayed,exerciseRir:exercise.rir,loggedRir:[...loggedRir]};
  })()`, context);
  assert.equal(result.saved, true);
  assert.equal(result.cleared, true);
  assert.equal(result.displayed, "");
  assert.equal(result.exerciseRir, "");
  assert.deepEqual([...result.loggedRir], ["", ""]);
});
