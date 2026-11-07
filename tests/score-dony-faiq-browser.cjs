const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

// Drive the real form with a Faiq October draft and no access to production.
const sdk = `
export const initializeApp=()=>({}), getDatabase=()=>({}), ref=(db,path='')=>({path}),
 push=()=>({key:'new-score'}), set=()=>{}, remove=()=>{}, query=(r,...filters)=>({...r,filters}),
 orderByChild=field=>({field}), equalTo=value=>({value}), startAt=value=>({start:value}),
 endAt=value=>({end:value}), endBefore=value=>({before:value}), limitToLast=limit=>({limit});
export async function get(r){
 const data=window.fixture[r.path]??null;
 return {val:()=>data,exists:()=>data!==null,size:Object.keys(data||{}).length};
}
export async function update(r,patch){Object.assign(window.fixture,patch);window.writes.push(patch)}
`;
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage();
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'application/javascript',body:sdk});
   if(url.hostname!=='fixture.test')return route.abort();
   const file=path.join(process.cwd(),url.pathname);
   if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
   await route.fulfill({path:file});
  });
  await page.addInitScript(()=>{
   localStorage.setItem('cahayaCurrentUser',JSON.stringify({uid:'dony-fixture',nama:'Dony Setiawan',teacherCode:'DONY',roles:['GURU_PONDOK'],defaultRole:'GURU_PONDOK',roleSystemVersion:2,assignments:{GURU_PONDOK:{programDomain:'KEPONDOKAN'}}}));
   const draft={nama_santri:'SANTRI UJI',kelas:'Kelas 1 Putra',mata_pelajaran:'Aqidah',periode_ujian:'Oktober',jenis_ujian:'Bulanan',tahun_akademik:'2026/2027',semester:'Ganjil',kode_penilaian:'kitab_tanpa_praktek',guruKode:'FAIQ',guru_penguji:'Faiq',nilai_syafawi:80,nilai_tahriri:85,nilai_tashnif:90};
   window.fixture={'cahaya_app/jadwal_pelajaran':[{guruKode:'DONY',mapel:'Aqidah',kelas:'Kelas 1 Putra'}],
   'cahaya_app/master_akademik/kelas':{'Kelas 1 Putra':['SANTRI UJI'],'Kelas 2 Putra':['SANTRI B'],'Kelas 3 Putra':['SANTRI C'],'Kelas 4 Putra':['SANTRI D']},
   'cahaya_app/master_akademik/kelas/Kelas 1 Putra':['SANTRI UJI'],'cahaya_app/nilai_ujian_bulanan':{faiqDraft:draft,donyDraft:{...draft,guruKode:'DONY',nilai_syafawi:42}},'cahaya_app/nilai_ujian_bulanan/faiqDraft':draft};
   window.writes=[];
  });
  await page.clock.setFixedTime(new Date('2026-11-07T08:00:00+07:00'));
  await page.goto('https://fixture.test/guru/inputNilaiUjian.html');
  await page.locator('#faiqOctoberToggle').check({timeout:5000});
  await page.locator('[onclick="selectAssessmentType(\'kitab_tanpa_praktek\')"]').click();
  await page.locator('[data-subject="Aqidah"]').click();
  await page.evaluate(()=>selectExamType('Bulanan'));
  assert.equal(await page.locator('[data-period]').count(),1);
  await page.locator('[data-period="Oktober"]').click();
  await page.waitForFunction(()=>document.querySelector('.input-dinamis')?.value==='80');
  await page.locator('#btnFinal').click();
  await page.locator('#finalReviewed').check();
  await page.locator('#btnConfirmFinal').click();
  await page.waitForFunction(()=>window.fixture['cahaya_app/nilai_ujian_bulanan/faiqDraft']?.status_nilai==='FINAL',{},{timeout:5000});
  const final=await page.evaluate(()=>window.fixture['cahaya_app/nilai_ujian_bulanan/faiqDraft']);
  assert.equal(final.guruKode,'FAIQ');assert.equal(final.final_by,'Dony Setiawan');
  assert(!await page.evaluate(()=>window.writes.some(p=>'cahaya_app/nilai_ujian_bulanan/donyDraft' in p)));
  console.log('PASS Dony opens and finalizes the existing Faiq draft with Dony audited as finalizer');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
