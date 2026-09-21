const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const R=require('../js/role-system-v2.js'),N=require('../js/role-navigation-v2.js');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
const app=`export const initializeApp=()=>({}),getApps=()=>[],getApp=()=>({});`;
const db=`export const getDatabase=()=>({}),ref=(d,p='')=>({p}),orderByChild=k=>({kind:'order',k}),equalTo=v=>({kind:'equal',v}),startAt=v=>({kind:'start',v}),endAt=v=>({kind:'end',v}),query=(r,...q)=>({...r,q});
function data(){return JSON.parse(localStorage.getItem('mock-db')||'{}')}function save(d){localStorage.setItem('mock-db',JSON.stringify(d))}function at(d,p){return p.split('/').filter(Boolean).reduce((x,k)=>x?.[k],d)}function put(d,p,v){const parts=p.split('/').filter(Boolean);let x=d;for(const k of parts.slice(0,-1))x=x[k]||(x[k]={});x[parts.at(-1)]=v}
export async function get(r){window.__reads.push(r.p);if(r.p===localStorage.getItem('mock-reject-read-path'))throw Error('simulated source read denied');if(r.p==='cahaya_app/masalah_pendidikan'&&!r.q&&localStorage.getItem('mock-reject-findings-root')==='1')throw Error('simulated read denied');let v=at(data(),r.p);if(r.q&&v){const child=r.q.find(x=>x.kind==='order')?.k,eq=r.q.find(x=>x.kind==='equal')?.v,from=r.q.find(x=>x.kind==='start')?.v,to=r.q.find(x=>x.kind==='end')?.v;v=Object.fromEntries(Object.entries(v).filter(([,x])=>eq!==undefined?String(x?.[child]||'')===String(eq):String(x?.[child]||'')>=String(from||'')&&String(x?.[child]||'')<=String(to||'zzzz')))}return{val:()=>v??null,exists:()=>v!=null}}
export async function set(r,v){if(localStorage.getItem('mock-reject-write')==='1')throw Error('simulated permission denied');const d=data();put(d,r.p,v);save(d);window.__writes.push({p:r.p,v})}
export async function update(r,v){if(localStorage.getItem('mock-reject-write')==='1')throw Error('simulated permission denied');const d=data();if(r.p){const prior=at(d,r.p)||{};put(d,r.p,{...prior,...v})}else for(const [p,x] of Object.entries(v))put(d,p,x);save(d);window.__writes.push({p:r.p,v})}`;
const profile={uid:'zaky',username:'zaky',nama:'Muhammad Zaky',roleSystemVersion:2,roles:['MANAJER'],defaultRole:'MANAJER',assignments:{MANAJER:{area:'PENDIDIKAN',unit:'PUTRA',managedRoles:['GURU_PONDOK'],programDomain:'KEPONDOKAN'}}};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const day=new Date(today+'T12:00:00Z').getUTCDay();
const schedule=[{id:'kbm-putra',aktif:true,unit:'PUTRA',kelas:'Kelas 1 Putra',hari:day,mapel:'Fiqih',guruKode:'FAIQ',guruNama:'Faiq',jamMulai:'07:00',jamSelesai:'08:00',jenis:'inti'},{id:'kbm-putri',aktif:true,unit:'PUTRI',kelas:'Kelas 1 Putri',hari:day,mapel:'Fiqih',guruKode:'DINDA',guruNama:'Dinda',jenis:'inti'}];
const database={cahaya_app:{jadwal_pelajaran:Object.fromEntries(schedule.map(x=>[x.id,x])),masalah_pendidikan:{},absensi_pembelajaran:{},guru_berhalangan:{},pengaturan_guru_mukim:{},absensi_ibadah_guru:{},pembinaan_guru:{},nilai_ujian_bulanan:{}},observasi_lapangan:{}};

