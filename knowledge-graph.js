(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.BarbellDivaKnowledgeGraph=api;})(typeof globalThis!=="undefined"?globalThis:window,function(){
  "use strict";
  const VERSION="23.0.0",list=v=>Array.isArray(v)?v:[],clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[_-]+/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
  function stableHash(value){let h=2166136261,t=JSON.stringify(value);for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
  function semanticValue(value){if(Array.isArray(value))return value.map(semanticValue);if(!value||typeof value!=="object")return value;return Object.fromEntries(Object.keys(value).sort().filter(key=>!["updatedAt","createdAt","generatedAt","lastVisitedAt"].includes(key)).map(key=>[key,semanticValue(value[key])]));}
  function semanticHash(value){return stableHash(semanticValue(value));}
  function nodeId(type,id){return`${type}:${String(id||"unknown")}`;}
  function build(input={}){
    const state=input.state||{},athleteApi=input.athleteApi||{},masterApi=input.masterApi||{},programId=input.programId||"";
    const athleteStore=athleteApi.normalizeStore?athleteApi.normalizeStore(state.athleteIntelligence,state):(state.athleteIntelligence||{});
    const livePrograms=list(state.programs).filter(p=>!p.deletedAt),selected=livePrograms.find(p=>p.id===programId)||livePrograms[0]||{id:"",name:"",sheets:[]};
    const selectedContext=athleteApi.selectors?athleteApi.selectors(athleteStore,state,selected.id):{athlete:list(athleteStore.athletes)[0]||{},strategy:list(athleteStore.strategies)[0]||{},nutrition:{},programLink:{},missing:[]};
    const masterStore=masterApi.normalizeStore?masterApi.normalizeStore(state.masterExerciseLibrary||{}):(state.masterExerciseLibrary||{}),nodes=[],edges=[],seen=new Set(),edgeSeen=new Set();
    const add=(type,id,label,data,domain)=>{const nid=nodeId(type,id);if(!seen.has(nid)){seen.add(nid);nodes.push({id:nid,type,entityId:String(id||""),label:String(label||id||type),domain,data:clone(data||{})});}return nid;};
    const link=(from,to,relation,data={})=>{if(!from||!to)return;const key=`${from}|${relation}|${to}`;if(edgeSeen.has(key))return;edgeSeen.add(key);edges.push({id:`edge:${stableHash(key)}`,from,to,relation,data:clone(data)});};
    list(athleteStore.athletes).forEach(athlete=>{
      const aid=add("athlete",athlete.id,athlete.general?.name,athlete,"athlete");
      list(athlete.pains).forEach(pain=>link(aid,add("pain",pain.id||stableHash(pain),pain.area,pain,"limitations"),"reports-pain"));
      list(athlete.motorLimitations).forEach(limit=>link(aid,add("limitation",limit.id||stableHash(limit),limit.movement,limit,"limitations"),"has-limitation"));
      list(athlete.equipment?.items).forEach(e=>link(aid,add("equipment",norm(e),e,{name:e},"equipment"),"has-access-to"));
      list(athlete.muscles?.priorities).forEach(item=>{const name=item.muscle||item;link(aid,add("muscle",norm(name),name,{name},"exercise-knowledge"),"prioritizes",{level:item.level||"media"});});
    });
    list(athleteStore.strategies).forEach(strategy=>{const sid=add("strategy",strategy.id,strategy.name,strategy,"strategy");link(nodeId("athlete",strategy.athleteId),sid,"follows-strategy");const block=add("block",strategy.id,strategy.blockType||strategy.name,{type:strategy.blockType,durationWeeks:strategy.durationWeeks,targetFatigue:strategy.targetFatigue},"strategy");link(sid,block,"defines-block");});
    Object.entries(athleteStore.nutritionByAthlete||{}).forEach(([athleteId,nutrition])=>link(nodeId("athlete",athleteId),add("nutrition",athleteId,nutrition.phase,nutrition,"nutrition"),"has-nutrition-context"));
    list(masterStore.records).forEach(record=>{
      const mid=add("master-exercise",record.id,record.identity?.name,record,"exercise-knowledge");
      list(record.muscles).forEach(m=>link(mid,add("muscle",norm(m.name),m.name,{name:m.name},"exercise-knowledge"),"trains-muscle",{role:m.role,weight:m.weight}));
      list(record.patterns).forEach(p=>link(mid,add("pattern",norm(p.name),p.name,{name:p.name},"exercise-knowledge"),"uses-pattern",{role:p.role||"primary"}));
      [...list(record.equipment?.required),...list(record.equipment?.optional),...list(record.equipment?.alternatives)].forEach(e=>link(mid,add("equipment",norm(e),e,{name:e},"equipment"),"requires-equipment"));
      Object.entries(record.relations||{}).forEach(([relation,ids])=>list(ids).forEach(id=>link(mid,nodeId("master-exercise",id),`exercise-${relation}`)));
    });
    livePrograms.forEach(program=>{
      const pid=add("program",program.id,program.name,program,"programming"),programLink=athleteStore.programLinks?.[program.id]||{};
      if(programLink.athleteId)link(nodeId("athlete",programLink.athleteId),pid,"assigned-program");if(programLink.strategyId)link(nodeId("strategy",programLink.strategyId),pid,"guides-program");
      list(program.sheets).filter(s=>!s.deletedAt).forEach(sheet=>{const sid=add("sheet",sheet.id,sheet.name||sheet.code,sheet,"programming");link(pid,sid,"contains-sheet",{order:sheet.order});list(sheet.exercises).filter(e=>!e.deletedAt).forEach(ex=>{const eid=add("program-exercise",ex.id,ex.name,ex,"programming");link(sid,eid,"contains-exercise",{order:ex.order});const masterId=ex.masterExerciseId||ex.metadata?.masterExerciseId||ex.metadata?.technicalProfileId;if(masterId)link(eid,nodeId("master-exercise",masterId),"instance-of");const progression=ex.progression||{};if(ex.progressionId||ex.progressionMethod||progression.templateId||progression.rule||list(progression.weeks).length){const prid=add("progression",`${program.id}:${sheet.id}:${ex.id}`,progression.templateId||ex.progressionMethod||"personalizzata",progression,"progressions");link(eid,prid,"uses-progression");}});});
    });
    list(state.training?.sessions).forEach(session=>{const sid=add("workout-session",session.id||stableHash(session),session.sessionName||session.sessionCode,session,"history");list(session.exercises).forEach((ex,index)=>{const perf=add("performance",`${session.id||stableHash(session)}:${index}`,ex.name,{...ex,sessionId:session.id||"",date:session.dateInput||session.date||""},"performance");link(sid,perf,"records-performance");});});
    Object.entries(athleteStore.insightHistory||{}).forEach(([athleteId,items])=>list(items).forEach(item=>link(nodeId("athlete",athleteId),add("insight",item.id,item.title,item,"insights"),"received-insight")));
    const domainData={athlete:athleteStore.athletes,strategy:athleteStore.strategies,nutrition:athleteStore.nutritionByAthlete,limitations:list(athleteStore.athletes).flatMap(a=>[...list(a.pains),...list(a.motorLimitations)]),equipment:list(athleteStore.athletes).map(a=>a.equipment),programming:livePrograms,"exercise-knowledge":masterStore,progressions:livePrograms.flatMap(p=>list(p.sheets).flatMap(s=>list(s.exercises).map(e=>e.progression))),history:state.training?.sessions||[],performance:list(state.training?.sessions).flatMap(s=>list(s.exercises)),insights:athleteStore.insightHistory||{}};
    const domains=Object.fromEntries(Object.entries(domainData).map(([key,value])=>[key,semanticHash(value)])),snapshot={version:VERSION,programId:selected.id,nodes,edges,domains,fingerprint:stableHash({domains,programId:selected.id})};
    return{snapshot,selectedContext,selectedProgram:selected,athleteStore,masterStore};
  }
  function createService(input={}){
    const built=build(input),byId=new Map(built.snapshot.nodes.map(n=>[n.id,n])),outgoing=new Map();built.snapshot.edges.forEach(e=>{if(!outgoing.has(e.from))outgoing.set(e.from,[]);outgoing.get(e.from).push(e);});
    const query=(type,predicate=()=>true)=>built.snapshot.nodes.filter(n=>(!type||n.type===type)&&predicate(n));
    const related=(id,relation)=>list(outgoing.get(id)).filter(e=>!relation||e.relation===relation).map(e=>({edge:e,node:byId.get(e.to)})).filter(x=>x.node);
    const getAthleteContext=(athleteId=built.selectedContext.athlete?.id)=>clone(byId.get(nodeId("athlete",athleteId))?.data||built.selectedContext.athlete||{});
    const getExerciseKnowledge=idOrName=>{const key=String(idOrName||""),direct=byId.get(nodeId("master-exercise",key));return clone((direct||query("master-exercise",n=>norm(n.label)===norm(key))[0])?.data||null);};
    const getProgrammingContext=(programId=built.selectedProgram.id)=>clone(byId.get(nodeId("program",programId))?.data||built.selectedProgram||{});
    const getDecisionContext=()=>({context:clone(built.selectedContext),program:getProgrammingContext(),sessions:query("workout-session").map(n=>clone(n.data)),masterLibrary:clone(built.masterStore),knowledgeSnapshot:clone(built.snapshot)});
    return{VERSION,snapshot:()=>clone(built.snapshot),getKnowledgeSnapshot:()=>clone(built.snapshot),getAthleteContext,getExerciseKnowledge,getProgrammingContext,getDecisionContext,query,related};
  }
  function changedDomains(previous={},next={}){return[...new Set([...Object.keys(previous||{}),...Object.keys(next||{})])].filter(key=>previous?.[key]!==next?.[key]);}
  return{VERSION,stableHash,semanticHash,norm,nodeId,build,createService,changedDomains};
});
