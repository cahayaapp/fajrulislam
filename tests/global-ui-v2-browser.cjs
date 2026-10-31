// Isolated visual fixtures. Every external request is mocked; no live data/writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),before=process.env.UI_BEFORE==='1';
const out=process.env.UI_OUTPUT||'/tmp/cahaya-ui-v2';fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))}catch{res.writeHead(404).end()}});
const cases=[
 ['guru','GURU_PONDOK',{programDomain:'KEPONDOKAN'},'home-guru'],
 ['naqib','NAQIB',{unit:'PUTRA'},'home-naqib'],
 ['mentor','MENTOR_USRAH',{usrahIds:['USRAH_3']},'home-mentor-usrah'],
 ['konselor','KONSELOR',{unit:'PUTRA',level:'MADYA'},'home-konselor'],
 ['manajer-pendidikan','MANAJER',{area:'PENDIDIKAN',unit:'PUTRA',programDomain:'KEPONDOKAN',managedRoles:['GURU_PONDOK']},'home-manajer-pendidikan'],
 ['manajer-karakter','MANAJER',{area:'PEMBINAAN_KARAKTER',unit:'PUTRA',managedRoles:['NAQIB','MENTOR_USRAH','KONSELOR']},'home-manajer-pembinaan-karakter'],
 ['supervisor','SUPERVISOR',{unit:'PUTRI',supervisedRoles:['GURU_PONDOK','NAQIBAH','MENTOR_USRAH','KONSELOR','DAPUR','MEDIA','LAYANAN_KEBERSIHAN']},'home-supervisor-v2'],
 ['direktur','DIREKTUR',{unit:'ALL'},'home-direktur'],['dapur','DAPUR',{unit:'PUTRA'},'home-dapur'],
 ['sarpras','SARPRAS',{unit:'PUTRA'},'role-workspace'],['kesehatan','KESEHATAN',{unit:'PUTRA'},'role-workspace'],
 ['layanan','LAYANAN_KEBERSIHAN',{unit:'PUTRA'},'role-workspace'],['media','MEDIA',{},'home-media']
];
const featureCases=[
 ['manager-kpi',4,'manajer/pendidikan-v2.html?view=kpi'],
 ['manager-findings',4,'manajer/pendidikan-v2.html?view=followup'],
 ['manager-people',4,'manajer/pendidikan-v2.html?view=teachers'],
 ['manager-coaching',4,'manajer/pendidikan-v2.html?view=coaching'],
 ['mentor-history',2,'pembinaan/mentor-usrah-v2.html?view=history'],
 ['dapur-logbook',8,'dapur/app.html?view=logbook'],
 ['dapur-checklist',8,'dapur/app.html?view=checklist'],
 ['media-targets',12,'media/target-capaian.html'],
 ['media-url',12,'admin/admin_media.html'],
 ['guru-mukim-table',4,'pendidikan/absensi-ibadah-guru.html'],
 ['counselor-queue',3,'konselor/cases-v2.html?view=incoming'],
 ['supervisor-decision',6,'supervisor/review-izin-santri.html'],
 ['director-evidence',7,'pimpinan/direktur-v2.html?view=kpi']
].map(([id,i,route])=>[id,...cases[i].slice(1),route]);
const suite=process.env.UI_FEATURES==='1'?featureCases:cases;
const dbModule=`export const getDatabase=()=>({}),ref=(d,p='')=>({p}),query=(r,...q)=>r,orderByChild=()=>({}),orderByKey=()=>({}),equalTo=()=>({}),startAt=()=>({}),endAt=()=>({}),limitToLast=()=>({});export async function get(r){window.__uiReads.push(r.p);return{val:()=>null,exists:()=>false,forEach:()=>{}}}export const set=async()=>{throw Error('fixture write blocked')},update=set,remove=set,push=()=>({key:'fixture'}),onValue=(r,fn)=>{fn({val:()=>null,exists:()=>false});return()=>{}},off=()=>{},runTransaction=async()=>({committed:false}),serverTimestamp=()=>0;`;
async function fixture(browser,origin,entry,width){
 const [id,role,assignment,home,feature]=entry;
 const user={uid:'visual-fixture',username:'visual-fixture',nama:role==='SUPERVISOR'?'Ummi dr. Hj. Dini Indriani, MARS':'Muhammad Zaky',roleSystemVersion:2,roles:[role],defaultRole:role,assignments:{[role]:assignment}};
 const c=await browser.newContext({viewport:{width,height:720},serviceWorkers:'block'});
 await c.addInitScript(u=>{localStorage.setItem('cahayaCurrentUser',JSON.stringify(u));window.__uiReads=[];const snap={val:()=>null,exists:()=>false,forEach:()=>{}};const ref=p=>({once:async()=>{window.__uiReads.push(p);return snap},on:(e,fn)=>fn(snap),off(){},set:async()=>{throw Error('fixture write blocked')},update:async()=>{throw Error('fixture write blocked')},orderByChild(){return this},equalTo(){return this},startAt(){return this},endAt(){return this},limitToLast(){return this}});const auth={currentUser:{uid:u.uid},onAuthStateChanged:fn=>{setTimeout(()=>fn(auth.currentUser),10);return()=>{}},signOut:async()=>{}};window.firebase={apps:[{}],initializeApp:()=>({}),auth:()=>auth,database:()=>({ref}),firestore:()=>({collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>u})})})})}},user);
 await c.route('**/*',r=>{const url=r.request().url();if(before&&/\/(js|css)\/cahaya-ui-v2\.(js|css)/.test(url))return r.fulfill({contentType:url.includes('.css')?'text/css':'text/javascript',body:''});if(url.startsWith(origin))return r.continue();return r.fulfill({contentType:'text/javascript',body:url.includes('firebase-app.js')?'export const initializeApp=()=>({}),getApps=()=>[],getApp=()=>({});':url.includes('firebase-database.js')?dbModule:''})});
 const p=await c.newPage();await p.goto(origin+'/main-dashboard.html');try{await p.waitForFunction(h=>document.getElementById('contentFrame')?.src.includes(h),home)}catch(error){console.error(id,await p.locator('#contentFrame').getAttribute('src'));throw error}
 if(feature){await p.locator('#contentFrame').contentFrame().locator('body').waitFor();await p.waitForTimeout(250);const menu={
 'manager-kpi':'menu-kpi-manajer','manager-findings':'menu-tindak-akademik','manager-people':'menu-guru-pondok','manager-coaching':'menu-pembinaan-guru',
 'mentor-history':'menu-mentoring-usrah','dapur-logbook':'menu-dashboard-operasional','dapur-checklist':'menu-dashboard-operasional','media-targets':'menu-dashboard-operasional','media-url':'menu-media','guru-mukim-table':'menu-absensi-ibadah-guru','counselor-queue':'menu-kasus-masuk','supervisor-decision':'menu-supervisor-v2','director-evidence':'menu-kpi-direktur'
 }[id];await p.evaluate(({route,menu})=>window.loadPage(route,document.getElementById(menu)),{route:feature,menu});try{await p.waitForFunction(route=>document.getElementById('contentFrame')?.src.includes(route.split('?')[0]),feature)}catch(e){console.error(id,'feature target',await p.locator('#contentFrame').getAttribute('src'));throw e}}
 const frame=p.locator('#contentFrame').contentFrame();await frame.locator('body').waitFor();if(!before)await frame.locator('html.cahaya-v2').waitFor();await p.waitForTimeout(feature?700:250);
 const dims=await frame.locator('html').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,reads:window.__uiReads,ui:el.classList.contains('cahaya-v2')}));
 await p.screenshot({path:path.join(out,`${before?'before':'after'}-${id}-${width}.png`),fullPage:true});
 if(!before){assert(dims.ui,`${id}: design layer loaded`);assert(dims.scroll<=dims.width,`${id}: frame overflow ${JSON.stringify(dims)}`);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${id}: shell overflow`);assert.equal(await p.locator('#mobileBottomNav').count(),1)}
 const overflow=await frame.locator('body').evaluate(()=>[...document.querySelectorAll('button,input:not([type=radio]):not([type=checkbox]),select,textarea')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&!el.closest('.ui-table-scroll')&&(r.left< -1||r.right>innerWidth+1)}).map(el=>({tag:el.tagName,id:el.id,class:el.className})).slice(0,10));
 if(!before)assert.deepEqual(overflow,[],`${id}: interactive element extends outside viewport`);
 if(feature&&id==='manager-coaching'&&!before){await frame.locator('[data-coach]').first().click();await frame.locator('#sheet.open').waitFor();await p.screenshot({path:path.join(out,`after-manager-modal-${width}.png`)});const bounds=await frame.locator('.me-sheet').boundingBox();assert(bounds.width<=width);await frame.locator('#closeSheet').click();assert.equal(await frame.locator('#sheet.open').count(),0)}
 if(feature&&id==='media-url'&&!before){await frame.locator('body').evaluate(()=>{void window.CahayaUIV2.confirm({title:'Hapus tautan media?',message:'Konfirmasi visual fixture. Tidak ada data yang dihapus.',confirmLabel:'Hapus Tautan',danger:true}).then(value=>window.__confirmResult=value)});await frame.locator('.ui-confirm').waitFor();await p.screenshot({path:path.join(out,`after-confirmation-${width}.png`)});await frame.getByRole('button',{name:'Tutup konfirmasi'}).click();assert.equal(await frame.locator('body').evaluate(()=>window.__confirmResult),false);assert.equal(await frame.locator('.ui-confirm').count(),0)}
 if(!feature&&!before){await frame.locator('body').evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await p.screenshot({path:path.join(out,`after-${id}-${width}-bottom.png`)});assert.equal(await p.locator('#mobileBottomNav [aria-current="page"]').count(),1,`${id}: exactly one current Home tab`)}
 const result={id,width,...dims,overflow};await c.close();return result;
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const results=[];try{for(const width of [409,456,1440])for(let i=0;i<suite.length;i+=3){results.push(...await Promise.all(suite.slice(i,i+3).map(entry=>fixture(browser,origin,entry,width))));console.log(`Views ${width}: ${Math.min(i+3,suite.length)}/${suite.length}`)}fs.writeFileSync(path.join(out,`${before?'before':'after'}-${process.env.UI_FEATURES?'features-':''}results.json`),JSON.stringify(results,null,2));console.log('global-ui-v2-browser: ok')}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