(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
  const s=R.resolveSession(profile,{getItem:()=>null,setItem(){}}),other=R.resolveSession({username:'other',roleSystemVersion:2,roles:['MANAJER'],defaultRole:'MANAJER',assignments:{MANAJER:{area:'PEMBINAAN_KARAKTER',unit:'PUTRA',managedRoles:['NAQIB']}}},{getItem:()=>null,setItem(){}});
  assert.equal(N.canAccessRoute(s,'manajer/pendidikan-v2.html?view=kpi','menu-kpi-manajer').ok,true);
  assert.equal(N.canAccessRoute(other,'manajer/pendidikan-v2.html?view=kpi','menu-kpi-manajer').ok,false);
  for(const width of [409,456]){
    const c=await browser.newContext({viewport:{width,height:720},serviceWorkers:'block'});
    await c.addInitScript(({user,initial})=>{localStorage.setItem('cahayaCurrentUser',JSON.stringify(user));if(!localStorage.getItem('mock-db'))localStorage.setItem('mock-db',JSON.stringify(initial));window.__reads=[];window.__writes=[];const cache=new Map();window.CahayaDataCache={get:key=>{if(cache.has(key))return cache.get(key);const raw=key.includes('findings')?sessionStorage.getItem('cahaya:data:'+key):null;return raw?JSON.parse(raw).v:null},set:(key,value)=>{cache.set(key,value);if(key.includes('findings'))sessionStorage.setItem('cahaya:data:'+key,JSON.stringify({t:Date.now(),v:value}));return value},clear:prefix=>{for(const key of cache.keys())if(key.startsWith(prefix))cache.delete(key)}}},{user:profile,initial:database});
    await c.route('**/*',route=>{const url=route.request().url();if(url.includes('/data/jadwal-pelajaran-awal-2026-2027.json'))return route.fulfill({contentType:'application/json',body:JSON.stringify(schedule)});if(url.startsWith(origin))return route.continue();if(url.includes('firebase-app.js'))return route.fulfill({contentType:'text/javascript',body:app});if(url.includes('firebase-database.js'))return route.fulfill({contentType:'text/javascript',body:db});return route.fulfill({contentType:'text/javascript',body:''})});
    const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
    const open=async url=>{await p.goto(origin+url);await p.waitForLoadState('domcontentloaded')};
    await open('/home-manajer-pendidikan.html');await p.waitForSelector('#quickGrid .me-card');assert.deepEqual(await p.evaluate(()=>window.__reads),[]);
    await p.evaluate(()=>localStorage.setItem('mock-reject-findings-root','1'));
    await open('/manajer/pendidikan-v2.html?view=control');await p.waitForSelector('[data-new-finding]');
    await p.getByText('Jadwal tampil, tetapi Temuan belum dapat dimuat. Coba Segarkan.').waitFor();
    assert((await p.locator('#summary').innerText()).includes('—'));
    await p.evaluate(()=>localStorage.removeItem('mock-reject-findings-root'));
    await p.evaluate(()=>localStorage.setItem('mock-reject-read-path','cahaya_app/absensi_pembelajaran'));
    await p.reload();
    await p.getByText('Jadwal tampil, tetapi absensi pembelajaran belum dapat dimuat. Coba Segarkan.').waitFor();
    assert((await p.locator('#content').innerText()).includes('Fiqih'));
    assert.equal(await p.locator('[data-new-finding]').count(),0);
    await p.evaluate(()=>localStorage.setItem('mock-reject-read-path','cahaya_app/guru_berhalangan'));
    await p.reload();
    await p.getByText('Jadwal tampil, tetapi Guru berhalangan belum dapat dimuat. Coba Segarkan.').waitFor();
    assert((await p.locator('#content').innerText()).includes('Fiqih'));
    await p.evaluate(()=>localStorage.removeItem('mock-reject-read-path'));
    await p.reload();await p.waitForSelector('[data-new-finding]');
    const beforeControl=await p.evaluate(()=>window.__reads.slice(-4));assert(beforeControl.includes('cahaya_app/masalah_pendidikan'));
    await p.locator('[data-new-finding]').first().click();await p.locator('#actionForm').evaluate(f=>f.requestSubmit());
    await p.getByText('Temuan berhasil disimpan.').waitFor();await p.waitForFunction(()=>document.querySelector('#summary')?.textContent?.includes('1Temuan aktif'));
    const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('mock-db')).cahaya_app.masalah_pendidikan);
    const [findingId,finding]=Object.entries(stored)[0];assert.equal(finding.status,'Baru');assert.equal(finding.unit,'PUTRA');assert.equal(finding.programDomain,'KEPONDOKAN');
    await open('/manajer/pendidikan-v2.html?view=followup');await p.waitForSelector('[data-follow]');assert((await p.locator('#content').innerText()).includes('Absensi pembukaan'));
    await open('/manajer/pendidikan-v2.html?view=findings');await p.waitForSelector('#content');assert.equal(await p.locator('[data-follow]').count(),0);
    await open('/manajer/pendidikan-v2.html?view=followup');await p.waitForSelector('[data-follow]');await p.locator('[data-follow]').click();
    await p.locator('[name=analysis]').fill('Tinjau pelaksanaan');await p.locator('[name=action]').fill('Koordinasi dengan Guru');await p.locator('[name=target]').fill('Absensi lengkap');await p.locator('[name=status]').selectOption('SELESAI');await p.locator('#actionForm').evaluate(f=>f.requestSubmit());await p.waitForFunction(id=>JSON.parse(localStorage.getItem('mock-db')).cahaya_app.masalah_pendidikan[id].status==='Selesai',findingId);
    await open('/manajer/pendidikan-v2.html?view=followup');await p.waitForSelector('#content');assert.equal(await p.locator('[data-follow]').count(),0);
    await open('/manajer/pendidikan-v2.html?view=findings');await p.waitForSelector('#content .me-row');assert((await p.locator('#content').innerText()).includes('Absensi pembukaan'));
    await p.evaluate(date=>{const db=JSON.parse(localStorage.getItem('mock-db'));db.cahaya_app.masalah_pendidikan['legacy-key']={id:'display-id',tanggal:date,area:'PENDIDIKAN',unit:'PUTRA',programDomain:'KEPONDOKAN',status:'Diproses',temuan:'Temuan lama'};localStorage.setItem('mock-db',JSON.stringify(db));for(const key of Object.keys(sessionStorage))if(key.includes('legacy-findings'))sessionStorage.removeItem(key)},today);
    await open('/manajer/pendidikan-v2.html?view=followup');await p.getByText('Temuan lama').waitFor();await p.locator('[data-follow="legacy-key"]').click();
    await p.locator('[name=analysis]').fill('Tinjau temuan lama');await p.locator('[name=action]').fill('Diselesaikan');await p.locator('[name=target]').fill('Tuntas');await p.locator('[name=status]').selectOption('SELESAI');await p.locator('#actionForm').evaluate(f=>f.requestSubmit());await p.waitForFunction(()=>JSON.parse(localStorage.getItem('mock-db')).cahaya_app.masalah_pendidikan['legacy-key'].status==='Selesai');
    await open('/manajer/pendidikan-v2.html?view=followup');await p.waitForSelector('#content');assert.equal(await p.locator('[data-follow]').count(),0);
    await open('/manajer/pendidikan-v2.html?view=findings');await p.getByText('Temuan lama').waitFor();assert.equal(await p.locator('#content .me-row').count(),2);
    await open('/manajer/pendidikan-v2.html?view=kpi');await p.waitForSelector('#content .me-row');assert.equal(await p.locator('#pageTitle').innerText(),'KPI Manajer Pendidikan');assert((await p.locator('#content').innerText()).includes('Temuan selesai'));
    await open('/pendidikan/absensi-ibadah-guru.html');await p.waitForSelector('[data-teacher]');const initialReads=await p.evaluate(()=>window.__reads.slice());assert(initialReads.includes('cahaya_app/jadwal_pelajaran')&&initialReads.includes('cahaya_app/pengaturan_guru_mukim')&&initialReads.includes('cahaya_app/absensi_ibadah_guru'));
    await p.locator('#refresh').click();await p.waitForFunction(count=>window.__reads.length===count+1,initialReads.length);assert.equal((await p.evaluate(()=>window.__reads)).at(-1),'cahaya_app/absensi_ibadah_guru');
    await p.locator('[data-teacher]').first().check();await p.locator('#saveSettings').click();await p.getByText('Pengaturan Guru Mukim berhasil disimpan.').waitFor();await p.waitForSelector('#attendanceBody tr[data-row]');
    await p.reload();await p.waitForSelector('#attendanceBody tr[data-row]');assert.equal(await p.locator('[data-teacher]').first().isChecked(),true);
    for(const [prayer,value] of Object.entries({subuh:'Hadir',dzuhur:'Hadir',ashar:'Izin',maghrib:'Hadir',isya:'Hadir'}))await p.locator(`[data-prayer="${prayer}"]`).selectOption(value);
    await p.locator('#saveAttendance').click();await p.getByText('Absensi ibadah berhasil disimpan.').waitFor();
    await p.reload();await p.waitForSelector('#attendanceBody tr[data-row]');assert.equal(await p.locator('#date').inputValue(),today);for(const [prayer,value] of Object.entries({subuh:'Hadir',dzuhur:'Hadir',ashar:'Izin',maghrib:'Hadir',isya:'Hadir'}))assert.equal(await p.locator(`[data-prayer="${prayer}"]`).inputValue(),value);
    await p.evaluate(()=>localStorage.setItem('mock-reject-write','1'));await p.locator('#saveAttendance').click();await p.getByText('Absensi ibadah gagal disimpan.').waitFor();
    await p.locator('#saveSettings').click();await p.getByText('Pengaturan Guru Mukim gagal disimpan.').waitFor();
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
    console.log(`manager-education-stability-browser ${width}: home=0, control=${beforeControl.length}, guruMukimInitial=${initialReads.length}, guruMukimRefresh=1, kpi=3 narrow paths; round-trip ok`);
    await c.close();
  }
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
