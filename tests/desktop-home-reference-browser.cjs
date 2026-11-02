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
    for(const fixture of fixtures){
      if(fixture.user.defaultRole==='WALI_SANTRI')continue;
      const c=await context({...fixture.user,nama:'Multazam'},1440),p=await c.newPage();
      await p.setViewportSize({width:1440,height:1000});
      await p.goto(origin+'/main-dashboard.html');
      const f=p.locator('#contentFrame').contentFrame();await f.locator('#mobileRoleHome').waitFor();
      assert.equal(await f.locator('.mh-desktop-toolbar').isVisible(),true,fixture.name+' toolbar');
      const overflow=await f.locator('#mobileRoleHome').evaluate(e=>e.scrollWidth>e.clientWidth+2);assert(!overflow,fixture.name+' horizontal overflow');
      await f.locator('.mh-search input').fill('zz-no-menu');
      assert(await f.locator('.mh-all').evaluate(e=>e.open));
      assert.equal(await f.locator('.mh-all .mh-card:visible').count(),0);
      await f.locator('[data-mh-close]').click();
      if(fixture.user.defaultRole==='GURU_PONDOK'){
        await p.screenshot({path:'/tmp/cahaya-desktop-reference.png'});
        await p.setViewportSize({width:409,height:850});
        assert.equal(await f.locator('.mh-desktop-toolbar').isVisible(),false);
        await p.screenshot({path:'/tmp/cahaya-mobile-reference.png'});
      }
      assert.equal(await p.evaluate(()=>window.__writes.length),0);
      results.push(fixture.name);await c.close();
    }
    console.log('PASS desktop layout, role search, no horizontal overflow, mobile toolbar isolation:',results.join(', '));
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
