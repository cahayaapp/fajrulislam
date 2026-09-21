// Browser integration against isolated RTDB fixtures. Never contacts production.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),A=require('../js/student-program-applicability.js'),Q=require('../js/quran-menu-roster.js');
const root=path.resolve(__dirname,'..'),sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'config/master-data.js'),'utf8'),sandbox);
const classes=JSON.parse(JSON.stringify(sandbox.window.CAHAYA_MASTER_DATA.santriByClass));
const scoped=Object.keys(classes).filter(A.isExplicitClass);
const names=['ALIF SAMUDRA','EZA FEBRI AL FADZRI','MUHAMMAD ABIL IRWANSYAH','MUHAMMAD IZAM SAPUTRA'];
const assignments=Object.fromEntries(names.slice(0,3).map((name,i)=>[A.key(name),{programQuran:'Tahsin',tahsinLevel:'LEVEL_'+(i+1),effectiveFrom:'2026-09-01'}]));
assignments[A.key(names[0])]={programQuran:'Tahsin',tahsinLevel:'LEVEL_2',effectiveFrom:'2026-10-01',history:[{programQuran:'Tahsin',tahsinLevel:'LEVEL_1',effectiveFrom:'2026-09-01'}]};
// Deliberately stale program classifications must lose to the current roster.
assignments[A.key(names[3])]={programQuran:'Tahfiz',effectiveFrom:'2026-09-01'};
assignments.cahyisiszam={programQuran:'Tahsin',tahsinLevel:'LEVEL_1',effectiveFrom:'2026-09-01'};
classes['Quran Gabungan']=['ALIF SAMUDRA','ADITYA PUTRA IBRAHIM','FITRAH KIRANA'];
const app='export const initializeApp=()=>({}),getApps=()=>[{}],getApp=()=>({});';
const database=`
export const getDatabase=()=>({}),ref=(d,p='')=>p;
export const query=r=>r,orderByChild=()=>null,startAt=()=>null,endAt=()=>null,equalTo=()=>null,limitToLast=()=>null;
const value=p=>p.split('/').filter(Boolean).reduce((v,k)=>v?.[k],window.__fixture);
export async function get(p){window.__reads.push(p);const v=value(p);return {exists:()=>v!=null,val:()=>structuredClone(v??null)};}
export const push=()=>({key:'fixture-'+(++window.__id)});
function write(p,v){const parts=p.split('/').filter(Boolean),last=parts.pop(),parent=parts.reduce((v,k)=>v[k]??={},window.__fixture);parent[last]=structuredClone(v);}
export async function update(p,values){window.__writes.push(structuredClone(values));for(const [k,v] of Object.entries(values))write([p,k].filter(Boolean).join('/'),v);}
export const set=(p,v)=>write(p,v),remove=p=>write(p,null);
`;
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://x').pathname));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 async function open(file,width=409){
  const context=await browser.newContext({viewport:{width,height:720},timezoneId:'Asia/Jakarta',serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url.includes('/data/jadwal-pelajaran-awal-2026-2027.json'))return route.fulfill({contentType:'application/json',body:JSON.stringify((file.includes('inputNilai')?[...scoped,'Quran Gabungan']:scoped).map(kelas=>({kelas,guruKode:'FIXTURE',mapel:'Al-Quran',aktif:true,hari:1})))});
   if(url.startsWith(origin))return route.continue();
   return route.fulfill({contentType:'text/javascript',body:url.includes('firebase-app.js')?app:url.includes('firebase-database.js')?database:''});
  });
  await context.addInitScript(({classes,assignments})=>{
   localStorage.setItem('cahayaCurrentUser',JSON.stringify({roleSystemVersion:2,roles:['GURU_PONDOK'],defaultRole:'GURU_PONDOK',assignments:{GURU_PONDOK:{programDomain:'KEPONDOKAN'}},username:'fixture',nama:'Petugas Uji',teacherCode:'FIXTURE'}));
   window.__fixture={cahaya_app:{master_akademik:{kelas:classes},program_quran_santri:assignments}};
   window.__reads=[];window.__writes=[];window.__id=0;
  },{classes,assignments});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-09-21T05:00:00Z'));await page.goto(origin+'/'+file);
  return {page,context,errors};
 }
 try{
  const guru=await open('guru/inputSetoranTahfiz.html');
  await guru.page.waitForFunction(()=>window.getAutoQuranClasses?.().length===4);
  for(const program of ['Tahsin','Tahfiz']){
   await guru.page.evaluate(p=>selectQuranProgram(p),program);
   const rows=await guru.page.locator('.santri-card').evaluateAll(nodes=>nodes.map(n=>({nama:n.dataset.nama,kelas:n.dataset.kelas})));
   const expected=Q.rows(classes,scoped,program,assignments).map(({nama,kelas})=>({nama,kelas}));
   assert.deepEqual(rows,expected);assert.equal(rows.length,program==='Tahsin'?33:32);
  }
  assert.deepEqual(guru.errors,[]);assert.deepEqual(await guru.page.evaluate(()=>__writes),[]);await guru.context.close();
  const {page,context,errors}=await open('guru/inputNilaiUjian.html');
  await page.waitForFunction(()=>document.querySelectorAll('#mapel option').length>1);
  async function select(code,month='September',klass='Kelas 2 Putra'){
   await page.evaluate(({code})=>selectAssessmentType(code),{code});
   await page.evaluate(()=>selectExamType('Bulanan'));
   await page.selectOption('#examClassSelect',klass);
   await page.evaluate(month=>selectExamPeriod(month),month);
   return page.locator('#nilaiSantriBody tr[data-nama]').evaluateAll(nodes=>nodes.map(n=>n.dataset.nama));
  }
  for(let i=1;i<=3;i++){
   assert.deepEqual(await select('tahsin_level_'+i),[names[i-1]]);
   const components=await page.evaluate(()=>getKomponenAktif().map(x=>[x.id,x.bobot]));
   assert.deepEqual(components,i===2?[['syafawi',50],['tahriri',30],['tashnif',20]]:[['tathbiqi',100]]);
   assert.equal(await page.locator('.input-dinamis').first().inputValue(),'');
   for(const width of [409,456]){await page.setViewportSize({width,height:720});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  }
  // No level / other levels / wrong class never receives a score row.
  assert.deepEqual(await select('tahsin_level_1','September','Quran Gabungan'),[names[0]]);
  assert.deepEqual(await select('tahfiz','September','Quran Gabungan'),['ADITYA PUTRA IBRAHIM']);
  assert.deepEqual(await select('tahsin_level_1','September','Kelas 1 Putri'),[]);
  assert.match(await page.locator('#nilaiSantriBody').innerText(),/Belum ada santri.*Tahsin Level 1/);
  const tahfiz=await select('tahfiz');
  assert.deepEqual(tahfiz,Q.rows(classes,['Kelas 2 Putra'],'Tahfiz',assignments).map(r=>r.nama));
  assert(!tahfiz.includes(names[3]));
  assert.deepEqual(await select('tahsin_level_1','Oktober'),[]);
  assert.deepEqual(await select('tahsin_level_2','Oktober'),names.slice(0,2).sort((a,b)=>a.localeCompare(b,'id')));
  assert.deepEqual(await select('tahsin_level_1'),[names[0]]);
  await page.setViewportSize({width:409,height:720});
  await page.screenshot({path:'/tmp/quran-score-level-1-409.png',fullPage:true});
  // Blank save creates nothing. A deliberately entered zero remains valid.
  await page.evaluate(()=>simpanNilaiUjian());assert.deepEqual(await page.evaluate(()=>__writes),[]);
  await page.locator('.input-dinamis').fill('0');
  assert.equal(await page.evaluate(()=>simpanNilaiUjian()),true);
  let saved=await page.evaluate(()=>__fixture.cahaya_app.nilai_ujian_bulanan);
  assert.equal(Object.keys(saved).length,1);const record=Object.values(saved)[0];
  assert.equal(record.nama_santri,names[0]);assert.equal(record.nilai_total,0);assert.equal(record.tahsinLevel,'LEVEL_1');assert.equal(record.kode_penilaian,'tahsin_level_1');
  // Read-after-write and legacy subject compatibility, retaining the original record ID.
  assert.deepEqual(await select('tahsin_level_1'),[names[0]]);assert.equal(await page.locator('.input-dinamis').inputValue(),'0');
  await page.evaluate(()=>{const row=Object.values(__fixture.cahaya_app.nilai_ujian_bulanan)[0];row.kode_penilaian='tahsin_praktek';row.mata_pelajaran='Tahsin';row.jenis_penilaian='Tahsin Praktek (Level 1 dan 3)';row.nilai_tathbiqi=80;row.nilai_total=80;row.nilai=80;delete __fixture.cahaya_app.nilai_input_index;sessionStorage.clear();});
  const persisted=await page.evaluate(()=>__fixture);
  await context.addInitScript(fixture=>{window.__fixture=fixture;},persisted);
  await page.reload();await page.waitForFunction(()=>document.querySelectorAll('#mapel option').length>1);
  assert.deepEqual(await select('tahsin_level_1'),[names[0]]);assert.equal(await page.locator('.input-dinamis').inputValue(),'80');
  // Stale eligibility is rejected immediately before saving.
  await page.locator('.input-dinamis').fill('90');
  const writes=await page.evaluate(()=>__writes.length);
  await page.evaluate(()=>{__fixture.cahaya_app.program_quran_santri.alifsamudra={programQuran:'Tahsin',tahsinLevel:'LEVEL_3',effectiveFrom:'2026-09-01'};});
  assert.equal(await page.evaluate(()=>simpanNilaiUjian()),false);assert.equal(await page.evaluate(()=>__writes.length),writes);
  assert.match(await page.locator('#toastTitle').textContent(),/Daftar santri berubah/);
  assert.deepEqual(errors,[]);await context.close();
  console.log('Browser Quran: all 65 Guru rosters, exact input levels, 100/50-30-20 scoring, historical selection, empty/no-zero, explicit zero, legacy read, stale-save rejection, 409/456px: PASS');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
