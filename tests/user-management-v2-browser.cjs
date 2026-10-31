const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
const legacy={username:'legacy',label:'Legacy Admin',akses:['admin','guru'],jabatan:['admin'],namaAnak:'AKBAR PRAYOGA',teacherId:'TEACHER-9',unknown:{keep:true}};
const app=`window.firebase={apps:[],initializeApp:(c,n)=>({name:n||'[DEFAULT]',auth:()=>window.__auth}),app:n=>({name:n,auth:()=>window.__auth}),firestore:()=>window.__store};`;
const auth=`window.__auth={createUserWithEmailAndPassword:async()=>({}),signOut:async()=>{}};`;
const store=`
window.__writes=[];
window.__docs={legacy:${JSON.stringify(legacy)}};
window.__store={
  collection:function(){
    return {
      get:async function(){
        return {
          forEach:function(fn){
            Object.entries(window.__docs).forEach(function(entry){
              fn({id:entry[0],data:function(){return entry[1];}});
            });
          }
        };
      },
      doc:function(id){
        return {
          set:async function(payload,opts){
            window.__writes.push({id:id,payload:payload,opts:opts});
            window.__docs[id]=Object.assign({},window.__docs[id]||{},payload);
          },
          delete:async function(){}
        };
      }
    };
  }
};`;
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{const c=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});await c.route('**/*',route=>{const u=route.request().url();if(u.startsWith(origin))return route.continue();const body=u.endsWith('firebase-app.js')?app:u.endsWith('firebase-auth.js')?auth:u.endsWith('firebase-firestore.js')?store:'';return route.fulfill({contentType:'text/javascript',body})});await c.addInitScript(()=>localStorage.setItem('cahayaCurrentUser',JSON.stringify({username:'admin',akses:['admin']})));const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto(origin+'/admin/users.html');await p.waitForFunction(()=>document.querySelectorAll('#rows tr').length===1&&!document.getElementById('loading').classList.contains('show'));
const geometry=await p.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,table:getComputedStyle(document.querySelector('table')).display}));assert.equal(geometry.width,409);assert.equal(geometry.scroll,409);assert.equal(geometry.table,'block');
if(!await p.locator('.icon-btn.edit').count())throw new Error('Edit row missing; errors='+JSON.stringify(errors)+'; body='+(await p.locator('body').innerText()).slice(0,1000));
await p.click('.icon-btn.edit');assert.equal(await p.locator('#roleGrid input').count(),15);const roleText=await p.locator('#roleGrid').innerText();for(const forbidden of ['Administrator','Observer','Muallim','Konselor Pemula','Supervisor Pendidikan'])assert(!roleText.includes(forbidden));assert.equal(await p.locator('#legacyNotice').isVisible(),true);
for(const role of ['SUPERVISOR','KONSELOR','GURU_PONDOK'])await p.check(`#roleGrid input[value="${role}"]`);await p.selectOption('#defaultRole','SUPERVISOR');await p.selectOption('[data-role="SUPERVISOR"] select','PUTRA');for(const role of ['GURU_PONDOK','NAQIB','KONSELOR','MEDIA'])await p.check(`[data-role="SUPERVISOR"] input[onchange*="'${role}'"]`);const kc=p.locator('[data-role="KONSELOR"] select');await kc.nth(0).selectOption('MADYA');await kc.nth(1).selectOption('PUTRA');await p.screenshot({path:'/tmp/manajemen-user-v2-409x720.png',fullPage:true});await p.click('#saveBtn');await p.waitForFunction(()=>window.__writes.length===1);
const write=await p.evaluate(()=>window.__writes[0]);assert.equal(write.opts.merge,true);assert.deepEqual(write.payload.roles,['SUPERVISOR','KONSELOR','GURU_PONDOK']);assert.equal(write.payload.defaultRole,'SUPERVISOR');assert.deepEqual(write.payload.assignments.SUPERVISOR.supervisedRoles,['GURU_PONDOK','NAQIB','KONSELOR','MEDIA']);for(const legacyField of ['akses','jabatan','teacherId','unknown'])assert(!(legacyField in write.payload));assert.equal(await p.evaluate(()=>window.__docs.legacy.namaAnak),'AKBAR PRAYOGA');assert.equal(await p.evaluate(()=>window.__docs.legacy.teacherId),'TEACHER-9');assert.deepEqual(errors,[]);console.log('PASS 409x720 UI, 15 canonical choices, multi-role assignments, merge-only save and legacy/Wali preservation');await c.close()}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
