'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');

test('Beranda Naqib membaca rentang dua tanggal terindeks untuk koreksi UTC, bukan 250 record terakhir',()=>{
 const s=fs.readFileSync(path.join(root,'home.html'),'utf8');
 for(const p of ['absensi_program_harian','log_lapor_inisiatif']){
  assert(s.includes(`db.ref('cahaya_app/${p}').orderByChild('tanggal').startAt(dateBefore).endAt(ctx.date).once('value')`));
  assert(!s.includes(`db.ref('cahaya_app/${p}').limitToLast(250).once('value')`));
 }
});

test('Beranda Wali memakai snapshot realtime pertama tanpa once tambahan pada startup',async()=>{
 const s=fs.readFileSync(path.join(root,'wali/dashboard/beranda.html'),'utf8');
 const start=s.indexOf('  function kunciIndexSantriTimeline()');
 const end=s.indexOf('  /* =========================================================',start);
 assert(start>0&&end>start);
 const code=s.slice(start,end);
 const listeners=[],offs=[];let key='alikey',refreshes=0;
 const dbRT={ref(path){return{limitToLast(){return this},on(type,callback,onError){listeners.push({path,type,callback,onError})},off(type,callback){offs.push({path,type,callback})}}}};
 const window={CahayaWaliSession:{getStudent:()=>({}),studentName:()=> 'Ali',studentKey:()=>key,normalizeName:()=> 'Ali'}};
 const context={window,user:{},namaAnakUtuh:'Ali',dbRT,sourceWarnings:[],timelineListenerBindings:[],timelineIndexedSnapshots:{},timelineListenerSignature:'',initialTimelineReady:false,globalDB:{},parsePengaturanMedia(){},jadwalkanRefreshTimeline(){refreshes++},console,Promise,Object,Set,String};
 vm.createContext(context);
 vm.runInContext(code,context);
 let resolved=false;
 const first=vm.runInContext('pasangListenerTimeline()',context);
 first.then(()=>{resolved=true});
 assert.equal(listeners.length,11,'5 kategori x 2 key + media, tanpa request one-time duplikat');
 assert.equal(vm.runInContext('pasangListenerTimeline()',context),first,'jangan membuat ulang listener yang sama');
 assert.equal(listeners.length,11);
 for(const l of listeners.slice(0,-1))l.callback({val:()=>l.path.includes('/program')?{record1:{tanggal:'2026-10-31'}}:{}});
 await Promise.resolve();assert.equal(resolved,false,'startup menunggu seluruh snapshot pertama');
 listeners[listeners.length-1].callback({val:()=>({})});
 await first;
 assert.equal(resolved,true);
 assert(vm.runInContext('Object.keys(globalDB.program).length',context)>0);
 vm.runInContext('lepasListenerTimeline()',context);
 assert.equal(offs.length,11,'seluruh listener terlepas saat pergantian identitas');
 assert.equal(refreshes,0,'initial snapshot tidak membuat render berulang');
 key='budi';
 const second=vm.runInContext('pasangListenerTimeline()',context);
 assert.equal(listeners.length,22,'identitas baru memasang ulang listener sesuai santri');
 for(const l of listeners.slice(11))l.onError(new Error('simulated-permission'));
 await second;
});
