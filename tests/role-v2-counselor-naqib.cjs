// Isolated fixtures: every external request is intercepted; no production writes.
// TEST SERVER ONLY enables pending Counselor/assessment consumers to test staged
// adapters. Production registry remains denied; entry-guards suite verifies that.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+'/'))return res.writeHead(403).end();try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');let body=fs.readFileSync(f,'utf8');if(f.endsWith('/js/role-route-registry-v2.js'))body=body.replaceAll('counselor-queue-pending','counselor-queue').replaceAll('naqib-assessment-pending','naqib-assessment');res.end(body)}catch{res.writeHead(404).end()}});
const sdk=`export const getDatabase=()=>({}),ref=(db,p='')=>({p}),query=(r,...q)=>({...r,q}),orderByChild=field=>({field}),equalTo=value=>({value}),startAt=value=>({start:value}),endAt=value=>({end:value}),limitToLast=value=>({limit:value});
export async function get(r){window.reads.push(r);let data=null;
if(r.p.startsWith('cahaya_app/master_usrah/'))data=[r.p.endsWith('Usrah 7')?'PUTRI CHILD':r.p.endsWith('Usrah 1')?'PUTRA CHILD':'MEMBER '+r.p.split('/').pop()];
if(r.p==='cahaya_app/log_lapor_inisiatif'){const tanggal=new Date().toISOString().slice(0,10);data={boy:{tipe:'Lapor Pelanggaran',dilaporkan:'PUTRA CHILD',tanggal,bidangPelanggaran:'Kedisiplinan',keterangan:'Terlambat'},girl:{tipe:'Lapor Pelanggaran',dilaporkan:'PUTRI CHILD',tanggal,bidangPelanggaran:'Moral/Etika',keterangan:'Moral'}};}
return {val:()=>data,exists:()=>data!==null}}
let n=0;export function push(r,v){const key='mock'+(++n);if(v)window.writes.push({path:r.p,value:v});return {key,p:r.p+'/'+key}}
export async function update(r,v){window.writes.push({path:r.p,value:v})}export async function set(r,v){window.writes.push({path:r.p,value:v})}`;
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{for(const [role,unit,level] of [['NAQIB','PUTRA'],['NAQIBAH','PUTRI'],['KONSELOR','PUTRA','PEMULA'],['KONSELOR','PUTRI','MUDA']]){
const c=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});
await c.route('**/*',r=>{const u=r.request().url();if(u.startsWith(origin))return r.continue();return r.fulfill({contentType:'text/javascript',body:u.endsWith('/firebase-app.js')?'export const initializeApp=()=>({});':u.endsWith('/firebase-database.js')?sdk:u.endsWith('/firebase-firestore.js')?`export const getFirestore=()=>({}),collection=(db,p)=>({p}),query=(r,...q)=>({...r,q}),where=(field,op,value)=>({field,op,value});export async function getDocs(r){window.reads.push({firestore:r});return {forEach:fn=>['PUTRA CHILD','PUTRI CHILD'].forEach(n=>fn({id:n,data:()=>({nama:n,workspaceRoles:['asisten-naqib']})}))}}`:''})});
await c.addInitScript(p=>{localStorage.setItem('cahayaCurrentUser',JSON.stringify(p));window.reads=[];window.writes=[]},{username:'fixture',nama:'Fixture',roleSystemVersion:2,roles:[role],defaultRole:role,assignments:{[role]:{unit,level}}});
const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
const own=unit==='PUTRA'?'PUTRA CHILD':'PUTRI CHILD',other=unit==='PUTRA'?'PUTRI CHILD':'PUTRA CHILD';
if(role==='KONSELOR'){
await p.goto(origin+'/konselor/daftar-kasus-baru.html?mode=naqib&level=utama');
await p.waitForFunction(()=>typeof renderQueue==='function'&&document.getElementById('sumTotal').textContent.trim()==='1');
assert(!(await p.locator('body').innerText()).includes(other));
assert.equal(await p.evaluate(()=>document.body.classList.contains('naqib-case-mode')),false);
assert((await p.evaluate(()=>reads)).every(r=>!['cahaya_app/data_santri','cahaya_app/master_usrah'].includes(r.p)));
await p.evaluate(()=>deleteCase('REPORT-boy'));assert.deepEqual(await p.evaluate(()=>writes),[]);
assert.equal(await p.evaluate(()=>cahayaRoleContext.assignment.level),level);
await p.evaluate(id=>{startSingleAction(id);document.getElementById('fPelaksana').value='Fixture counselor';document.getElementById('fUraian').value='Fixture verification';document.getElementById('fPembinaan').value='Fixture coaching';document.getElementById('fPoinMinus').value='5'},unit==='PUTRA'?'REPORT-boy':'REPORT-girl');
await p.evaluate(()=>saveActionReport());const actions=await p.evaluate(()=>writes);assert.equal(actions.length,1);const actionRecord=Object.entries(actions[0].value).find(([k])=>k.startsWith('cahaya_app/laporan_penindakan/'))[1];assert.equal(actionRecord.jalurPenindakan,'KONSELOR');const point=Object.entries(actions[0].value).find(([k])=>k.startsWith('cahaya_app/poin_manual/'))[1];assert.equal(point.poin,-5);assert.equal(point.namaSantri,own);
}else{
await p.goto(origin+'/naqib/gamifikasi.html?unit='+ (unit==='PUTRA'?'PUTRI':'PUTRA'));
await p.waitForFunction(()=>document.querySelectorAll('#studentList input').length>0);
assert((await p.locator('#studentList').innerText()).includes(own));assert(!(await p.locator('#studentList').innerText()).includes(other));
assert((await p.evaluate(()=>reads)).every(r=>r.p.startsWith('cahaya_app/master_usrah/')));
assert(await p.evaluate(name=>{try{toggleStudent({value:name,checked:true});return false}catch{return true}},other));
await p.evaluate(name=>{toggleStudent({value:name,checked:true});applyPointGuide(document.querySelector('input[data-points="5"]'));document.getElementById('description').value='Fixture initiative'},own);
await p.evaluate(()=>saveInitiative());
const writes=await p.evaluate(()=>writes);assert.equal(writes.length,1);const value=Object.values(writes[0].value)[0];assert.equal(value.namaSantri,own);assert.equal(value.poin,5);assert.equal(value.tipe,'Inisiatif Kebaikan');
assert.deepEqual(await p.locator('input[data-category="Inisiatif Kebaikan"]').evaluateAll(xs=>xs.map(x=>Number(x.dataset.points))),[5,10,15,20,25]);
await p.evaluate(name=>{toggleStudent({value:name,checked:true});applyPointGuide(document.querySelector('input[data-category="Ibadah Sunnah"]'));document.getElementById('description').value='Fixture worship'},own);
await p.evaluate(()=>saveInitiative());
const capQueries=(await p.evaluate(()=>reads)).filter(r=>r.p==='cahaya_app/log_lapor_inisiatif');assert.equal(capQueries.length,2);assert.deepEqual(capQueries.map(r=>r.q[0].field),['pelapor','namaSantri']);assert(capQueries.every(r=>r.q[1].value===own));
await p.goto(origin+'/guru/lapor-pelanggaran.html');await p.waitForFunction(()=>document.querySelectorAll('#lp_namaPelapor option').length>2);
const options=await p.locator('#lp_namaPelapor').innerText();assert(options.includes(own));assert(!options.includes(other));
assert((await p.evaluate(()=>reads)).every(r=>r.p.startsWith('cahaya_app/master_usrah/')));
await p.evaluate(name=>{
 const cb=[...document.querySelectorAll('input[type="checkbox"]')].find(e=>e.value===name);cb.checked=true;cb.dispatchEvent(new Event('change'));
 const source=document.getElementById('lp_namaPelapor');source.value=[...source.options].find(o=>o.value.startsWith('Laporan Langsung')).value;
 document.querySelector('input[name="bidangPelanggaran"]').checked=true;document.getElementById('lp_keterangan').value='Fixture report';
},own);
await p.evaluate(()=>kirimLaporan());const reportWrites=await p.evaluate(()=>writes);assert.equal(reportWrites.length,1);const report=Object.entries(reportWrites[0].value).find(([k])=>k.startsWith('cahaya_app/log_lapor_inisiatif/'))[1];assert.equal(report.statusPenanganan,'Menunggu Konselor');assert.equal(report.tipe,'Lapor Pelanggaran');assert(!Object.keys(reportWrites[0].value).some(k=>k.includes('poin_manual')));assert.equal(report.poin,undefined);
await p.goto(origin+'/pusat-asesmen/santri.html');await p.waitForFunction(()=>document.querySelectorAll('#pilihUsrah option').length>1);
const ownKey=unit==='PUTRA'?'Usrah 1':'Usrah 7',otherKey=unit==='PUTRA'?'Usrah 7':'Usrah 1';
await p.evaluate(key=>{selectAssessmentMonth(1);selectAssessmentUsrah(key)},ownKey);
assert((await p.locator('#asStudentGrid').innerText()).includes(own));assert(!(await p.locator('#asStudentGrid').innerText()).includes(other));
assert(await p.evaluate(key=>{try{selectAssessmentUsrah(key);return false}catch{return true}},otherKey));
assert(await p.evaluate(name=>{try{selectAssessmentStudent(name);return false}catch{return true}},other));
const assessReads=await p.evaluate(()=>reads);assert(assessReads.filter(r=>r.p).every(r=>r.p.startsWith('cahaya_app/master_usrah/')));assert.equal(assessReads.find(r=>r.firestore).firestore.q[0].field,'workspaceRoles');
await p.goto(origin+'/naqib/jurnal-piket.html');await p.waitForFunction(()=>document.getElementById('jpUnit').disabled);
assert.equal(await p.locator('#jpUnit').inputValue(),unit==='PUTRA'?'Putra':'Putri');
assert.deepEqual((await p.evaluate(()=>reads)).map(r=>r.p),['cahaya_app/jadwal_piket_naqib/'+unit.toLowerCase()]);
await p.goto(origin+'/konselor/daftar-kasus-baru.html?mode=naqib');await p.locator('#roleAccessDenied').waitFor();assert.deepEqual(await p.evaluate(()=>reads),[]);
}
assert.deepEqual(errors,[],role);await c.close();console.log('PASS actual fixture '+role+' '+unit+' '+(level||''));
}}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
