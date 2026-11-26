const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/mentor-usrah-v2.js','utf8');
const fn=source.slice(source.indexOf('async function deleteAssessment('),source.indexOf('async function selectStudent('));
async function scenario(options={}){
 const base={status:'DRAFT',usrah:'Usrah 7',namaSantri:'Santri A',tanggal:'2026-11-23',selfAssessment:{answers:{sp1:3}}};
 const store={target:options.current===undefined?base:options.current,other:{...base,namaSantri:'Santri B'}};
 const nodes={};let writes=0,confirmed='',refPath='',cleared=0,reloaded=0;const messages=[];
 const sandbox={busy:false,loadingStudent:false,view:options.view||'followup',session:{activeRole:options.role||'MENTOR_USRAH'},selectedUsrah:()=> 'Usrah 7',requireScope:()=>{if(options.outside)throw Error('OUTSIDE');},ctx:{assertCurrent(){}},window:{confirm:text=>{confirmed=text;return options.confirm!==false}},$:id=>nodes[id]||=( {} ),document:{querySelectorAll:()=>[]},identity:{id:'mentor-id',name:'Mentor'},db:{},ref:(db,path)=>(refPath=path),selfPath:()=> 'drafts/usrah7',runTransaction:async(path,change)=>{if(options.failed)throw Error('offline');const next=change(store.target);if(next){store.target=next;writes++}return{committed:!!next}},activeDraft:{id:'target'},clearSavedDraft:()=>cleared++,clearForm:()=>{},draftStore:{removeItem(){}},draftKey:()=>'',loadQueue:async()=>reloaded++,toast:m=>messages.push(m),console:{error(){}},Date};
 vm.runInNewContext(fn+';globalThis.remove=deleteAssessment',sandbox);await sandbox.remove('target','Santri A','2026-11-23');return{...sandbox,store,writes,confirmed,refPath,cleared,reloaded,messages};
}
(async()=>{
 let r=await scenario();assert.equal(r.writes,1);assert.equal(r.refPath,'drafts/usrah7/target');assert.equal(r.store.target.status,'DELETED');assert.equal(r.store.target.deletedBy,'mentor-id');assert.equal(r.store.other.status,'DRAFT');assert.equal(r.store.target.selfAssessment.answers.sp1,3);assert(r.confirmed.includes('Santri A')&&r.confirmed.includes('2026-11-23'));assert.equal(r.cleared,1);assert.equal(r.reloaded,1);
 for(const opts of [{confirm:false},{outside:true},{role:'WALI'},{view:'form'},{failed:true},{current:null},{current:{status:'FINAL'}},{current:{status:'DRAFT',usrah:'Usrah 8',namaSantri:'Santri A',tanggal:'2026-11-23'}},{current:{status:'DRAFT',usrah:'Usrah 7',namaSantri:'Santri B',tanggal:'2026-11-23'}}]){r=await scenario(opts);assert.equal(r.writes,0,JSON.stringify(opts));assert.equal(r.store.other.status,'DRAFT');assert.equal(r.busy,false)}
 for(const file of ['js/mentor-usrah-v2.js','css/mentor-usrah-v2.css','pembinaan/mentor-usrah-v2.html'])assert.equal(fs.readFileSync(file,'utf8'),fs.readFileSync('docs/'+file,'utf8'));
 assert(source.includes('data-delete-draft="${esc(id)}"'));
 console.log('Per-assessment deletion: isolation, cancellation, role/scope, final-state guard, audit, failures and mirrors PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
