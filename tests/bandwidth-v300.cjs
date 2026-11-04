const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const storage=()=>{const data=new Map();return{get length(){return data.size},key:i=>[...data.keys()][i]||null,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
(async()=>{
const localStorage=storage(),sessionStorage=storage(),window={addEventListener(){}};
localStorage.setItem('cahaya_bw_cache_legacy','{}');localStorage.setItem('keep-user-setting','yes');
vm.runInNewContext(fs.readFileSync('js/cahaya-bandwidth.js','utf8'),{window,localStorage,sessionStorage,document:{getElementById:()=>null},Blob,Date,console});
assert.equal(localStorage.getItem('cahaya_bw_cache_legacy'),null);assert.equal(localStorage.getItem('keep-user-setting'),'yes');
const B=window.CahayaBandwidth;let calls=0,fail=false;
const db={app:{options:{databaseURL:'fixture'}},ref(path){const spec={path};const q={};for(const method of ['orderByChild','startAt','endAt','equalTo','limitToLast','orderByKey'])q[method]=v=>(spec[method]=v,q);q.once=async()=>{calls++;await new Promise(r=>setTimeout(r,5));if(fail)throw Error('offline');return{val:()=>({...spec})}};return q}};
const path='cahaya_app/a_very_long_collection_name_for_query_identity_regression';
const [a,b]=await Promise.all([B.readCompat(db,path,{orderByChild:'tanggal',start:'2026-10-01'}),B.readCompat(db,path,{orderByChild:'tanggal',start:'2026-10-01'})]);assert.equal(calls,1);assert.equal(a.val().startAt,b.val().startAt);
await B.readCompat(db,path,{orderByChild:'tanggal',start:'2026-10-01'});assert.equal(calls,1);
const nov=await B.readCompat(db,path,{orderByChild:'tanggal',start:'2026-11-01'});assert.equal(calls,2);assert.equal(nov.val().startAt,'2026-11-01');
localStorage.setItem('cahayaCurrentUser',JSON.stringify({uid:'different'}));await B.readCompat(db,path,{orderByChild:'tanggal',start:'2026-11-01'});assert.equal(calls,3);
await B.readCompat(db,path,{orderByChild:'tanggal',start:'2026-11-01',noCache:true});assert.equal(calls,4);
fail=true;await assert.rejects(B.readCompat(db,'fixture/fail'));fail=false;await B.readCompat(db,'fixture/fail');assert.equal(calls,6);
// Exercise the actual query builders with a dataset spanning six months.
const fixture={};for(let month=6;month<=11;month++)for(let day=1;day<=28;day++)fixture[`${month}-${day}`]={tanggal:`2026-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,data:'x'.repeat(1000)};
const specs=[];const nodes={date:{value:'2026-11-05'},month:{value:'2026-11'}};
const sdk={ref:(db,path)=>({path}),query:(r,...constraints)=>({...r,...Object.assign({},...constraints)}),orderByChild:v=>({field:v}),startAt:v=>({start:v}),endAt:v=>({end:v}),get:async spec=>{specs.push(spec);const value=Object.fromEntries(Object.entries(fixture).filter(([id,row])=>!spec.field||(row[spec.field]>=spec.start&&row[spec.field]<=spec.end)));return{val:()=>value,exists:()=>true}}};
for(const file of ['manajer/kontrol-pendidikan.html','manajer/kontrol-pembinaan.html','supervisor/command-center.html','supervisor/review-pembinaan.html','supervisor/review-pendidikan.html','js/kpi-weekly-page-v2.js']){
 const source=fs.readFileSync(file,'utf8');assert.equal(source,fs.readFileSync('docs/'+file,'utf8'));
 const name=file.includes('kpi-weekly')?'val':source.includes('async function fetchAll(')?'fetchAll':'all';
 const line=source.match(new RegExp('async function '+name+'\\([^\\n]+'))[0];const end=line.indexOf('async function load');const fn=end<0?line:line.slice(0,end);
 const ctx=vm.createContext({...sdk,db:{},$:(id)=>nodes[id],rows:Object.values,CW:{records:Object.values},currentWeek:{weekStart:'2026-11-02',weekEnd:'2026-11-08'},prevMonth:()=> '2026-10',console});vm.runInContext(fn,ctx);
 const target=file.includes('kontrol-pendidikan')||file.includes('review-pendidikan')?'cahaya_app/absensi_pembelajaran':'cahaya_app/absensi_program_harian';
 const result=await ctx[name](target);const spec=specs.at(-1);assert.equal(spec.field,'tanggal',file);assert(spec.start&&spec.end,file);assert(Object.keys(result).length<168,file);
 if(file.includes('kpi-weekly'))assert.equal(Object.keys(result).length,7);
 if(file.includes('kontrol-pembinaan')||file.includes('kontrol-pendidikan'))assert.equal(Object.keys(result).length,1);
 if(file.includes('review-pembinaan'))assert.equal(Object.keys(result).length,56,'previous month comparison preserved');
 console.log('PASS bounded read',file,spec.start,spec.end,Object.keys(result).length+'/168 records');
}
console.log('PASS cache deduplication, distinct periods/accounts, forced refresh and failure retry');
})().catch(e=>{console.error(e);process.exitCode=1});
