// Purpose: Test finite DecisionPack semantics against a host adapter and emit an independently inspectable compatibility report.
import {fingerprint} from '@gbesse/decisionpacks';
export const pack={schemaVersion:1,name:'conformance/binary',version:'1.0.0',description:'Conformance fixture; synthetic provider only.',model:'jev-1.13.0',inputs:{text:'string'},questions:{route:{type:'choice',instructions:'Classify text into a finite outcome.',criteria:{yes:'Matches the condition',no:'Does not match'}}},rules:[{id:'yes',outcome:'accepted',all:[{field:'answers.route.choice',op:'eq',value:'yes'},{field:'answers.route.probabilities.yes',op:'gte',value:0.9}]}],fallback:'review'};
const fixture=(p=.95,confidence=.1)=>({model:pack.model,answers:{route:{type:'choice',choice:p>=.5?'yes':'no',confidence,probabilities:{yes:p,no:1-p}}}});
const base={text:'synthetic fixture'};
function check(ok,message){if(!ok)throw Error(message);}
async function bounded(work,ms){let timer;try{return await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Harness deadline exceeded')),ms);})]);}finally{clearTimeout(timer);}}
export async function runConformance({invoke,host,version,adapterVersion,level='library',scenariosTimeoutMs=5000}){
 check(typeof invoke==='function'&&host&&version&&adapterVersion,'Explicit adapter and exact versions required');
 check(['library','host-runtime'].includes(level),'Invalid verification level');check(Number.isInteger(scenariosTimeoutMs)&&scenariosTimeoutMs>=100&&scenariosTimeoutMs<=30000,'Invalid harness deadline');
 const definitions=[
  {id:'probability-not-confidence',response:fixture(.95,.01),outcome:'accepted'},
  {id:'confidence-cannot-bypass-threshold',response:fixture(.89,.99),outcome:'review'},
  {id:'inclusive-threshold-boundary',response:fixture(.9,.1),outcome:'accepted'},
  {id:'valid-negative-review',response:fixture(.1,.9),outcome:'review'},
  {id:'invalid-state-no-inference',state:{text:42},response:fixture(),reject:true,noCall:true},
  {id:'missing-question-answer',response:{model:pack.model,answers:{}},reject:true},
  {id:'invalid-probability-mass',response:{model:pack.model,answers:{route:{type:'choice',choice:'yes',confidence:.9,probabilities:{yes:.9,no:.9}}}},reject:true},
  {id:'wrong-model-rejected',response:{...fixture(),model:'another-model'},reject:true},
  {id:'provider-error-not-fallback',error:Error('Synthetic provider failure'),reject:true},
  {id:'nonresponsive-provider-deadline',hang:true,reject:true},
  {id:'changed-policy-version-provenance',policy:{...pack,version:'1.0.1',rules:[]},response:fixture(),outcome:'review'},
 ];
 const results=[];
 for(const scenario of definitions){let calls=0;const policy=structuredClone(scenario.policy??pack),state=structuredClone(scenario.state??base),start=performance.now();
  try{
   let record,error;
   try{record=await bounded(()=>invoke(policy,state,{timeoutMs:30,provider:async()=>{calls++;if(scenario.hang)return new Promise(()=>{});if(scenario.error)throw scenario.error;return structuredClone(scenario.response);}}),scenariosTimeoutMs);}catch(e){error=e;}
   // A hung host is a failure, even for cases that are supposed to reject promptly.
   check(!error?.message?.includes('Harness deadline exceeded')&&!error?.message?.includes('Host adapter event timeout'),'Host ignored its provider deadline');
   if(scenario.reject){check(error,'Expected host error, not a fallback result');if(scenario.noCall)check(calls===0,'Invalid input reached the provider');}
   else{check(!error,error?.message);check(record.outcome===scenario.outcome,'Outcome mismatch');check(record.pack?.fingerprint===fingerprint(policy)&&record.pack.version===policy.version,'Policy identity lost');check(record.inputFingerprint===fingerprint(state),'Input identity lost');check(record.model===policy.model,'Model identity lost');check(calls===1,'Unexpected provider call count');}
   results.push({id:scenario.id,passed:true,providerCalls:calls,durationMs:Math.round(performance.now()-start)});
  }catch(e){results.push({id:scenario.id,passed:false,providerCalls:calls,error:e.message});}
 }
 return {schemaVersion:1,suite:'decision-conformance',suiteVersion:'0.1.0',at:new Date().toISOString(),host,version,adapterVersion,level,synthetic:true,model:pack.model,passed:results.every(r=>r.passed),scenarios:results,limitations:['No live Jev quality, availability or billing measurements','No certification by TypeSafe or the host vendor','Compatibility applies only to the versions and scenarios reported']};
}
