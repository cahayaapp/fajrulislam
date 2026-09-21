// Actual staff chat controller + isolated in-memory Firebase; no external traffic.
'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {profile,assignments}=require('./role-menu-v2-fixtures.cjs'),root=path.resolve(__dirname,'..');
const user={...profile('MENTOR_USRAH'),label:'Pengguna Uji',roles:['MENTOR_USRAH','GURU_PONDOK'],assignments:{MENTOR_USRAH:assignments.MENTOR_USRAH,GURU_PONDOK:assignments.GURU_PONDOK}};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{const c=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});await c.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.fulfill({contentType:'text/javascript',body:''}));
await c.addInitScript(user=>{
  if(top===window&&!sessionStorage.getItem('release-chat')){localStorage.clear();localStorage.setItem('cahayaCurrentUser',JSON.stringify(user));sessionStorage.setItem('release-chat','1')}
  const store={},watchers=new Set();let sequence=0;
  const t=window.__chatTest={reads:[],writes:[],off:0,failUsers:false,failInbox:false,failSend:false,store,watchers};
  const get=p=>p.split('/').filter(Boolean).reduce((v,k)=>v?.[k],store)??null;
  const snap=p=>({val:()=>get(p),exists:()=>get(p)!==null,forEach(fn){Object.entries(get(p)||{}).forEach(([key,val])=>fn({key,val:()=>val}))}});
  function put(p,v){const bits=p.split('/').filter(Boolean),key=bits.pop();let node=store;for(const b of bits)node=node[b]??={};node[key]=v}
  const emit=paths=>{for(const w of watchers)if(paths.some(p=>p.startsWith(w.path)||w.path.startsWith(p)))queueMicrotask(()=>{if(watchers.has(w))w.fn(snap(w.path))})};
  t.seed=(p,v)=>{put(p,v);emit([p])};
  async function write(updates){const paths=Object.keys(updates);if(paths.some(p=>!/^cahaya_app\/pesan_(global|meta|inbox|dibaca)\//.test(p)))throw Error('Non-message writes forbidden in fixture');if(t.failSend&&paths.some(p=>p.startsWith('cahaya_app/pesan_global/')))throw Error('SIMULATED_PRIVATE_BACKEND_ERROR');paths.forEach(p=>{put(p,updates[p]);t.writes.push(p)});emit(paths)}
  const database={ref(path=''){const q={key:path.split('/').pop(),once:async()=>{t.reads.push(path);return snap(path)},on(event,fn,error){t.reads.push(path);if(t.failInbox&&path.includes('/pesan_inbox/')){queueMicrotask(()=>error(Error('SIMULATED_DATABASE_ERROR')));return}const w={path,fn};watchers.add(w);queueMicrotask(()=>{if(watchers.has(w))fn(snap(path))})},off(event,fn){for(const w of watchers)if(w.path===path&&(!fn||fn===w.fn)){watchers.delete(w);t.off++}},set:v=>write({[path]:v}),update:v=>write(Object.fromEntries(Object.entries(v).map(([k,x])=>[(path?path+'/':'')+k,x]))),push:()=>database.ref(path+'/fixture-'+(++sequence))};for(const key of ['orderByChild','orderByKey','equalTo','startAt','endAt','limitToLast','limitToFirst'])q[key]=()=>q;return q}};
  const auth={currentUser:{uid:user.uid,email:user.username+'@cahayaapp.id'},onAuthStateChanged:fn=>{setTimeout(()=>fn(auth.currentUser),0);return ()=>{}},signOut:async()=>{}};
  const contact={username:'director-fixture',label:'Direktur Uji',roleSystemVersion:2,roles:['DIREKTUR'],defaultRole:'DIREKTUR',assignments:{DIREKTUR:{unit:'ALL'}}};
  const collection=p=>({doc:id=>({get:async()=>({exists:true,data:()=>user}),set:async()=>{throw Error('Profile write not part of chat test')}}),get:async()=>{t.reads.push('users');if(t.failUsers)throw Error('SIMULATED_USERS_ERROR');return{forEach:fn=>[user,contact].forEach(x=>fn({data:()=>x}))}}});
  window.firebase={apps:[{}],initializeApp:()=>({}),auth:()=>auth,database:()=>database,firestore:()=>({collection}),messaging:()=>({})};window.firebase.firestore.FieldValue={serverTimestamp:()=>0};
},user);
const p=await c.newPage(),errors=[],dialogs=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss()});await p.goto(origin+'/main-dashboard.html');await p.waitForSelector('#menu-chat');
assert.deepEqual(await p.evaluate(()=>__chatTest.reads),[],'Home never starts messaging reads');
// Master-user failure: no swallowed error, visible retry, no raw backend detail.
await p.evaluate(()=>{__chatTest.failUsers=true;openAuthorizedMenu('menu-chat')});await p.locator('#retryCahayaMessages').waitFor();assert(!await p.locator('#viewInbox').textContent().then(x=>/SIMULATED|Firebase/.test(x)));
await p.evaluate(()=>__chatTest.failUsers=false);await p.locator('#retryCahayaMessages').click();await p.locator('#viewInbox').getByText('Direktur Uji',{exact:true}).waitFor();assert(await p.locator('#viewInbox').getByText('Belum Ada Pesan').isVisible());
assert.equal(await p.evaluate(()=>__chatTest.watchers.size),3,'only one inbox/read/notification subscription set');
// Contact canonical roles are understood, original private-room contract reused.
await p.locator('#viewInbox').getByText('Direktur Uji',{exact:true}).click();await p.locator('#pChatInput').fill('[UJI TEKNIS] pesan fixture');await p.locator('#pwSendButton').click();await p.locator('#pChatBody').getByText('[UJI TEKNIS] pesan fixture',{exact:true}).waitFor();
const room=await p.evaluate(()=>Object.keys(__chatTest.store.cahaya_app.pesan_global)[0]);assert(room);assert.equal(await p.evaluate(()=>Object.keys(__chatTest.store.cahaya_app.pesan_global).length),1);
assert.equal(await p.locator('#pChatInput').inputValue(),'');
// Failure retains draft, never reveals private error details.
await p.evaluate(()=>__chatTest.failSend=true);await p.locator('#pChatInput').fill('Draft tetap tersimpan di isian');await p.locator('#pwSendButton').click();await p.waitForFunction(()=>!document.getElementById('pwSendButton').disabled);assert.equal(await p.locator('#pChatInput').inputValue(),'Draft tetap tersimpan di isian');assert(dialogs.some(x=>x==='Pesan belum dapat dikirim. Periksa koneksi lalu coba lagi.'));assert(!dialogs.some(x=>/SIMULATED|Firebase/.test(x)));
await p.evaluate(()=>{__chatTest.failSend=false;showPengurusChatList()});
// Incoming unread + preview survive opening the same thread.
await p.evaluate(room=>{const message={id:'incoming',roomId:room,teks:'Balasan fixture',senderUsername:'director-fixture',pengirim:'Direktur Uji',waktu:'2099-01-01T00:00:00Z'};__chatTest.seed('cahaya_app/pesan_global/'+room+'/incoming',message);__chatTest.seed('cahaya_app/pesan_inbox/navigation-fixture/'+room,{roomId:room,peerUsername:'director-fixture',peerLabel:'Direktur Uji',peerRoles:['direktur'],updatedAt:message.waktu,lastMessage:message})},room);
await p.locator('#viewInbox .pw-unread-count').waitFor();await p.locator('#viewInbox').getByText('Direktur Uji',{exact:true}).click();await p.locator('#pChatBody').getByText('Balasan fixture',{exact:true}).waitFor();await p.waitForFunction(room=>__chatTest.store.cahaya_app.pesan_dibaca['navigation-fixture']?.[room],room);
await p.evaluate(()=>showPengurusChatList());assert.equal(await p.evaluate(room=>__chatTest.store.cahaya_app.pesan_inbox['navigation-fixture'][room].lastMessage?.teks,room),'Balasan fixture','opening thread preserves last-message preview');
// A → B → A: stop all prior listeners, clear draft; same room remains.
await p.evaluate(()=>chooseCahayaGlobalRole('GURU_PONDOK'));assert.equal(await p.evaluate(()=>__chatTest.watchers.size),0);assert.equal(await p.locator('#pChatInput').inputValue(),'');
await p.evaluate(()=>chooseCahayaGlobalRole('MENTOR_USRAH'));await p.evaluate(()=>openAuthorizedMenu('menu-chat'));await p.locator('#viewInbox').getByText('Direktur Uji',{exact:true}).waitFor();await p.locator('#viewInbox').getByText('Direktur Uji',{exact:true}).click();assert.equal(await p.evaluate(()=>Object.keys(__chatTest.store.cahaya_app.pesan_global).length),1);
// Inbox failure has a functioning retry and no duplicated subscriptions.
await p.evaluate(async()=>{await chooseCahayaGlobalRole('GURU_PONDOK');__chatTest.failInbox=true;openAuthorizedMenu('menu-chat')});await p.locator('#retryCahayaMessages').waitFor();await p.evaluate(()=>__chatTest.failInbox=false);await p.locator('#retryCahayaMessages').click();await p.locator('#viewInbox').getByText('Direktur Uji',{exact:true}).waitFor();assert.equal(await p.evaluate(()=>__chatTest.watchers.size),3);
assert.deepEqual(errors,[]);console.log('PASS chat: lazy Home, canonical contacts, empty/failure/retry, send/read/unread, no duplicate room, A→B→A listener disposal; fixture writes only');await c.close();
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
