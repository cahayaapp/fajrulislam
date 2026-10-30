'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const C=require('../js/counselor-case-v2.js');
const M=require('../js/counselor-simplified-v3-model.js');
const R=require('../js/role-system-v2.js');
const {profile}=require('./role-menu-v2-fixtures.cjs');
const source=fs.readFileSync(path.join(__dirname,'../js/counselor-simplified-v3.js'),'utf8');
const home=fs.readFileSync(path.join(__dirname,'../js/counselor-home-v3.js'),'utf8');
const bridge=fs.readFileSync(path.join(__dirname,'../js/counselor-firebase-compat-v3.js'),'utf8');
const user=profile('KONSELOR');
function surface(view,options={}){
  let releaseLoad=()=>{};
  const readPaths=[];
  const loadGate=options.delayPath?new Promise(resolve=>{releaseLoad=resolve}):Promise.resolve();
  const elements=new Map();
  const element=id=>{
    if(!elements.has(id))elements.set(id,{id,value:'',textContent:id==='state'?'Menyiapkan data…':'',innerHTML:'',dataset:{},hidden:false,disabled:false,checked:false,indeterminate:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return null}});
    return elements.get(id);
  };
  const report={r1:{tanggal:'2026-10-30',dilaporkan:'Ali',tipe:'Lapor Pelanggaran',kodePelanggaran:'KEDISIPLINAN',keterangan:'Terlambat',unit:'PUTRA'}};
  const warnings={w1:{idSP:'w1',namaSantri:'Ali',jenisSP:1,usrah:'Usrah 1',tanggal:'2026-10-30',deskripsiPelanggaran:'Terlambat',dibuatPada:1}};
  const data={
    'cahaya_app/master_usrah/Usrah 1':['Ali'],
    [C.ROOT]:report,
    'cahaya_app/surat_peringatan_santri':warnings
  };
  const api={getDatabase:()=>({}),ref:(_,p='/')=>({path:p}),get:async target=>{readPaths.push(target.path);if(target.path===options.delayPath)await loadGate;return{val:()=>data[target.path]||{},exists:()=>Boolean(data[target.path])}},set:async()=>{},update:async()=>{},remove:async()=>{},push:()=>({key:'new'}),query:target=>target,orderByChild:()=>()=>{},startAt:()=>()=>{},endAt:()=>()=>{},limitToLast:()=>()=>{},runTransaction:async()=>({committed:true,snapshot:{val:()=>({})}})};
  const window={CahayaCounselorFirebaseV3:api,CahayaCounselorCaseV2:C,CahayaCounselorSimplifiedV3:M,CahayaRoleSystemV2:R,cahayaRoleContext:{assertCurrent(){},usrahKeys(){return['Usrah 1']}},CAHAYA_CONFIG:{}};
  const document={body:{dataset:{}},getElementById:element,querySelectorAll:()=>[],addEventListener(){}};
  const localStorage={getItem:key=>key==='cahayaCurrentUser'?JSON.stringify(user):null};
  const context={window,document,localStorage,location:{search:'?view='+view},URLSearchParams,parent:window,history:{back(){}},console,setTimeout,clearTimeout,confirm:()=>true,Image:function(){},FileReader:function(){}};
  vm.runInNewContext(source,context,{filename:'counselor-simplified-v3.js'});
  return {element,document,context,data,releaseLoad,readPaths};
}
test('Evaluasi mulai membaca data saat roster masih memuat dan memakai cache saat tab diganti',async()=>{
  const {context,readPaths,releaseLoad}=surface('evaluation',{delayPath:'cahaya_app/master_usrah/Usrah 1'});
  await new Promise(setImmediate);
  assert(readPaths.includes(C.ROOT),'pembacaan kasus tidak boleh menunggu roster selesai');
  assert.equal(readPaths.filter(path=>path==='cahaya_app/laporan_penindakan').length,1,'hindari query ganda pada riwayat penindakan');
  releaseLoad();await new Promise(setImmediate);
  const before=readPaths.length;
  vm.runInNewContext("periodMode='MONTH';loadEvaluation()",context);
  await new Promise(setImmediate);
  vm.runInNewContext("periodMode='WEEK';loadEvaluation()",context);
  await new Promise(setImmediate);
  assert.equal(readPaths.length,before+4,'tab pekanan memakai data yang baru diambil untuk rentang yang sama');
});
test('Kasus Masuk menampilkan loading, termasuk saat filter dijalankan sebelum Firebase selesai',async()=>{
  const {element,context,releaseLoad}=surface('cases',{delayPath:C.ROOT});
  assert.match(element('caseList').innerHTML,/Memuat kasus/);
  assert.doesNotMatch(element('caseList').innerHTML,/Belum ada kasus/);
  element('caseSearch').value='Ali';
  vm.runInNewContext('renderCases()',context);
  assert.match(element('caseList').innerHTML,/Memuat kasus/);
  assert.doesNotMatch(element('state').textContent,/0 kasus/);
  releaseLoad();
  await new Promise(setImmediate);
  assert.match(element('caseList').innerHTML,/Ali/);
  assert.doesNotMatch(element('caseList').innerHTML,/Memuat kasus/);
});
test('Buku Konseling membedakan loading dari hasil benar-benar kosong',async()=>{
  const {element,context,releaseLoad}=surface('book',{delayPath:C.ROOT});
  assert.match(element('bookStudents').innerHTML,/Memuat Buku Konseling/);
  assert.match(element('bookHistory').innerHTML,/Memuat Buku Konseling/);
  vm.runInNewContext('renderBookStudents()',context);
  assert.doesNotMatch(element('bookStudents').innerHTML,/Belum ada santri/);
  releaseLoad();
  await new Promise(setImmediate);
  assert.match(element('bookStudents').innerHTML,/Belum ada santri/);
  assert.match(element('bookHistory').innerHTML,/Pilih santri/);
});
test('Surat Peringatan tetap memuat saat pencarian dilakukan sebelum data tiba',async()=>{
  const {element,context,releaseLoad}=surface('warnings',{delayPath:'cahaya_app/surat_peringatan_santri'});
  assert.match(element('warningList').innerHTML,/Memuat Surat Peringatan/);
  vm.runInNewContext('renderWarnings()',context);
  assert.doesNotMatch(element('warningList').innerHTML,/Belum ada Surat/);
  releaseLoad();
  await new Promise(setImmediate);
  assert.match(element('warningList').innerHTML,/Ali/);
});
test('Evaluasi menampilkan empat periode dan menyembunyikan ringkasan periode tunggal',async()=>{
  const {element,context}=surface('evaluation');
  vm.runInNewContext("periodMode='WEEK_4';loadEvaluation()",context);
  await new Promise(setImmediate);
  assert.match(element('comparisonPanel').innerHTML,/Perbandingan 4 Pekan Terakhir/);
  assert.equal((element('comparisonPanel').innerHTML.match(/class="ks-comparison-row"/g)||[]).length,4);
  assert.equal(element('evalMetrics').hidden,true);
  vm.runInNewContext("periodMode='MONTH_4';loadEvaluation()",context);
  await new Promise(setImmediate);
  assert.match(element('comparisonPanel').innerHTML,/Perbandingan 4 Bulan Terakhir/);
});
test('halaman Kasus Masuk mulai membaca dan merender data, tanpa tertahan pada pesan awal',async()=>{
  const {element}=surface('cases');
  await new Promise(setImmediate);
  assert.match(element('state').textContent,/kasus ditampilkan/);
  assert.match(element('caseList').innerHTML,/Ali/);
});
test('menu SP membaca riwayat dari koleksi lama dan memisahkan tampilan',async()=>{
  const {element,document}=surface('warnings');
  await new Promise(setImmediate);
  assert.equal(document.body.dataset.view,'warnings');
  assert.match(element('warningList').innerHTML,/Ali/);
  assert.match(element('warningList').innerHTML,/SP 1/);
  assert.match(element('state').textContent,/Surat Peringatan ditampilkan/);
});
test('beranda Konselor mulai membaca badge tanpa gagal pada saat inisialisasi',async()=>{
  const elements=new Map();
  const element=id=>{if(!elements.has(id))elements.set(id,{textContent:id==='incomingBadge'?'Memuat…':'',addEventListener(){}});return elements.get(id)};
  const api={getDatabase:()=>({}),ref:(_,p)=>({path:p}),get:async target=>({val:()=>target.path.endsWith('/Usrah 1')?['Ali']:{}}),query:target=>target,orderByChild:()=>()=>{},startAt:()=>()=>{},endAt:()=>()=>{}};
  const window={CahayaCounselorFirebaseV3:api,CahayaCounselorCaseV2:C,CahayaRoleSystemV2:R};
  const document={getElementById:element,addEventListener(){}};
  const localStorage={getItem:key=>key==='cahayaCurrentUser'?JSON.stringify(user):null};
  vm.runInNewContext(home,{window,document,localStorage,parent:window,location:{},console,setTimeout:()=>0,clearTimeout},{filename:'counselor-home-v3.js'});
  await new Promise(setImmediate);
  assert.equal(element('incomingBadge').textContent,'0 kasus aktif');
});
test('adapter Firebase klasik mempertahankan query dan transaksi',async()=>{
  const calls=[];
  const target={orderByChild:key=>{calls.push(['orderByChild',key]);return target},startAt:value=>{calls.push(['startAt',value]);return target},endAt:value=>{calls.push(['endAt',value]);return target},once:async event=>({val:()=>event}),on:(_,listener)=>{calls.push(['on']);listener({exists:()=>true,val:()=>({count:1})})},off:()=>calls.push(['off']),transaction:async(change,_,applyLocally)=>{calls.push(['transaction',applyLocally]);return{committed:true,snapshot:{val:()=>change({count:1})}}}};
  const db={ref:()=>target};
  const firebase={apps:[],initializeApp:()=>({database:()=>db}),database:()=>db};
  const window={firebase,CAHAYA_CONFIG:{firebase:{databaseURL:'test'}}};
  vm.runInNewContext(bridge,{window},{filename:'counselor-firebase-compat-v3.js'});
  const F=window.CahayaCounselorFirebaseV3;
  const query=F.query(F.ref(F.getDatabase(),'records'),F.orderByChild('tanggal'),F.startAt('2026-10-01'),F.endAt('2026-10-30'));
  assert.equal((await F.get(query)).val(),'value');
  const result=await F.runTransaction(query,value=>({...value,count:value.count+1}),{applyLocally:false});
  assert.equal(result.snapshot.val().count,2);
  assert(calls.some(call=>call[0]==='transaction'&&call[1]===false));
  assert.equal(calls.at(-1)[0],'off');
});
test('transaksi tabayyun menahan cache record absensi hingga transaksi selesai',async()=>{
  const calls=[];
  let cached=false;
  const record={nama:'Santri Contoh',status:'A'};
  const target={
    on:(_,listener)=>{calls.push('listen');cached=true;listener({exists:()=>true,val:()=>record})},
    off:()=>{calls.push('unlisten');cached=false},
    transaction:async change=>{
      calls.push('transaction');
      const next=change(cached?record:null);
      return{committed:next!==undefined,snapshot:{val:()=>next}};
    }
  };
  const db={ref:()=>target};
  const firebase={apps:[],initializeApp:()=>({database:()=>db}),database:()=>db};
  const window={firebase,CAHAYA_CONFIG:{firebase:{databaseURL:'test'}}};
  vm.runInNewContext(bridge,{window},{filename:'counselor-firebase-compat-v3.js'});
  const F=window.CahayaCounselorFirebaseV3;
  const result=await F.runTransaction(F.ref(F.getDatabase(),'cahaya_app/absensi_program_harian/record/data/0'),raw=>{
    if(!raw)return;
    return{...raw,statusPenanganan:'TABAYYUN'};
  },{applyLocally:false});
  assert.equal(result.committed,true);
  assert.equal(result.snapshot.val().statusPenanganan,'TABAYYUN');
  assert.deepEqual(calls,['listen','transaction','unlisten']);
});
test('transaksi tetap menolak kasus yang telah diambil konselor lain',async()=>{
  const target={
    on:(_,listener)=>listener({exists:()=>true,val:()=>({nama:'Santri Contoh',status:'A'})}),
    off:()=>{},
    transaction:async change=>{
      // Claim berubah setelah pembacaan awal, sebelum transaksi diproses server.
      const next=change({caseV2:{claim:{assignedCounselorId:'other-user'}}});
      return{committed:next!==undefined,snapshot:{val:()=>next}};
    }
  };
  const db={ref:()=>target};
  const firebase={apps:[],initializeApp:()=>({database:()=>db}),database:()=>db};
  const window={firebase,CAHAYA_CONFIG:{firebase:{databaseURL:'test'}}};
  vm.runInNewContext(bridge,{window},{filename:'counselor-firebase-compat-v3.js'});
  const F=window.CahayaCounselorFirebaseV3;
  const result=await F.runTransaction(F.ref(F.getDatabase(),'case'),raw=>{
    if(raw.caseV2.claim.assignedCounselorId!=='dandi')return;
    return{...raw,statusPenanganan:'TABAYYUN'};
  });
  assert.equal(result.committed,false);
});
test('kasus absensi menunjuk baris santri yang benar dan pesan gagal tidak menuduh konselor lain',async()=>{
  const {context,data}=surface('cases');
  const attendance=C.attendanceCases({sesi:{tanggal:'2026-10-30',program:'Piket Kebersihan Usrah Pagi',unit:'PUTRA',data:[{nama:'Santri Lain',status:'H'},{nama:'Santri Contoh',status:'A'}]}},'ABSENSI_PROGRAM');
  assert.equal(attendance.length,1);
  const c=attendance[0];
  assert.equal(c.dbPath,'cahaya_app/absensi_program_harian/sesi/data/1');
  context.testCase=c;
  data[c.dbPath]={nama:'Santri Contoh',status:'A'};
  assert.equal(vm.runInNewContext('caseRowMatches(testCase,{nama:"Santri Contoh",status:"A"})',context),true);
  assert.equal(vm.runInNewContext('caseRowMatches(testCase,{nama:"Santri Lain",status:"A"})',context),false);
  assert.match(await vm.runInNewContext('caseWriteFailure(testCase)',context),/Kasus masih tersedia/);
});
