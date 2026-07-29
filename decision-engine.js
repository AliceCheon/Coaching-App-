(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.BarbellDivaDecisionEngine=api;})(typeof globalThis!=="undefined"?globalThis:window,function(){
  "use strict";
  const VERSION="23.0.0",list=v=>Array.isArray(v)?v:[],clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const PRIORITY={bassa:1,media:2,alta:3,massima:4},SEVERITY={info:1,success:1,warning:2,critical:3},CONFIDENCE={bassa:1,media:2,alta:3};
  function createDecisionEngine(options={}){
    const graphApi=options.graphApi,rulesApi=options.rulesApi,analyzer=options.analyzer,cache=new Map(),events=[],traces=new Map();let previousDomains={},lastSourceKey="",lastKnowledge=null;let stats={hits:0,misses:0,invalidations:0,lastDurationMs:0,graphRebuilds:0};
    const emit=(type,payload={})=>{const event={id:`event-${Date.now().toString(36)}-${events.length}`,type,at:new Date().toISOString(),payload:clone(payload)};events.push(event);if(events.length>200)events.shift();return event;};
    const invalidate=(domains=[])=>{const changed=new Set(domains);for(const[key,item]of cache){if(!domains.length||item.dependencies.some(d=>changed.has(d))){cache.delete(key);stats.invalidations++;}}};
    function rank(d){return(PRIORITY[d.priority]||2)*100+(SEVERITY[d.severity]||1)*10+(CONFIDENCE[d.confidence]||2);}
    function normalizeDecision(raw,rule){const core={rule:rule.id,category:raw.category,target:list(raw.effects).map(x=>`${x.axis}:${x.target}:${x.direction}`),title:raw.title};return{id:`decision-${graphApi.stableHash(core)}`,category:raw.category||rule.category,priority:raw.priority||"media",severity:raw.severity||"info",confidence:raw.confidence||"media",dataUsed:list(raw.dataUsed),rationale:raw.rationale||"",suggestion:raw.suggestion||"",rulesApplied:[rule.id],conflicts:[],status:"new",actions:list(raw.actions),sheetId:raw.sheetId||"",exerciseId:raw.exerciseId||"",effects:list(raw.effects),trace:{dataRead:list(raw.dataUsed),rules:[rule.id],conditions:list(raw.conditions),alternativesDiscarded:[]},title:raw.title||rule.id};}
    function fromInsight(item){return{id:item.id,category:item.category,scope:item.scope||"coach",identityKey:item.identityKey||"",variantRole:item.variantRole||"",priority:item.priority||"media",severity:item.severity||"info",confidence:item.confidence||"media",dataUsed:list(item.data),rationale:item.reason||item.description||"",suggestion:item.suggestion||"",rulesApplied:["analytics.coach-ai2"],conflicts:[],status:item.status||"new",actions:list(item.actions),sheetId:item.sheetId||"",exerciseId:item.exerciseId||"",effects:[],trace:{dataRead:list(item.data),rules:["analytics.coach-ai2"],conditions:[{expression:"deterministic analysis emitted insight",value:true}],alternativesDiscarded:[]},title:item.title,description:item.description||""};}
    function resolveConflicts(decisions){const discarded=new Set();for(let i=0;i<decisions.length;i++)for(let j=i+1;j<decisions.length;j++){const a=decisions[i],b=decisions[j];const conflict=list(a.effects).some(x=>list(b.effects).some(y=>x.axis===y.axis&&(x.target===y.target||x.target==="program"||y.target==="program")&&Number(x.direction)*Number(y.direction)<0));if(!conflict)continue;const winner=rank(a)>=rank(b)?a:b,loser=winner===a?b:a;winner.conflicts.push({with:loser.id,reason:`${winner.priority}/${winner.severity} prevale su ${loser.priority}/${loser.severity}`,resolution:"winner"});winner.trace.alternativesDiscarded.push({id:loser.id,title:loser.title,reason:"Priorità, severità o attendibilità inferiori nel medesimo asse decisionale."});discarded.add(loser.id);}
      return decisions.filter(d=>!discarded.has(d.id));
    }
    function mergeSimilarDecisions(decisions){
      const groups=new Map();
      list(decisions).forEach(decision=>{
        const target=decision.identityKey||decision.exerciseId||decision.sheetId||"program",exercisePhenomenon=Boolean(decision.exerciseId)&&["exercise-performance","progressions"].includes(decision.category),key=`${exercisePhenomenon?"exercise-analysis":decision.category||"general"}|${target}`,current=groups.get(key);
        if(!current){groups.set(key,clone(decision));return;}
        const preferred=rank(decision)>rank(current)?clone(decision):current,secondary=preferred===current?decision:current;
        preferred.dataUsed=[...new Map([...list(preferred.dataUsed),...list(secondary.dataUsed)].map(item=>[`${item.label||""}|${item.value||""}`,item])).values()];
        preferred.actions=[...new Map([...list(preferred.actions),...list(secondary.actions)].map(item=>[`${item.type||""}|${item.exerciseId||""}|${item.sheetId||""}`,item])).values()];
        preferred.rulesApplied=[...new Set([...list(preferred.rulesApplied),...list(secondary.rulesApplied)])];
        preferred.trace={...(preferred.trace||{}),dataRead:preferred.dataUsed,rules:preferred.rulesApplied,mergedInsights:[...new Set([...(preferred.trace?.mergedInsights||[]),secondary.id])],alternativesDiscarded:[...list(preferred.trace?.alternativesDiscarded),{id:secondary.id,title:secondary.title,reason:"Unito a un rilievo equivalente sullo stesso esercizio."}]};
        preferred.mergedCount=Number(current.mergedCount||1)+Number(decision.mergedCount||1);
        groups.set(key,preferred);
      });
      return [...groups.values()];
    }
    function toInsight(d){return{id:d.id,category:d.category,scope:d.scope||"coach",identityKey:d.identityKey||"",variantRole:d.variantRole||"",priority:d.priority,severity:d.severity,confidence:d.confidence,status:d.status,title:d.title,description:d.description||d.rationale,data:d.dataUsed,reason:d.rationale,suggestion:d.suggestion,actions:d.actions,decisionTrace:d.trace,conflicts:d.conflicts,sheetId:d.sheetId,exerciseId:d.exerciseId,mergedCount:d.mergedCount||1};}
    function evaluate(input={}){
      const started=typeof performance!=="undefined"?performance.now():Date.now(),sourceKey=graphApi.semanticHash({programId:input.programId,athleteIntelligence:input.state?.athleteIntelligence,masterExerciseLibrary:input.state?.masterExerciseLibrary,programs:input.state?.programs,trainingSessions:input.state?.training?.sessions});
      const knowledge=lastKnowledge&&lastSourceKey===sourceKey?lastKnowledge:graphApi.createService({state:input.state,programId:input.programId,athleteApi:input.athleteApi,masterApi:input.masterApi});if(knowledge!==lastKnowledge){lastKnowledge=knowledge;lastSourceKey=sourceKey;stats.graphRebuilds++;}
      const snapshot=knowledge.getKnowledgeSnapshot(),changed=graphApi.changedDomains(previousDomains,snapshot.domains);if(changed.length){changed.forEach(domain=>emit(`${domain}.changed`,{domain,from:previousDomains[domain]||null,to:snapshot.domains[domain]}));invalidate(changed);previousDomains={...snapshot.domains};}
      const decisionContext=knowledge.getDecisionContext(),key=graphApi.stableHash({snapshot:snapshot.fingerprint,config:input.config||{}});if(cache.has(key)){stats.hits++;stats.lastDurationMs=Math.round((typeof performance!=="undefined"?performance.now():Date.now())-started);const cached=clone(cache.get(key).result);cached.cache={hit:true,key,changedDomains:[]};return cached;}
      stats.misses++;const analysis=analyzer.analyze({context:decisionContext.context,program:decisionContext.program,sessions:decisionContext.sessions,masterLibrary:decisionContext.masterLibrary,config:input.config||{}}),ruleContext={knowledge,snapshot,context:decisionContext.context,program:decisionContext.program,analysis},ruleDecisions=[];
      list(rulesApi.RULES).forEach(rule=>{list(rule.evaluate(ruleContext)).forEach(raw=>ruleDecisions.push(normalizeDecision(raw,rule)));});
      const all=[...list(analysis.insights).map(fromInsight),...ruleDecisions],decisions=mergeSimilarDecisions(resolveConflicts(all)),historyById=new Map(list(input.history).map(x=>[x.id,x]));decisions.forEach(d=>{if(historyById.has(d.id))d.status=historyById.get(d.id).status||d.status;traces.set(d.id,clone(d.trace));});
      const result={...analysis,version:VERSION,knowledgeFingerprint:snapshot.fingerprint,decisions,insights:decisions.map(toInsight),decisionTrace:Object.fromEntries(decisions.map(d=>[d.id,d.trace])),events:events.slice(-30),cache:{hit:false,key,changedDomains:changed},knowledge:{version:snapshot.version,nodeCount:snapshot.nodes.length,edgeCount:snapshot.edges.length,domains:snapshot.domains}};
      const dependencies=Object.keys(snapshot.domains);cache.set(key,{dependencies,result:clone(result)});stats.lastDurationMs=Math.round((typeof performance!=="undefined"?performance.now():Date.now())-started);emit("decision.completed",{programId:decisionContext.program.id,decisions:decisions.length,durationMs:stats.lastDurationMs});return result;
    }
    return{VERSION,evaluate,notify:emit,invalidate,getEvents:()=>clone(events),getTrace:id=>clone(traces.get(id)||null),getStats:()=>clone({...stats,entries:cache.size}),getKnowledgeApi:(input)=>graphApi.createService(input)};
  }
  return{VERSION,createDecisionEngine};
});
