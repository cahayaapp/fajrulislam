const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const handlers={},removed=[],fetches=[],messages=[];
const cache={match:async()=>({old:true}),put:async()=>{}};
const c={self:{addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{},matchAll:async()=>[{postMessage:m=>messages.push(m)}]},location:{origin:'https://example.test'}},caches:{keys:async()=>['cahaya-static-v168','cahaya-static-v296','other-data'],delete:async k=>removed.push(k),open:async()=>cache},importScripts(){},firebase:{initializeApp(){},messaging:()=>({onBackgroundMessage(){}})},fetch:async(request,options)=>{fetches.push({request,options});return{ok:true,clone:()=>({})}},URL,console};vm.createContext(c);vm.runInContext(fs.readFileSync('firebase-messaging-sw.js','utf8'),c);
(async()=>{
 let activation;handlers.activate({waitUntil:p=>activation=p});await activation;
 assert.deepEqual(removed,['cahaya-static-v168']);assert.equal(messages[0].build,'v296');
 let response;handlers.fetch({request:{method:'GET',url:'https://example.test/home-guru.html?v=296',mode:'navigate'},respondWith:p=>response=p});await response;
 assert.equal(fetches[0].options.cache,'no-cache','HTML must revalidate the browser HTTP cache');
 const source=fs.readFileSync('main-dashboard.html','utf8');
 const block=source.slice(source.indexOf("      if (activeRoleForPage !== 'admin') {",source.indexOf('// A Home release')),source.indexOf("      if (canonicalRoleRuntime && activeRoleForPage === 'WALI_SANTRI'",source.indexOf('// A Home release')));
 function route(url,role){const x={url,activeRoleForPage:role,URL,location:{href:'https://example.test/main-dashboard.html'}};vm.createContext(x);vm.runInContext(block,x);return x.url}
 const next=new URL(route('home-guru.html?v=201&openSchedule=1','GURU_PONDOK'),'https://example.test/');
 assert.equal(next.searchParams.get('v'),'296');assert.equal(next.searchParams.get('openSchedule'),'1');
 assert.equal(route('admin/database.html?v=278','admin'),'admin/database.html?v=278');
 assert.equal(route('guru/absensiPembelajaran.html?v=198','GURU_PONDOK'),'guru/absensiPembelajaran.html?v=198');
 for(const file of ['main-dashboard.html','firebase-messaging-sw.js','js/cahaya-push-global-v68.js','index.html'])assert.equal(fs.readFileSync(file,'utf8'),fs.readFileSync('docs/'+file,'utf8'));
 console.log('PASS release iframe URL, action parameters, cache retirement, HTTP revalidation, admin isolation and mirrors');
})().catch(e=>{console.error(e);process.exitCode=1});
