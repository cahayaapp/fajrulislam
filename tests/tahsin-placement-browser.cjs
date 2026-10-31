// Real page and role entry guard, isolated Firebase fixture; no production writes.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),A=require('../js/student-program-applicability.js');
const classes={'Kelas 1 Putra':['ALEXY PRATAMA HADRIAN','ALVIN HERFIANTINO','CAHYIS ISZAM','AMIN SUGIONO','FATIR AL MUQMINUN HAKIM'],'Kelas 2 Putri':['FITRAH KIRANA'],'PKBM Putra':['Peserta PKBM']};
const records={
 alexypratamahadrian:{programQuran:'Tahsin',tahsinLevel:'LEVEL_1',effectiveFrom:'2026-09-01',custom:'preserved'},
 aminsugiono:{programQuran:'Tahsin',tahsinLevel:'LEVEL_3',effectiveFrom:'2026-09-01'},
 cahyisiszam:{programQuran:'Tahfiz'},fitrahkirana:{programQuran:'Tahsin'},
 alvinherfiantino:{custom:'keep me',programQuran:'Tahsin'}
};
const manager={area:'PENDIDIKAN',unit:'PUTRA',programDomain:'KEPONDOKAN',managedRoles:['GURU_PONDOK']};
const supervisor={unit:'PUTRI',divisionIds:['PENDIDIKAN'],supervisedRoles:['GURU_PONDOK']};
const app='export const initializeApp=()=>({}),getApps=()=>[{}],getApp=()=>({});';
const database=`
export const getDatabase=()=>({}),ref=(d,p)=>p;
export const query=r=>r,orderByChild=()=>null,startAt=()=>null,endAt=()=>null,limitToLast=()=>null;
export const push=()=>{throw Error('Unexpected setoran write');},remove=push,update=push;
const value=p=>p.split('/').reduce((v,k)=>v?.[k],window.__fixture);
const snapshot=v=>({exists:()=>v!=null,val:()=>structuredClone(v??null)});
export async function get(p){window.__reads.push(p);return snapshot(value(p));}
export async function runTransaction(p,fn){
 if(window.__rejectWrites)throw Error('Fixture rejected write');
 const next=fn(structuredClone(value(p)??null));
 if(next===undefined)return {committed:false,snapshot:snapshot(value(p))};
 const parts=p.split('/'),last=parts.pop(),parent=parts.reduce((v,k)=>v[k]??=( {} ),window.__fixture);
 parent[last]=next;window.__writes.push(p);return {committed:true,snapshot:snapshot(next)};
}`;
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://x').pathname));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 async function open(role,assignment,{prefix='',width=409,deny=false,guru=false}={}){
  const context=await browser.newContext({viewport:{width,height:720},serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url.includes('/data/jadwal-pelajaran-awal-2026-2027.json'))return route.fulfill({contentType:'application/json',body:JSON.stringify(['Kelas 1 Putra'].map(kelas=>({kelas,guruKode:'FIXTURE',mapel:'Al-Quran',aktif:true,hari:1})))});
   if(url.startsWith(origin))return route.continue();
   return route.fulfill({contentType:'text/javascript',body:url.includes('firebase-app.js')?app:url.includes('firebase-database.js')?database:''});
  });
  await context.addInitScript(({role,assignment,classes,records})=>{
   const user={roleSystemVersion:2,roles:[role],defaultRole:role,assignments:{[role]:assignment},username:'fixture',nama:'Petugas Uji',teacherCode:'FIXTURE'};
   localStorage.setItem('cahayaCurrentUser',JSON.stringify(user));
   window.__fixture={cahaya_app:{master_akademik:{kelas:classes},program_quran_santri:records}};
   window.__reads=[];window.__writes=[];
  },{role,assignment,classes,records});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-09-21T05:00:00Z'));
  await page.goto(origin+'/'+prefix+(guru?'guru/inputSetoranTahfiz.html':'pendidikan/penempatan-tahsin.html'));
  if(guru)await page.waitForFunction(()=>window.getAutoQuranClasses?.().length===1);
  else await page.locator(deny?'#roleAccessDenied':'#search:not([disabled])').waitFor();
  return {page,context,errors};
 }
 async function confirmLevel(page,level,date='2026-09-21'){
  await page.selectOption('#placementSelect',level);await page.fill('#effectiveDate',date);await page.click('#save');
  await page.locator('#confirmDialog[open]').waitFor();
  assert(await page.locator('#confirmText').textContent());
  await page.click('#confirmSave');await page.waitForFunction(()=>!document.getElementById('search').disabled);
 }
 try{
  const {page,context,errors}=await open('MANAJER',manager);
  assert.deepEqual(await page.locator('.student b').allTextContents(),['ALEXY PRATAMA HADRIAN','ALVIN HERFIANTINO','AMIN SUGIONO','FATIR AL MUQMINUN HAKIM']);
  assert.equal(await page.locator('#classSelect').inputValue(),'');
  assert.equal(await page.locator('.student').filter({hasText:'Belum Ditentukan'}).count(),2);
  assert.equal(await page.locator('#summary').innerText(),'Santri Tahsin: 4\nBelum Ditentukan: 2\nLevel 1: 1\nLevel 2: 0\nLevel 3: 1');
  const guruNames=await page.evaluate(()=>CahayaQuranMenuRoster.rows(__fixture.cahaya_app.master_akademik.kelas,['Kelas 1 Putra'],'Tahsin',__fixture.cahaya_app.program_quran_santri).map(x=>x.nama));
  assert.deepEqual(await page.locator('.student b').allTextContents(),guruNames);
  assert.deepEqual(await page.evaluate(()=>__reads),['cahaya_app/program_quran_santri','cahaya_app/master_akademik/kelas']);
  // Filters alone do not fetch data. Bulk selection applies only to visible rows.
  await page.selectOption('#levelFilter','UNSET');await page.fill('#search','ALVIN HERFIANTINO');await page.click('#selectAll');
  await page.fill('#search','');
  assert.equal(await page.locator('.student input:checked').count(),1);
  await page.locator('[data-key="fatiralmuqminunhakim"] input').check();
  await page.selectOption('#placementSelect','LEVEL_2');await page.fill('#effectiveDate','2026-09-21');await page.click('#save');
  assert.match(await page.locator('#confirmText').textContent(),/2 santri.*Level 2 • Tahsin Teori.*21 September 2026/);
  await page.click('#cancelSave');assert.deepEqual(await page.evaluate(()=>__writes),[]);
  await confirmLevel(page,'LEVEL_2');
  assert.match(await page.locator('#status').textContent(),/2 santri berhasil ditempatkan ke Level 2 • Tahsin Teori/);
  await page.selectOption('#levelFilter','');
  assert.equal(await page.locator('.student input:checked').count(),0);
  assert.equal(await page.locator('[data-key="alvinherfiantino"] small').textContent(),'Kelas 1 Putra • Level 2 • Tahsin Teori');
  let saved=await page.evaluate(()=>__fixture.cahaya_app.program_quran_santri);
  assert.deepEqual(saved.alexypratamahadrian,records.alexypratamahadrian);assert.deepEqual(saved.aminsugiono,records.aminsugiono);
  assert.equal(saved.alvinherfiantino.custom,'keep me');assert.equal(saved.fatiralmuqminunhakim.tahsinLevel,'LEVEL_2');
  assert.deepEqual(await page.evaluate(()=>__fixture.cahaya_app.master_akademik.kelas),classes);
  assert.deepEqual(['ALEXY PRATAMA HADRIAN','ALVIN HERFIANTINO','AMIN SUGIONO','FATIR AL MUQMINUN HAKIM'].filter(n=>A.applicable(n,'Tahsin Praktek','2026-09-21',saved).applicable),['ALEXY PRATAMA HADRIAN','AMIN SUGIONO']);
  assert.deepEqual(['ALEXY PRATAMA HADRIAN','ALVIN HERFIANTINO','AMIN SUGIONO','FATIR AL MUQMINUN HAKIM'].filter(n=>A.applicable(n,'Tahsin Teori','2026-09-21',saved).applicable),['ALVIN HERFIANTINO','FATIR AL MUQMINUN HAKIM']);
  assert((await page.evaluate(()=>__writes)).every(p=>p.startsWith('cahaya_app/program_quran_santri/')));
  // Same-date correction preserves the earlier placement. Repeating it is idempotent.
  await page.locator('[data-key="alvinherfiantino"] input').check();await confirmLevel(page,'LEVEL_3');
  await page.locator('[data-key="alvinherfiantino"] input').check();await confirmLevel(page,'LEVEL_3');
  saved=await page.evaluate(()=>__fixture.cahaya_app.program_quran_santri);
  assert.deepEqual(saved.alvinherfiantino.history.filter(x=>x.effectiveFrom==='2026-09-21').map(x=>x.tahsinLevel),['LEVEL_2','LEVEL_3']);
  // A future promotion preserves the effective September level and appears immediately as scheduled.
  await page.locator('[data-key="alexypratamahadrian"] input').check();await confirmLevel(page,'LEVEL_2','2026-10-01');
  saved=await page.evaluate(()=>__fixture.cahaya_app.program_quran_santri);
  assert.equal(A.assignmentFor('ALEXY PRATAMA HADRIAN','2026-09-21',saved).level,'LEVEL_1');
  assert.equal(A.assignmentFor('ALEXY PRATAMA HADRIAN','2026-10-01',saved).level,'LEVEL_2');
  assert.match(await page.locator('[data-key="alexypratamahadrian"]').innerText(),/Terjadwal: Level 2/);
  // Rejected writes leave selection and data intact, never reporting success.
  await page.evaluate(()=>__rejectWrites=true);await page.locator('[data-key="fatiralmuqminunhakim"] input').check();
  await confirmLevel(page,'LEVEL_1');assert.match(await page.locator('#status').textContent(),/1 gagal/);
  assert(await page.locator('[data-key="fatiralmuqminunhakim"] input').isChecked());
  assert.equal(await page.evaluate(()=>__fixture.cahaya_app.program_quran_santri.fatiralmuqminunhakim.tahsinLevel),'LEVEL_2');
  for(const width of [409,456]){
   await page.setViewportSize({width,height:720});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.click('#save');
   assert(await page.locator('#confirmDialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
   await page.click('#cancelSave');
  }
  await page.setViewportSize({width:409,height:720});await page.screenshot({path:'/tmp/tahsin-placement-409.png',fullPage:true});
  assert.deepEqual(errors,[]);await context.close();
  const guru=await open('GURU_PONDOK',{programDomain:'KEPONDOKAN'},{guru:true});
  await guru.page.evaluate(()=>selectQuranProgram('Tahsin'));
  assert.deepEqual(await guru.page.locator('#santriCardsContainer .santri-card').evaluateAll(nodes=>nodes.map(node=>node.dataset.nama)),guruNames);
  assert.deepEqual(guru.errors,[]);assert.deepEqual(await guru.page.evaluate(()=>__writes),[]);
  await guru.context.close();
  for(const [role,assignment,names,prefix] of [
   ['MANAJER',{...manager,unit:'PUTRI'},['FITRAH KIRANA'],''],
   ['SUPERVISOR',supervisor,['FITRAH KIRANA'],'docs/'],
   ['SUPERVISOR',{...supervisor,unit:'ALL'},['ALEXY PRATAMA HADRIAN','ALVIN HERFIANTINO','AMIN SUGIONO','FATIR AL MUQMINUN HAKIM','FITRAH KIRANA'],'']
  ]){
   const run=await open(role,assignment,{prefix});
   assert.deepEqual(await run.page.locator('.student b').allTextContents(),names);
   if(role==='SUPERVISOR'&&assignment.unit==='PUTRI'){
    await run.page.locator('[data-key="fitrahkirana"] input').check();await confirmLevel(run.page,'LEVEL_3');
    assert.equal(await run.page.evaluate(()=>__fixture.cahaya_app.program_quran_santri.fitrahkirana.tahsinLevel),'LEVEL_3');
   }
   assert.deepEqual(run.errors,[]);await run.context.close();
  }
  for(const [role,assignment] of [
   ['GURU_PONDOK',{programDomain:'KEPONDOKAN'}],
   ['SUPERVISOR',{unit:'PUTRA',supervisedRoles:['DAPUR']}],
   ['SUPERVISOR',{...supervisor,divisionIds:['DAPUR']}],
   ['MANAJER',{...manager,area:'PEMBINAAN_KARAKTER'}]
  ]){
   const run=await open(role,assignment,{deny:true});
   assert.deepEqual(await run.page.evaluate(()=>__reads),[]);assert.deepEqual(await run.page.evaluate(()=>__writes),[]);
   await run.context.close();
  }
  console.log('Tahsin placement browser: roster, unit/role guards, filters, confirmation, scoped saves, history, score applicability, rejection and 409/456px: PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
