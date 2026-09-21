// Navigation integration: real local HTML/JS, offline Firebase fixtures only.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{fixtures,profile,assignments}=require('./role-menu-v2-fixtures.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
const app=`export const initializeApp=()=>({}),getApps=()=>[{}],getApp=()=>({});`;
const database=`
export const getDatabase=()=>({}),ref=(d,p='')=>({p}),child=(r,p)=>({p:r.p+'/'+p}),query=(r,...q)=>({...r,q});
export const orderByChild=k=>({k}),orderByKey=()=>({}),startAt=v=>({v}),endAt=v=>({v}),equalTo=v=>({v}),limitToLast=v=>({v}),limitToFirst=v=>({v});
function snap(r){const value=r.p?.startsWith('cahaya_app/master_usrah/')?['SANTRI FIXTURE']:null;return {key:r.p?.split('/').pop(),val:()=>value,exists:()=>value!==null,forEach(){},child:()=>snap({}),size:0}}
export async function get(r){window.__reads.push(r.p);return snap(r)}
export function onValue(r,fn){window.__reads.push(r.p);setTimeout(()=>fn(snap(r)),0);return ()=>{}}
export const off=()=>{},onDisconnect=()=>({}),serverTimestamp=()=>0;
export async function set(){throw Error('Forbidden write in navigation fixture')}
export const update=set,remove=set,runTransaction=set,push=()=>({key:'blocked',p:'blocked'});
`;
const auth=`export const getAuth=()=>({currentUser:{uid:'navigation-fixture',email:'fixture@cahayaapp.id'}}),onAuthStateChanged=(a,fn)=>{setTimeout(()=>fn(a.currentUser),0);return ()=>{}},signOut=async()=>{};`;
const firestore=`export const getFirestore=()=>({}),collection=(d,p)=>({p}),doc=(d,p,id)=>({p:p+'/'+(id||'')}),query=(r,...q)=>r,where=()=>({}),orderBy=()=>({}),limit=()=>({}),serverTimestamp=()=>0;export const getDoc=async()=>({exists:()=>false,data:()=>({})}),getDocs=async()=>({docs:[],empty:true,forEach(){}}),onSnapshot=(r,fn)=>{fn({docs:[],forEach(){}});return ()=>{}};export const setDoc=async()=>{throw Error('Forbidden write')},updateDoc=setDoc,addDoc=setDoc,deleteDoc=setDoc;`;
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const results=[];
  async function context(user,width=409){
    const c=await browser.newContext({viewport:{width,height:720},serviceWorkers:'block'});
    await c.route('**/*',r=>{const u=r.request().url();if(u.startsWith(origin))return r.continue();let body='';const version=Number(u.match(/firebasejs\/(\d+)\./)?.[1]||0);if(version>=9){if(u.includes('firebase-app.js'))body=app;else if(u.includes('firebase-database.js'))body=database;else if(u.includes('firebase-auth.js'))body=auth;else if(u.includes('firebase-firestore.js'))body=firestore;}return r.fulfill({contentType:'text/javascript',body})});
    await c.addInitScript(user=>{
      window.__reads=[];window.__writes=[];
      if(window===window.top&&!sessionStorage.getItem('nav-fixture')){localStorage.clear();localStorage.setItem('cahayaCurrentUser',JSON.stringify(user));sessionStorage.setItem('nav-fixture','1')}
      const empty={val:()=>null,exists:()=>false,forEach(){},child:()=>empty};
      const forbidden=()=>{window.__writes.push('blocked');throw Error('Forbidden fixture write')};
      const database={ref:p=>{const q={once:async()=>{window.__reads.push('RTDB:'+p);return empty},on:(event,fn)=>{window.__reads.push('LISTEN:'+p);if(typeof fn==='function')setTimeout(()=>fn(empty),0)},off(){},set:forbidden,update:forbidden,push:forbidden};for(const key of ['orderByChild','orderByKey','equalTo','startAt','endAt','limitToLast','limitToFirst'])q[key]=()=>q;return q}};
      const auth={currentUser:{uid:'navigation-fixture',email:'fixture@cahayaapp.id'},onAuthStateChanged:fn=>{setTimeout(()=>fn(auth.currentUser),0);return ()=>{}},signOut:async()=>{}};
      const collection=p=>({doc:id=>({get:async()=>{window.__reads.push('FS:'+p+'/'+id);return {exists:p==='users',data:()=>user}},set:forbidden,update:forbidden}),get:async()=>({empty:true,docs:[],forEach(){}}),where:()=>collection(p),orderBy:()=>collection(p)});
      window.firebase={apps:[{}],initializeApp:()=>({}),auth:()=>auth,database:()=>database,firestore:()=>({collection}),messaging:()=>({})};
      window.firebase.firestore.FieldValue={serverTimestamp:()=>0};
    },user);return c;
  }
  try{
    for(const fixture of fixtures.filter(f=>!process.env.CAHAYA_NAV_ROLE||f.name===process.env.CAHAYA_NAV_ROLE)){
      if(fixture.user.defaultRole==='WALI_SANTRI')continue; // own standalone shell covered by wali-role-v2-browser
      const c=await context(fixture.user),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
      await p.goto(origin+'/main-dashboard.html');await p.waitForSelector('#dynamicMenu .nav-item');
      await p.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('.html'));
      const items=await p.evaluate(()=>CahayaRoleMenuV2.model(cahayaRoleV2Session));
      assert.deepEqual(await p.locator('#dynamicMenu .nav-item').evaluateAll(nodes=>nodes.map(n=>n.id)),items.map(x=>x.id),fixture.name+' model is rendered exactly');
      assert.deepEqual(await p.evaluate(()=>window.__reads.filter(x=>!String(x).startsWith('FS:users/'))),[],fixture.name+' menu has zero operational reads');
      const failures=[];
      for(const item of items){
        const before=errors.length;
        await p.evaluate(()=>{if(!document.getElementById('mainSidebar').classList.contains('open'))toggleSidebar()});
        await p.locator('#'+item.id).click();
        if(item.action==='chat'){
          await p.waitForFunction(()=>document.getElementById('pengurusChatWindow')?.style.display==='flex');
          await p.locator('#viewInbox').getByText('Belum Ada Pesan').waitFor();
          assert.equal(await p.locator('#mainSidebar.open').count(),0);
          await p.evaluate(()=>openAuthorizedMenu('menu-home'));
          continue;
        }
        await p.waitForFunction(route=>CahayaRoleMenuV2.key(document.getElementById('contentFrame')?.dataset.cahayaUrl||'')===CahayaRoleMenuV2.key(route),item.route);
        const frame=p.locator('#contentFrame').contentFrame();await frame.locator('body').waitFor();
        await frame.locator('#cahaya-feature-theme').waitFor({state:'attached'});
        await p.waitForTimeout(60);
        assert.equal(await frame.locator('#roleAccessDenied').count(),0,fixture.name+' '+item.label);
        assert.equal(await p.locator('#'+item.id).getAttribute('aria-current'),'page');
        assert.equal(await p.locator('#mainSidebar.open').count(),0);
        if(errors.length>before)failures.push({menu:item.label,errors:errors.slice(before)});
        if(item.id==='menu-panduan-kerja'){
          assert.equal(await frame.locator('#operations details').count(),15);
          assert.equal(await frame.locator('#manual details').count(),15);
          assert.equal(await frame.locator('h1').first().textContent(),await p.evaluate(()=>CahayaRoleSystemV2.displayLabelFor(cahayaRoleV2Session.activeRole,cahayaRoleV2Session.activeAssignment)));
          assert.deepEqual(await frame.locator('body').evaluate(()=>window.__reads),[],'guide zero operational reads');
          const copy=await frame.locator('#roleUtility').textContent();
          assert(!/Firebase|RTDB|activeAssignment|caseV2|orderByChild|schema/.test(copy),'no developer language');
          if(fixture.name.includes('PEMBINAAN_KARAKTER'))assert(!copy.includes('Kontrol Hari Ini'));
          await frame.getByRole('tab',{name:'User Manual',exact:true}).click();assert(await frame.locator('#manual').isVisible());
          await frame.locator('#guideSearch').fill('pencarian-yang-tidak-ada');assert(await frame.locator('#noGuideMatch').isVisible());
          await frame.locator('#guideSearch').fill('');
          await frame.locator('body').evaluate(()=>{window.__printed=0;window.print=()=>window.__printed++});
          await frame.locator('#printGuide').click();assert.equal(await frame.locator('body').evaluate(()=>window.__printed),1);
        }
        if(item.id==='menu-profil')assert(await frame.locator('#profileRoleContext').isVisible());
      }
      for(const width of [409,456,1440]){
        await p.setViewportSize({width,height:720});await p.evaluate(()=>openAuthorizedMenu('menu-home'));
        if(width<900)await p.evaluate(()=>toggleSidebar());
        if(width<900)await p.waitForFunction(()=>document.getElementById('mainSidebar').getBoundingClientRect().left>=-1);
        const geometry=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,sidebar:document.getElementById('mainSidebar').getBoundingClientRect().width,nav:document.querySelectorAll('#mobileBottomNav').length}));
        assert(geometry.scroll<=width+1,fixture.name+' shell overflow '+JSON.stringify(geometry));assert.equal(geometry.nav,1);
        assert(await p.locator('#dynamicMenu .group-label').first().isVisible(),'group labels visible');
        if(fixture.name==='DIREKTUR')await p.screenshot({path:`/tmp/cahaya-menu-${width}.png`});
        if(width<900){await p.keyboard.press('Escape');assert.equal(await p.locator('#mainSidebar.open').count(),0);}
        assert.deepEqual(await p.locator('#mobileBottomNav .mobile-shortcut-label').allTextContents(),['Jadwal','KPI','Beranda','Pesan','Lainnya']);
        assert.equal(await p.locator('#mobileBottomNav button:disabled').count(),0,'all global destinations available');
        for(const kind of ['jadwal','kpi']){
          await p.evaluate(kind=>openMobileShortcut('global-'+kind),kind);
          const expected=await p.evaluate(kind=>CahayaRoleMenuV2.model(cahayaRoleV2Session).find(x=>x.id===CahayaRoleMenuV2.bottom(cahayaRoleV2Session,kind)).route,kind);
          if(fixture.user.defaultRole==='GURU_PONDOK'&&kind==='jadwal')await p.waitForFunction(()=>document.getElementById('contentFrame')?.contentDocument?.querySelector('#teacherSheet.show'));
          else await p.waitForFunction(route=>CahayaRoleMenuV2.key(document.getElementById('contentFrame')?.dataset.cahayaUrl||'')===CahayaRoleMenuV2.key(route),expected);
          assert.equal(await p.locator('#contentFrame').contentFrame().locator('#roleAccessDenied').count(),0);
        }
        for(const menuId of ['menu-panduan-kerja','menu-profil']){
          await p.evaluate(id=>openAuthorizedMenu(id),menuId);
          await p.waitForFunction(id=>document.querySelector('#dynamicMenu .active')?.id===id,menuId);
          const frame=p.locator('#contentFrame').contentFrame();await frame.locator('body').waitFor();
          await p.waitForTimeout(70);
          const bounds=await frame.locator('body').evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));
          assert(bounds.scroll<=bounds.w+1,`${fixture.name} ${menuId} overflow at ${width}`);
          if(menuId==='menu-panduan-kerja'&&fixture.name==='GURU_PONDOK'){await p.waitForTimeout(350);await p.screenshot({path:`/tmp/cahaya-release-guide-${width}.png`})}
        }
        await p.evaluate(()=>openMobileShortcut('menu-chat'));
        await p.waitForFunction(()=>document.getElementById('pengurusChatWindow')?.style.display==='flex');
        assert(await p.locator('#viewInbox').getByText('Belum Ada Pesan').isVisible());
        const chatBounds=await p.locator('#pengurusChatWindow').boundingBox();assert(chatBounds.x>=-1&&chatBounds.x+chatBounds.width<=width+1,'chat fits '+width);
        await p.evaluate(()=>openAuthorizedMenu('menu-home'));
      }
      results.push({role:fixture.name,menus:items.length,failures,errors});console.log(fixture.name+': '+items.length+' menus; '+errors.length+' runtime errors');await c.close();
    }
    // Switch repeatedly with a drawer open: old frame and menu IDs must vanish.
    const roles=['DIREKTUR','GURU_PONDOK','MENTOR_USRAH','MANAJER'];const user={...profile('DIREKTUR'),roles,assignments:Object.fromEntries(roles.map(r=>[r,assignments[r]]))};
    const c=await context(user),p=await c.newPage();await p.goto(origin+'/main-dashboard.html');await p.waitForSelector('#menu-direktur-v2');
    for(const role of [...roles,'DIREKTUR']){
      await p.evaluate(async role=>{toggleSidebar();await chooseCahayaGlobalRole(role)},role);
      await p.waitForFunction(role=>getCahayaActiveRole()===role,role);
      assert.equal(await p.locator('#mainSidebar.open').count(),0);
      assert.equal(await p.locator('iframe.cahaya-page-frame').count(),1);
      assert.deepEqual(await p.locator('#dynamicMenu .nav-item').evaluateAll(n=>n.map(x=>x.id)),await p.evaluate(()=>CahayaRoleMenuV2.model(cahayaRoleV2Session).map(x=>x.id)));
      assert.deepEqual(await p.evaluate(()=>cahayaRoleV2Session.activeAssignment),require('../js/role-system-v2.js').assignmentFor(role,assignments[role]));
      const label=await p.evaluate(()=>CahayaRoleSystemV2.displayLabelFor(cahayaRoleV2Session.activeRole,cahayaRoleV2Session.activeAssignment));
      await p.evaluate(()=>openAuthorizedMenu('menu-panduan-kerja'));
      await p.waitForFunction(()=>document.getElementById('contentFrame')?.contentDocument?.querySelector('#operations details'));
      assert.equal(await p.locator('#contentFrame').contentFrame().locator('h1').first().textContent(),label);
      await p.evaluate(()=>openAuthorizedMenu('menu-profil'));
      await p.waitForFunction(()=>document.getElementById('contentFrame')?.contentDocument?.querySelector('#profileRoleContext'));
      assert.equal(await p.locator('#contentFrame').contentFrame().locator('#dispRole').textContent(),label);
      await p.evaluate(()=>openMobileShortcut('global-kpi'));
      await p.waitForFunction(()=>CahayaRoleMenuV2.key(document.getElementById('contentFrame')?.dataset.cahayaUrl||'')===CahayaRoleMenuV2.key(CahayaRoleMenuV2.model(cahayaRoleV2Session).find(x=>x.id===CahayaRoleMenuV2.bottom(cahayaRoleV2Session,'kpi')).route));
      await p.evaluate(()=>openAuthorizedMenu('menu-chat'));await p.locator('#viewInbox').getByText('Belum Ada Pesan').waitFor();
      assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('cahayaCurrentUser')).username),user.username);
    }
    await c.close();
    console.log(JSON.stringify(results,null,2));assert(results.every(r=>!r.errors.length),'Unexpected runtime errors; see per-menu results');
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
