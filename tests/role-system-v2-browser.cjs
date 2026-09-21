// Isolated browser fixture. All external traffic is blocked, all Firebase writes throw.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1)||'main-dashboard.html';
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const results=[];
  try{
    for(const [role,home] of [['GURU_PONDOK','home-guru'],['DIREKTUR','home-direktur'],['NAQIB','home-naqib'],['NAQIBAH','home-naqib']]){
      const context=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});
      await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.fulfill({contentType:'text/javascript',body:''}));
      await context.addInitScript(({role})=>{
        window.__reads=[];window.__writes=[];
        const profile={uid:'fixture',username:'fixture',nama:'Multazam',label:'Multazam',roleSystemVersion:2,roles:['GURU_PONDOK','DIREKTUR','NAQIB','NAQIBAH'],defaultRole:role,assignments:{GURU_PONDOK:{programDomain:'KEPONDOKAN'},DIREKTUR:{unit:'ALL'},NAQIB:{unit:'PUTRA'},NAQIBAH:{unit:'PUTRI'}}};
        if(window===window.top && !sessionStorage.getItem('fixture-init')){localStorage.clear();localStorage.setItem('cahayaCurrentUser',JSON.stringify(profile));sessionStorage.setItem('fixture-init','1')}
        const writes=()=>{window.__writes.push('blocked');throw Error('Production writes forbidden by test')};
        const database={ref:p=>{const q={once:()=>{window.__reads.push('RTDB:'+p);return Promise.resolve({val:()=>null,exists:()=>false})},on:()=>{window.__reads.push('LISTEN:'+p)},off(){},set:writes,update:writes,push:writes};for(const key of ['orderByChild','equalTo','startAt','endAt','limitToLast'])q[key]=()=>q;return q}};
        const auth={currentUser:{uid:'fixture',email:'fixture@cahayaapp.id'},onAuthStateChanged:fn=>{setTimeout(()=>fn(auth.currentUser),10);return ()=>{}},signOut:async()=>{}};
        window.firebase={apps:[{}],initializeApp(){return {}},auth:()=>auth,database:()=>database,firestore:()=>({collection:p=>({doc:id=>({get:async()=>{window.__reads.push('FS:'+p+'/'+id);return {exists:true,data:()=>profile}},set:writes,update:writes}),get:async()=>{window.__reads.push('FS:'+p);return {forEach(){}}}})}),messaging:()=>({})};
      },{role});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/main-dashboard.html');
      await page.waitForFunction(home=>document.getElementById('contentFrame')?.src.includes(home),home);
      await page.locator('#contentFrame').contentFrame().locator('#greeting, #directorName, #userName').first().waitFor();
      await page.waitForTimeout(1700);
      assert.equal(await page.locator('#mobileBottomNav').count(),1);
      const facts=await page.evaluate(()=>({reads:window.__reads,writes:window.__writes,role:window.getCahayaActiveRole(),assignment:window.cahayaRoleV2Session.activeAssignment}));
      assert.equal(facts.role,role);assert.deepEqual(facts.reads.filter(p=>!p.startsWith('FS:users/')),[]);assert.deepEqual(facts.writes,[]);
      const frame=page.frames().find(f=>f.url().includes(home));
      const geometry=await frame.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,menus:document.querySelectorAll('#menuGrid button, #teacherMenuGrid button, #divisionGrid button, #managementGrid button').length,reads:window.__reads}));
      assert(geometry.scroll<=geometry.width+1,JSON.stringify(geometry));assert.deepEqual(geometry.reads,[]);
      await page.screenshot({path:`/tmp/role-v2-${role.toLowerCase()}.png`});
      await page.evaluate(()=>openCahayaGlobalRoleModal());
      assert.equal(await page.locator('.cahaya-global-role-option').count(),4);
      await page.evaluate(()=>chooseCahayaGlobalRole('GURU_PONDOK'));
      await page.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('home-guru'));
      assert.equal(await page.locator('iframe.cahaya-page-frame').count(),1,'old role iframe disposed');
      assert.equal(await page.evaluate(()=>cahayaRoleV2Session.activeAssignment.unit),'');
      const before=await page.locator('#contentFrame').getAttribute('src');
      page.once('dialog',d=>d.dismiss());
      await page.evaluate(()=>loadPage('admin/users.html',document.getElementById('menu-nilai')));
      assert.equal(await page.locator('#contentFrame').getAttribute('src'),before,'spoofed direct shell URL blocked');
      await page.evaluate(async()=>{
        terapkanProfilAktif({uid:'fixture',username:'fixture',nama:'Multazam',roleSystemVersion:2,roles:['GURU_PONDOK'],assignments:{GURU_PONDOK:{programDomain:'KEPONDOKAN'}}});
        await refreshUserProfileUI();openCahayaGlobalRoleModal();
      });
      assert.equal(await page.locator('#cahayaGlobalRoleOverlay.show').count(),0,'single role does not open selector');
      results.push({role,geometry,reads:facts.reads,errors});
      await context.close();
    }
    console.log(JSON.stringify(results,null,2));
    assert(results.every(r=>r.errors.length===0),'Unexpected browser errors: '+JSON.stringify(results.map(r=>r.errors)));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
