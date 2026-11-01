const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/guru-home-actions.js','utf8');
const code=source.slice(source.indexOf('let schedulePromise;'),source.indexOf('const sourceCache='));
async function scenario({online=[],offline=false,cached=null}={}){
 let liveReads=0,fallbackReads=0;const writes=[];
 const context={cacheRead:()=>cached,P:{},ensureFirebase:async()=>{},ref:()=>'',db:{},K:{records:v=>Object.values(v||{})},get:async()=>{liveReads++;if(offline)throw Error('offline');return{val:()=>online}},cacheWrite:(...args)=>writes.push(args),fetch:async()=>{fallbackReads++;return{ok:true,json:async()=>[{guruKode:'OLD'}]}},console:{warn(){}}};
 vm.createContext(context);vm.runInContext(code,context);const [a,b]=await Promise.all([context.fastSchedule(),context.fastSchedule()]);assert.deepEqual(a,b);return{a,liveReads,fallbackReads,writes};
}
(async()=>{
 let r=await scenario({online:[{guruKode:'ZAWAWI'}]});assert.equal(r.a[0].guruKode,'ZAWAWI');assert.equal(r.liveReads,1);assert.equal(r.fallbackReads,0);
 r=await scenario({online:[]});assert.equal(r.a.length,0);assert.equal(r.fallbackReads,0,'Empty live schedule must not revive fallback assignments');
 r=await scenario({offline:true});assert.equal(r.fallbackReads,1);assert.equal(r.writes.length,0,'Offline fallback must not masquerade as cached live data');
 r=await scenario({cached:[{guruKode:'ZAWAWI'}]});assert.equal(r.liveReads,0);
 console.log('PASS online precedence, in-flight deduplication, authoritative empty data, offline fallback and fresh cache');
})().catch(error=>{console.error(error);process.exitCode=1});
