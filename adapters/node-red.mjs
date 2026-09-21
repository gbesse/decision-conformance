// Purpose: Run every conformance scenario through the native Node-RED input and output/error events.
import {createRequire} from 'node:module';import {runConformance} from '../src/index.mjs';
const require=createRequire(import.meta.url),helper=require('node-red-node-test-helper');
const register=require('node-red-contrib-jev-decisions/nodes/jev-decide.cjs');let provider;
helper.init(require.resolve('node-red'),{jevDecisionProvider:(...args)=>provider(...args)});
export async function verifyNodeRed(){
 await new Promise(resolve=>helper.startServer(resolve));
 try{return await runConformance({host:'node-red',version:require('node-red/package.json').version,adapterVersion:require('node-red-contrib-jev-decisions/package.json').version,level:'host-runtime',invoke:async(pack,state,options)=>{
  provider=options.provider;
  await helper.load(register,[{id:'decision',type:'jev-decide',pack:JSON.stringify(pack),timeoutMs:options.timeoutMs,wires:[['accepted'],['review']]},{id:'accepted',type:'helper'},{id:'review',type:'helper'}]);
  try{return await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Host adapter event timeout')),2000),done=(fn,value)=>{clearTimeout(timer);fn(value);};
   helper.getNode('accepted').once('input',msg=>done(resolve,msg.jev));helper.getNode('review').once('input',msg=>done(resolve,msg.jev));
   helper.getNode('decision').once('call:error',call=>done(reject,call.args[0] instanceof Error?call.args[0]:Error(String(call.args[0]))));
   helper.getNode('decision').receive({payload:state});
  });}finally{await helper.unload();}
 }});}finally{await new Promise(resolve=>helper.stopServer(resolve));}
}
