import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Exercise the actual API branch against the deployed rule's bounded-list contract.
const source=readFileSync(new URL('../psb/api.js',import.meta.url),'utf8').replace(/^import.*\n/gm,'').replace(/export /g,'');
const reads=[];
const deps={normalizePhone:v=>v,window:{CAHAYA_CONFIG:{firebase:{}}},getApps:()=>[{}],getApp:()=>({}),getAuth:()=>({currentUser:{uid:'staff'}}),getFirestore:()=>({}),doc:(_db,path,id)=>({path,id}),collection:(_db,path)=>({path}),orderBy:(field,direction)=>({field,direction}),limit:value=>({limit:value}),query:(collection,...constraints)=>({...collection,constraints}),getDocs:async q=>{reads.push(q);if(q.path==='psb_applications'){assert(q.constraints?.some(c=>c.limit===300),'application queries must respect the rule limit');return{docs:[{id:'one',data:()=>({profile:{studentName:'Example'}})}]}}return{docs:[{id:'one',data:()=>({interview:{decision:'CADANGAN'}})},{id:'orphan',data:()=>({interview:{decision:'DITERIMA'}})}]}}};
const call=new Function(...Object.keys(deps),source+';return call;')(...Object.values(deps));
const result=await call('interviews');
assert.equal(result.applications.length,1);
assert.equal(result.applications[0].uid,'one');
assert.equal(result.applications[0].interview.decision,'CADANGAN');
assert.equal(reads.length,2);
console.log('PASS: interview results use bounded application query and join matching reviews only');
