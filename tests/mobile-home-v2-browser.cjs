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
    for(const fixture of fixtures.filter(f=>!process.env.CAHAYA_HOME_ROLE||f.name===process.env.CAHAYA_HOME_ROLE)){
      if(fixture.user.defaultRole==='WALI_SANTRI')continue;
      const c=await context({...fixture.user,nama:fixture.user.defaultRole==='SUPERVISOR'?'Ummi dr. Hj. Dini Indriani, MARS':fixture.user.defaultRole==='GURU_PONDOK'?'Multazam':'Muhammad Zaky'}),p=await c.newPage(),errors=[];
      p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
      await p.goto(origin+'/main-dashboard.html');
      const f=p.locator('#contentFrame').contentFrame();await f.locator('#mobileRoleHome').waitFor();
      if(fixture.name==='SUPERVISOR'){
        const homeMenu=await f.locator('.mh-menu-grid .mh-card').evaluateAll(cards=>cards.map(card=>({id:card.dataset.mhId,label:card.querySelector('b')?.textContent})));
        assert(homeMenu.some(card=>card.id==='menu-supervisor-v2--history'&&card.label==='Riwayat Eskalasi'),'Supervisor Home shows Riwayat Eskalasi');
        assert(!homeMenu.some(card=>card.id==='menu-penempatan-tahsin'),'Supervisor Home does not show Penempatan Level Tahsin');
        assert.equal(await f.locator('.mh-all [data-mh-id="menu-penempatan-tahsin"]').count(),1,'Tahsin placement remains available in all menus');
      }
      if(fixture.name==='LAYANAN_KEBERSIHAN'){
        const quick=await f.locator('.mh-quick-grid .mh-card').evaluateAll(cards=>cards.map(card=>({id:card.dataset.mhId,label:card.querySelector('b')?.textContent,description:card.querySelector('small')?.textContent})));
        assert.deepEqual(quick.map(card=>card.id),['menu-jurnal-pkl','menu-buku-tamu','menu-laporan-murojaah','menu-penitipan-barang']);
        assert.equal(quick[0].label,'Jurnal Harian');
        assert.equal(quick[0].description,'Catat pelaksanaan tugas hari ini');
        assert.equal(quick[2].label,'Laporan Pelanggaran');
        assert(!await f.locator('[data-mh-id="menu-buku-izin"]').count(),'Buku Izin absent from Layanan Home');
      }
      assert(await f.locator('.mh-role').isDisabled(),'single-role label has no fake picker');
      for(const width of [409,456,550,1024,1440]){
        await p.setViewportSize({width,height:720});await p.waitForTimeout(150);
        if(process.env.CAHAYA_HOME_ROLE)await p.screenshot({path:'/tmp/cahaya-home-'+fixture.name.replaceAll('/','-')+'-'+width+'.png'});
        const g=await f.locator('#mobileRoleHome').evaluate(home=>{
          const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
          const cards=[...home.querySelectorAll('.mh-quick-grid .mh-card,.mh-menu-grid .mh-card')].map(e=>({label:e.innerText,rect:box(e),children:[...e.querySelectorAll('.mh-icon,b,small')].map(box)}));
          const overlapping=cards.filter((a,i)=>cards.some((b,j)=>j>i&&Math.min(a.rect.right,b.rect.right)-Math.max(a.rect.x,b.rect.x)>1&&Math.min(a.rect.bottom,b.rect.bottom)-Math.max(a.rect.y,b.rect.y)>1));
          const cs=getComputedStyle(home),sm=getComputedStyle(home.querySelector('.mh-menu-card small')||home);
          const hero=home.querySelector('.mh-identity'),last=[...hero.children].filter(e=>e.getClientRects().length).at(-1);
          return {w:innerWidth,h:innerHeight,docH:document.documentElement.scrollHeight,docW:document.documentElement.scrollWidth,home:box(home),header:box(home.querySelector('.mh-header')),hero:box(home.querySelector('.mh-hero')),masthead:box(home.querySelector('.mh-masthead')),date:box(home.querySelector('.mh-date')),heroBottom:box(last).bottom,dateTop:box(home.querySelector('.mh-date')).y,style:cs.gridTemplateRows,padding:cs.padding,small:{font:sm.font,line:sm.lineHeight},cards,overlapping,footer:{y:box(home).bottom},reads:window.__reads};
        });
        if(process.env.CAHAYA_HOME_DEBUG==='2')console.log(await f.locator('#mobileRoleHome').evaluate(el=>[document.documentElement,document.body,el].map(n=>({tag:n.tagName,classes:n.className,rect:n.getBoundingClientRect().toJSON(),width:getComputedStyle(n).width,maxWidth:getComputedStyle(n).maxWidth,padding:getComputedStyle(n).padding}))));
        else if(process.env.CAHAYA_HOME_DEBUG)console.log(JSON.stringify(g));
        assert(g.docW<=g.w+1,fixture.name+' horizontal overflow '+JSON.stringify(g));
        assert(g.docH<=g.h+1,fixture.name+' Home scroll '+JSON.stringify(g));
        assert.equal(g.overlapping.length,0,fixture.name+' cards overlap');
        assert(g.heroBottom<=g.dateTop+1,fixture.name+' identity/date collision '+JSON.stringify({bottom:g.heroBottom,date:g.dateTop}));
        assert(g.header.bottom<=g.hero.y,fixture.name+' brand must sit above greeting');
        assert(g.date.y<g.masthead.bottom&&g.date.bottom>g.masthead.bottom,fixture.name+' date card must straddle the masthead edge');
        assert.equal(await f.locator('.mh-heading h2').count(),2);
        assert.equal(await f.locator('.mh-heading>div>span').count(),0,'no duplicate eyebrow titles');
        for(const card of g.cards){assert(card.rect.bottom<=g.footer.y+1,fixture.name+' card collides with banner '+JSON.stringify(card));assert(card.children.every(r=>r.bottom<=card.rect.bottom&&r.right<=card.rect.right),fixture.name+' clipped content '+JSON.stringify(card));assert(card.rect.h>=43,fixture.name+' small target');}
        assert.equal(await p.locator('#mobileBottomNav').count(),1);
        assert(await p.locator('body').evaluate(e=>e.classList.contains('mh-home-shell')),'Home shell class');
        await p.evaluate(()=>{for(const id of ['cahayaPushPromptV65','cahayaPushGlobalPromptV68']){if(document.getElementById(id))continue;const banner=document.createElement('div');banner.id=id;banner.textContent='Fixture push opt-in';document.body.append(banner)}});
        for(const id of ['cahayaPushPromptV65','cahayaPushGlobalPromptV68'])assert.equal(await p.locator('#'+id).isVisible(),false,'optional opt-in must not cover Home');
        if(process.env.CAHAYA_HOME_DEBUG)console.log(await p.locator('#mobileBottomNav button.active').evaluate(e=>({background:getComputedStyle(e).background,styles:[...document.styleSheets].map(s=>s.href)})));
        assert.deepEqual(g.reads,[],fixture.name+' Home operational reads');
        if(['GURU_PONDOK','SUPERVISOR','MENTOR_USRAH','MANAJER','DIREKTUR'].includes(fixture.name))await p.screenshot({path:'/tmp/cahaya-home-'+fixture.name+'-'+width+'.png'});
      }
      await p.setViewportSize({width:409,height:720});
      if(fixture.name==='LAYANAN_KEBERSIHAN'){
        for(const [id,selector] of [['menu-jurnal-pkl','#jkTanggal'],['menu-buku-tamu','#guestForm'],['menu-laporan-murojaah','#lp_searchSantri'],['menu-penitipan-barang','#depositForm']]){
          await p.evaluate(id=>openAuthorizedMenu(id),id);
          await f.locator(selector).waitFor();
          assert.equal(await f.locator('#roleAccessDenied').count(),0,id+' must not be denied');
          await p.evaluate(()=>openAuthorizedMenu('menu-home'));
          await f.locator('#mobileRoleHome').waitFor();
        }
      }
      if(fixture.name==='SUPERVISOR'){
        await f.locator('.mh-menu-grid [data-mh-id="menu-supervisor-v2--history"]').click();
        await p.waitForFunction(()=>document.querySelector('#dynamicMenu .nav-item.active')?.id==='menu-supervisor-v2--history');
        await p.evaluate(()=>openAuthorizedMenu('menu-home'));
        await f.locator('#mobileRoleHome').waitFor();
      }
      await f.locator('[data-mh-id="all"]').first().click();await p.locator('#mainSidebar.open').waitFor();await p.keyboard.press('Escape');
      const routeButton=f.locator('.mh-card[data-mh-id^="menu-"]').first(),menuId=await routeButton.getAttribute('data-mh-id');
      await routeButton.click();await p.waitForFunction(id=>document.querySelector('#dynamicMenu .nav-item.active')?.id===id,menuId);
      await p.evaluate(()=>openAuthorizedMenu('menu-home'));await f.locator('#mobileRoleHome').waitFor();
      await p.setViewportSize({width:1440,height:720});await p.waitForTimeout(80);assert.equal(await f.locator('#mobileRoleHome').isVisible(),true,'shared desktop Home visible');
      assert.equal(await f.locator('.mh-original').isVisible(),false,'no duplicate legacy desktop Home');
      assert.deepEqual(errors,[],fixture.name+' runtime errors');results.push({role:fixture.name,passed:true});console.log(fixture.name+': fixed Home PASS');await c.close();
    }
    const roles=['DIREKTUR','GURU_PONDOK','MENTOR_USRAH','MANAJER'];
    const user={...profile('DIREKTUR'),roles,assignments:Object.fromEntries(roles.map(r=>[r,assignments[r]]))};
    const c=await context(user),p=await c.newPage();await p.goto(origin+'/main-dashboard.html');
    for(const role of roles){
      const f=p.locator('#contentFrame').contentFrame();await f.locator('.mh-role').waitFor();await f.locator('.mh-role').click();await p.locator('#cahayaGlobalRoleOverlay.show').waitFor();
      assert.equal(await p.locator('.cahaya-global-role-option').count(),roles.length,'only owned roles in picker');
      await p.evaluate(role=>chooseCahayaGlobalRole(role),role);await f.locator('#mobileRoleHome[data-role="'+role+'"]').waitFor();
      assert.equal(await p.locator('#cahayaGlobalRoleOverlay.show').count(),0);assert.equal(await p.locator('iframe.cahaya-page-frame').count(),1);
    }await c.close();
    console.log(JSON.stringify(results,null,2));
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
