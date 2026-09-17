// Offline, deterministic lifecycle tests; no SDK/network/production writes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:''});return elements.get(id)};
const pending=[],marks=[],paints=[];
let reads=0,active=true;
const storage=new Map([['cahaya_guru_schedule_v148',JSON.stringify({t:Date.now(),v:[{hari:4,mapel:'Test'}]})]]);
const K={jakartaNow:()=>({date:'2026-09-17',minutes:500}),collect:()=>[],records:v=>Object.values(v||{}),identityFromProfile:()=>({}),assignedSchedule:()=>[],norm:v=>String(v||'').toLowerCase(),key:v=>String(v||''),onlyKepondokan:v=>v};
const w={CAHAYA_CONFIG:{firebase:{}},CahayaGuruKPI:K,CahayaGuruHub:{profile:()=>({username:'test'}),isActive:()=>active}};w.parent=w;
const context={window:w,document:{getElementById:el},sessionStorage:{getItem:k=>storage.get(k)},localStorage:{getItem:()=>null},console,Date,Intl,Map,Promise,ref:(_db,path)=>path,query:(...args)=>args,orderByChild:x=>x,startAt:x=>x,endAt:x=>x,equalTo:x=>x,limitToLast:x=>x,
get:()=>{reads++;return new Promise((resolve,reject)=>pending.push({resolve:v=>resolve({val:()=>v}),reject}))},
ensureFirebase:async()=>{},paints};
let source=fs.readFileSync('js/guru-home-actions.js','utf8');
source='const db={};\n'+source.slice(source.indexOf('const P=')).replace('export async function openPanel','async function openPanel');
vm.createContext(context);vm.runInContext(source+'\nrenderScheduleSheet=()=>paints.push("schedule");renderLeaveSheet=()=>paints.push("leave");',context);
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
(async()=>{
  const first=context.openPanel('schedule',()=>active,s=>marks.push(s));await flush();
  assert(marks.includes('local'));assert.equal(reads,2);assert(!marks.includes('complete'));
  const again=context.openPanel('schedule',()=>active);await flush();assert.equal(reads,2,'in-flight dedupe');
  pending.splice(0).forEach(x=>x.resolve({}));await Promise.all([first,again]);
  await context.openPanel('schedule',()=>active);assert.equal(reads,2,'fresh cache avoids reads');
  const leave=context.openPanel('leave',()=>active);await flush();assert.equal(reads,4);
  pending.shift().resolve({});await flush();
  assert(el('teacherSheetSub').textContent.includes('Memperbarui'));
  pending.shift().reject(Error('simulated offline'));await leave;
  assert(el('teacherSheetSub').textContent.includes('gagal'),'error is not empty success');
  const retry=context.openPanel('leave',()=>active);await flush();assert.equal(reads,5,'retry only failed source');
  const before=paints.length;active=false;pending.shift().resolve({});await retry;
  assert.equal(paints.length,before,'hidden panel is not repainted');
  active=true;await context.openPanel('leave',()=>active);assert.equal(reads,5,'reconnect cache reuse');
  console.log('PASS local-first, in-flight dedupe, TTL cache, partial/error, hidden guard, retry/reconnect');
})().catch(e=>{console.error(e);process.exitCode=1});
