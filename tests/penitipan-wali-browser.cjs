const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const C=require('../js/penitipan-barang-v2.js');
const root=path.resolve(__dirname,'..');
const registry=JSON.parse(fs.readFileSync(path.join(root,'migration-export/students.json'),'utf8'));
const a=registry.find(x=>x.originalName==='NAEVA MARNIA'),b=registry.find(x=>x.originalName==='NAYYA SALSABILLA');
assert(a&&b);
const id='-fixtureTitipan01',recordPath=C.depositPath({unit:'putri',monthKey:'2026-09',id}),indexPath=C.pointerPath(a.legacyKey,id);
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});
    await context.route('**/*',route=>{const url=route.request().url();return url.startsWith(origin)||url.startsWith('file://')?route.continue():route.fulfill({body:'',contentType:'text/javascript'})});
    await context.addInitScript(({a,b,recordPath,indexPath})=>{
      const profile={username:'wali-a',namaAnak:a.originalName,roleSystemVersion:2,roles:['WALI_SANTRI'],defaultRole:'WALI_SANTRI',assignments:{WALI_SANTRI:{}}};
      if(!localStorage.getItem('cahayaCurrentUser'))localStorage.setItem('cahayaCurrentUser',JSON.stringify(profile));
      if(!localStorage.getItem('cahayaWaliAccount'))localStorage.setItem('cahayaWaliAccount',JSON.stringify(profile));
      if(!localStorage.getItem('cahayaWaliStudentProfile'))localStorage.setItem('cahayaWaliStudentProfile',JSON.stringify({namaAnak:a.originalName}));
      const data={[indexPath.slice(0,indexPath.lastIndexOf('/'))]:{'-fixtureTitipan01':recordPath},[recordPath]:{id:'-fixtureTitipan01',santriId:a.legacyKey,santriNama:a.originalName,unit:'putri',monthKey:'2026-09',namaBarang:'Paket buku uji',jumlah:'1 paket',tanggalTitip:'2026-09-21',waktuTitip:'14:20',status:'DITITIPKAN',catatan:'Catatan uji',updatedAt:'2026-09-21T07:20:00Z'}};
      const listeners=new Map();window.__data=data;window.__readPaths=[];window.__writes=[];window.__emit=(key,value)=>{data[key]=value;for(const fn of listeners.get(key)||[])fn({val:()=>value})};
      const ref=key=>({on:(event,fn)=>{window.__readPaths.push(key);const list=listeners.get(key)||[];list.push(fn);listeners.set(key,list);queueMicrotask(()=>fn({val:()=>data[key]||null}))},off:(event,fn)=>{listeners.set(key,(listeners.get(key)||[]).filter(x=>x!==fn))},once:async()=>({val:()=>data[key]||null}),get:async()=>({val:()=>data[key]||null}),set:()=>{window.__writes.push(key);throw Error('Wali write forbidden')},update:()=>{window.__writes.push(key);throw Error('Wali write forbidden')},orderByChild:()=>ref(key),equalTo:()=>ref(key)});
      window.firebase={apps:[{}],initializeApp(){},database:()=>({ref})};
      window.__fixture={a,b,recordPath,indexPath};
    },{a,b,recordPath,indexPath});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/wali/dashboard/informasi-penting.html?section=barang');
    assert(await page.locator('#depositRulesPane').isVisible(),'rules default visible');
    await page.locator('#depositMonitorTab').click();
    await page.getByText('Paket buku uji').waitFor({timeout:5000}).catch(async error=>{console.error('DIAGNOSTIC',await page.evaluate(()=>({feedback:document.getElementById('depositFeedback')?.textContent,role:window.cahayaRoleContext?.activeRole,assignment:window.cahayaRoleContext?.activeAssignment,reads:window.__readPaths,data:window.__data,body:document.body.innerText.slice(-1200)})),errors);throw error});
    assert.equal(await page.locator('.deposit-card').count(),1);
    assert.equal(await page.locator('#depositActive').innerText(),'1');
    assert.deepEqual(await page.evaluate(()=>window.__readPaths.filter(x=>x.startsWith('penitipan_barang'))),[indexPath.slice(0,indexPath.lastIndexOf('/')),recordPath]);
    await page.locator('.deposit-card button').click();
    assert(await page.locator('#depositDetail').isVisible());
    assert.equal(await page.locator('#depositDetailBody').getByText('Catatan uji').count(),1);
    assert.equal(await page.locator('#depositDetailBody input').count(),0);
    await page.locator('#depositDetailClose').click();
    await page.evaluate(({recordPath})=>{window.__emit(recordPath,{id:'-fixtureTitipan01',santriId:window.__fixture.a.legacyKey,santriNama:window.__fixture.a.originalName,namaBarang:'Paket buku uji',jumlah:'1 paket',tanggalTitip:'2026-09-21',waktuTitip:'14:20',status:'SUDAH_DISERAHKAN',deliveredAt:'2026-09-21T11:00:00Z',updatedAt:'2026-09-21T11:00:00Z'})},{recordPath});
    await page.getByText('Sudah Diserahkan',{exact:true}).first().waitFor();
    assert.equal(await page.locator('#depositDone').innerText(),'1');
    await page.locator('#depositStateFilter').selectOption('DONE');
    assert.equal(await page.locator('.deposit-card').count(),1);
    await page.locator('#depositStateFilter').selectOption('ACTIVE');
    assert.equal(await page.locator('.deposit-card').count(),0);
    for(const width of [409,456]){await page.setViewportSize({width,height:720});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow at '+width)}
    await page.evaluate(({b})=>{localStorage.setItem('cahayaCurrentUser',JSON.stringify({username:'wali-b',namaAnak:b.originalName,roleSystemVersion:2,roles:['WALI_SANTRI'],defaultRole:'WALI_SANTRI',assignments:{WALI_SANTRI:{}}}))},{b});
    await page.reload();await page.locator('#depositMonitorTab').click();
    await page.getByText('Belum ada titipan barang.',{exact:false}).waitFor();
    assert.equal(await page.locator('.deposit-card').count(),0,'other Wali sees no titipan');
    assert.equal(await page.evaluate(()=>window.__writes.length),0,'Wali never writes');
    await page.goto('file://'+path.join(root,'wali/dashboard/informasi-penting.html')+'?section=barang');
    await page.locator('#depositMonitorTab').click();
    await page.getByText('Paket buku uji').waitFor({timeout:8000});
    assert(!errors.some(x=>/penitipan/i.test(x)),errors.join('\n'));
    console.log('Penitipan Wali browser: own child, realtime status, other Wali isolation, read-only, 409/456 OK');
    await context.close();
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
