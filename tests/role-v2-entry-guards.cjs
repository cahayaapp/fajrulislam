// Isolated browser only. No network reaches Firebase; mutations are mocked.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
const profile=(role,a={},extra={})=>({username:'fixture',nama:'Fixture',roleSystemVersion:2,roles:[role],defaultRole:role,assignments:{[role]:a},akses:['admin'],...extra});
const appModule='export const initializeApp=()=>(window.__initializations++,{}),getApps=()=>[],getApp=()=>({});';
const dbModule=`
export const getDatabase=()=>({}),ref=(db,p='')=>({p}),query=(r,...q)=>({...r,q}),orderByChild=k=>({field:k}),equalTo=v=>({equal:v});
export async function get(r){window.__reads.push(r);let data=null;
if(r.p.startsWith('cahaya_app/master_usrah/'))data=[r.p.endsWith('Usrah 3')?'OWN USRAH THREE':r.p.endsWith('Usrah 7')?'PUTRI SEVEN':'MEMBER '+r.p.split('/').pop()];
if(r.p==='cahaya_app/master_program_harian')data={group:{'PROGRAM FIXTURE':{poin:1}}};
if(r.p==='cahaya_app/mentoring_usrah')data={own:{usrah:'Usrah 3',targetKelompok:'OWN LOG'},other:{usrah:'Usrah 7',targetKelompok:'FORBIDDEN LOG'}};
return {val:()=>data,exists:()=>data!==null}}
export function push(r,value){const key='fixture-write';if(value)window.__writes.push({path:r.p,value});return {key,p:r.p+'/'+key}}
export async function set(r,value){window.__writes.push({path:r.p,value})}
export async function update(r,value){window.__writes.push({path:r.p,value})}
`;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const results=[];
 async function context(user){
  const c=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});
  await c.route('**/*',route=>{
   const u=route.request().url();if(u.startsWith(origin))return route.continue();
   return route.fulfill({contentType:'text/javascript',body:u.endsWith('/firebase-app.js')?appModule:u.endsWith('/firebase-database.js')?dbModule:''});
  });
  await c.addInitScript(user=>{
   if(!localStorage.getItem('fixture-initialized')){localStorage.setItem('cahayaCurrentUser',JSON.stringify(user));localStorage.setItem('fixture-initialized','1')}
   window.__reads=[];window.__writes=[];window.__initializations=0;
   const bad=()=>{window.__reads.push('UNEXPECTED_SDK_INIT');throw Error('Feature initialized on denied route')};
   window.firebase={apps:[],initializeApp:bad,firestore:bad,database:bad,auth:bad};
  },user);
  return c;
 }
 try{
  const cases=[
   [profile('GURU_PONDOK'), 'admin/users.html'],
   [profile('GURU_PONDOK'), 'supervisor/command-center.html'],
   [profile('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['DAPUR','SARPRAS']}),'manajer/kontrol-pendidikan.html'],
   [profile('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['GURU_PONDOK','NAQIB','KONSELOR','MEDIA']}),'observer/dapur.html'],
   [profile('MANAJER',{unit:'PUTRA',managedRoles:['GURU_PONDOK'],programDomain:'KEPONDOKAN'}),'pimpinan/rekap-kepala-sekolah.html'],
   [profile('NAQIB',{unit:'PUTRA'}),'konselor/daftar-kasus-baru.html?mode=naqib&level=muda'],
   [profile('GURU_PKBM',{programDomain:'PKBM'}),'guru/absensiPembelajaran.html'],
   [profile('WALI_SANTRI',{}, {namaAnak:'AKBAR PRAYOGA'}),'admin/database.html'],
   [profile('KONSELOR',{unit:'PUTRI',level:'MUDA'}),'admin/database.html'],
   [profile('KONSELOR',{unit:'PUTRI',level:'MUDA'}),'konselor/daftar-kasus-baru.html'],
   [profile('NAQIBAH',{unit:'PUTRA'}),'pusat-asesmen/santri.html'],
   [profile('GURU_PONDOK'),'docs/admin/users.html'],
   [profile('GURU_PONDOK'),'index-v127.html'],
   [profile('NAQIB',{unit:'PUTRI'}),'naqib/absensi.html'],
  ];
  for(const [user,url] of cases){
   const c=await context(user),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.stack||e.message));
   await p.goto(origin+'/'+url);await p.locator('#roleAccessDenied').waitFor();
   assert.deepEqual(await p.evaluate(()=>window.__reads),[]);assert.deepEqual(await p.evaluate(()=>window.__writes),[]);assert.deepEqual(errors,[],user.defaultRole+' '+url);
   assert.equal(await p.evaluate(()=>window.__initializations),0);
   assert.equal(await p.locator('iframe').count(),0);
   if(url==='admin/users.html')await p.screenshot({path:'/tmp/role-v2-route-denied.png'});
   results.push({role:user.defaultRole,url,reads:0,denied:true});await c.close();
  }
  // Same guard also runs for an iframe URL bypassing loadPage entirely.
  {
   const c=await context(profile('NAQIB',{unit:'PUTRA'})),p=await c.newPage();
   await p.goto(origin+'/home-naqib.html');
   await p.evaluate(()=>{const f=document.createElement('iframe');f.id='forgedFrame';f.src='konselor/daftar-kasus-baru.html';document.body.appendChild(f)});
   const denied=p.locator('#forgedFrame').contentFrame();
   await denied.locator('#roleAccessDenied').waitFor();
   assert.deepEqual(await p.evaluate(()=>window.__reads),[]);
   assert.deepEqual(await denied.locator('body').evaluate(()=>window.__reads),[]);
   results.push({role:'NAQIB',entry:'direct iframe src',reads:0,denied:true});
   await c.close();
  }
  // The actual legacy attendance module consumes the scope adapter. Names and
  // URL unit parameters deliberately contradict the canonical assignment.
  for(const [role,unit,key,forbidden] of [['NAQIB','PUTRA','Usrah 3','Usrah 7'],['NAQIBAH','PUTRI','Usrah 7','Usrah 3']]){
   const c=await context(profile(role,{unit},{nama:role==='NAQIB'?'Fatimah':'Kamal'})),p=await c.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
   await p.goto(origin+'/naqib/absensi.html?unit='+(unit==='PUTRA'?'PUTRI':'PUTRA'));
   await p.waitForFunction(()=>typeof pickProgram==='function'&&!document.getElementById('loading').classList.contains('show'));
   await p.evaluate(()=>pickProgram(0));
   const reads=await p.evaluate(()=>window.__reads);
   assert(!reads.some(r=>r.p==='cahaya_app/master_usrah'||r.p?.endsWith(forbidden)));
   await p.evaluate(k=>pickScope(k),key);
   const before=await p.locator('#studentList').innerText();assert(before.length>0);
   await p.screenshot({path:'/tmp/role-v2-scope-'+role.toLowerCase()+'.png'});
   await p.evaluate(k=>pickScope(k),forbidden);
   assert.equal(await p.locator('#studentList').innerText(),before);
   await p.evaluate(()=>saveAttendance());
   const writes=await p.evaluate(()=>window.__writes);
   assert.equal(writes[0].path,'cahaya_app/absensi_program_harian');
   assert(writes[0].value.data.every(s=>s.usrahAsal===key));
   assert.equal(writes[0].value.unit,unit==='PUTRA'?'Putra':'Putri');
   assert.deepEqual(errors,[]);
   // A previously opened tab is revoked on active assignment change.
   const other=await c.newPage();await other.goto(origin+'/role-access-denied.html');
   await other.evaluate(()=>{const u=JSON.parse(localStorage.getItem('cahayaCurrentUser'));u.roles=['GURU_PONDOK'];u.defaultRole='GURU_PONDOK';u.assignments={GURU_PONDOK:{programDomain:'KEPONDOKAN'}};localStorage.setItem('cahayaCurrentUser',JSON.stringify(u))});
   await p.waitForURL('**/role-access-denied.html');
   results.push({role,unit,scopedReads:reads.map(r=>r.p),mockWriteScoped:true,oldTabRevoked:true});
   await c.close();
  }
  const c=await context(profile('MENTOR_USRAH',{usrahIds:['USRAH_3']})),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
  await p.goto(origin+'/pembinaan/mentoring-usrah.html');
  await p.waitForFunction(()=>document.querySelector('#usrah option')?.textContent==='Usrah 3');
  assert.equal(await p.locator('#usrah option').count(),1);
  assert((await p.locator('#history').innerText()).includes('OWN LOG'));
  assert(!(await p.locator('#history').innerText()).includes('FORBIDDEN'));
  const reads=await p.evaluate(()=>window.__reads);
  assert.deepEqual(reads.filter(r=>r.p.startsWith('cahaya_app/master_usrah')).map(r=>r.p),['cahaya_app/master_usrah/Usrah 3']);
  assert.deepEqual(reads.find(r=>r.p==='cahaya_app/mentoring_usrah').q,[{field:'usrah'},{equal:'Usrah 3'}]);
  await p.locator('#target').fill('MOCK TARGET');
  await p.locator('#save').click();
  assert.equal((await p.evaluate(()=>window.__writes))[0].value.usrah,'Usrah 3');
  await p.evaluate(()=>{document.getElementById('usrah').innerHTML='<option>Usrah 7</option>'});
  await p.locator('#target').fill('FORBIDDEN');
  await p.locator('#save').click();
  assert.equal((await p.evaluate(()=>window.__writes)).length,1);
  assert.deepEqual(errors,[]);results.push({role:'MENTOR_USRAH',assigned:'USRAH_3',historyScoped:true,mockWriteScoped:true});
  await c.close();
  console.log(JSON.stringify({results,productionWrites:0},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
