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
  const report=options.report||{r1:{tanggal:'2026-10-30',dilaporkan:'Ali',tipe:'Lapor Pelanggaran',kodePelanggaran:'KEDISIPLINAN',keterangan:'Terlambat',unit:'PUTRA'}};
  const warnings={w1:{idSP:'w1',namaSantri:'Ali',jenisSP:1,usrah:'Usrah 1',tanggal:'2026-10-30',deskripsiPelanggaran:'Terlambat',dibuatPada:1}};
  const data={
    'cahaya_app/master_usrah/Usrah 1':options.roster||['Ali'],
    [C.ROOT]:report,
    'cahaya_app/buku_kasus_konselor':options.book||{},
    'cahaya_app/surat_peringatan_santri':warnings
  };
  const api={getDatabase:()=>({}),ref:(_,p='/')=>({path:p}),get:async target=>{readPaths.push(target.path);if(target.path===options.delayPath)await loadGate;if(target.path===options.rejectPath)throw Error('mock-index-denied');return{val:()=>data[target.path]||{},exists:()=>Boolean(data[target.path])}},set:async()=>{},update:async()=>{},remove:async()=>{},push:()=>({key:'new'}),query:target=>target,orderByChild:()=>()=>{},startAt:()=>()=>{},endAt:()=>()=>{},limitToLast:()=>()=>{},runTransaction:async()=>({committed:true,snapshot:{val:()=>({})}})};
  const window={CahayaCounselorFirebaseV3:api,CahayaCounselorCaseV2:C,CahayaCounselorSimplifiedV3:M,CahayaRoleSystemV2:R,cahayaRoleContext:{assertCurrent(){},usrahKeys(){return['Usrah 1']}},CAHAYA_CONFIG:{}};
  const listeners={};
  const document={body:{dataset:{}},getElementById:element,querySelectorAll:()=>[],addEventListener(name,handler){(listeners[name]??=[]).push(handler)},dispatch(name,event){for(const handler of listeners[name]||[])handler(event)}};
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
  assert.match(element('bookStudents').innerHTML,/Muat Arsip Lengkap/);
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
test('Evaluasi perbandingan menampilkan dashboard dan empat periode dari sumber yang sama',async()=>{
  const {element,context}=surface('evaluation');
  vm.runInNewContext("periodMode='WEEK_4';loadEvaluation()",context);
  await new Promise(setImmediate);
  assert.match(element('comparisonPanel').innerHTML,/Perbandingan 4 Pekan Terakhir/);
  assert.equal((element('comparisonPanel').innerHTML.match(/class="ks-comparison-table-row"/g)||[]).length,4);
  assert.doesNotMatch(element('comparisonPanel').innerHTML,/class="ks-comparison-row"/,'baris tabel tidak boleh memakai class kartu perbandingan lama');
  assert.match(element('evalMetrics').innerHTML,/Total Kasus/);
  assert.match(element('trendChart').innerHTML,/ks-line-chart/);
  assert.match(element('comparisonPanel').innerHTML,/Persentase Selesai/);
  assert.equal(element('evalMetrics').hidden,false);
  vm.runInNewContext("periodMode='MONTH_4';loadEvaluation()",context);
  await new Promise(setImmediate);
  assert.match(element('comparisonPanel').innerHTML,/Perbandingan 4 Bulan Terakhir/);
  assert.equal((element('comparisonPanel').innerHTML.match(/class="ks-comparison-table-row"/g)||[]).length,4);
});
test('dashboard empat bulan menghitung kasus dan santri unik tanpa menggandakan lintas periode',async()=>{
  const proven=(tanggal,dilaporkan,kodePelanggaran)=>({tanggal,dilaporkan,unit:'PUTRA',tipe:'Lapor Pelanggaran',kodePelanggaran,caseV2:{status:'SELESAI',tabayyun:{conclusion:'TERBUKTI'}}});
  const report={r1:proven('2026-09-10','Ali','ALFA'),r2:proven('2026-10-10','Ali','TERLAMBAT'),r3:proven('2026-10-12','Budi','ALFA'),r4:{...proven('2026-10-13','Budi','ALFA'),caseV2:{status:'MENUNGGU',tabayyun:{conclusion:'BELUM_CUKUP_BUKTI'}}}};
  const {element,context}=surface('evaluation',{report,roster:['Ali','Budi']});
  element('periodDate').value='2026-10-30';
  vm.runInNewContext("periodMode='MONTH_4';loadEvaluation()",context);
  await new Promise(setImmediate);
  assert.match(element('evalMetrics').innerHTML,/Total Kasus<\/span><b>3<\/b>/);
  assert.match(element('evalMetrics').innerHTML,/Santri Terlibat<\/span><b>2<\/b>/);
  assert.match(element('topTypes').innerHTML,/ALFA/);
  assert.match(element('topStudents').innerHTML,/Ali/);
  assert.equal((element('comparisonPanel').innerHTML.match(/class="ks-comparison-table-row"/g)||[]).length,4);
  assert.match(element('trendChart').innerHTML,/Sep 2026: 1 kasus/);
});
test('halaman Kasus Masuk mulai membaca dan merender data, tanpa tertahan pada pesan awal',async()=>{
  const {element}=surface('cases');
  await new Promise(setImmediate);
  assert.match(element('state').textContent,/kasus ditampilkan/);
  assert.match(element('caseList').innerHTML,/Ali/);
});
test('dua kasus santri yang sama tampil satu baris dan dipilih tanpa kasus santri lain',async()=>{
  const report={r1:{tanggal:'2026-10-30',dilaporkan:'Ali',tipe:'Lapor Pelanggaran',kodePelanggaran:'KEDISIPLINAN',keterangan:'Terlambat Subuh',unit:'PUTRA'},r2:{tanggal:'2026-10-29',dilaporkan:'Ali',tipe:'Lapor Pelanggaran',kodePelanggaran:'KEDISIPLINAN',keterangan:'Terlambat Zuhur',unit:'PUTRA'},r3:{tanggal:'2026-10-30',dilaporkan:'Budi',tipe:'Lapor Pelanggaran',kodePelanggaran:'KEDISIPLINAN',keterangan:'Terlambat Maghrib',unit:'PUTRA'}};
  const {element,document,context}=surface('cases',{report,roster:['Ali','Budi']});
  await new Promise(setImmediate);
  const list=element('caseList').innerHTML;
  assert.equal((list.match(/class="ks-case-row"/g)||[]).length,2);
  assert.match(list,/2 kasus/);
  assert.match(list,/data-group-detail="0"/);
  assert.doesNotMatch(list,/Terlambat Zuhur/,'rincian banyak kasus dimuat saat kelompok dibuka');
  const details=vm.runInNewContext('caseItemsMarkup(visibleGroups[0].cases)',context);
  assert.match(details,/Terlambat Subuh/);
  assert.match(details,/Terlambat Zuhur/);
  document.dispatch('change',{target:{matches:selector=>selector==='[data-case-group]',dataset:{caseGroup:'0'},checked:true,id:''}});
  assert.equal(element('processBtn').disabled,false);
  assert.equal(element('selectionCount').textContent,'(2 kasus)');
  vm.runInNewContext('startProcessing()',context);
  assert.equal(vm.runInNewContext('processing.length',context),2);
  assert.equal(vm.runInNewContext('new Set(processing.map(c=>c.id)).size',context),2);
  assert.equal(vm.runInNewContext('processing.every(c=>c.student===\'Ali\')',context),true);
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

test('Buku Konseling tidak mengunduh riwayat 2019 sejak awal; arsip lengkap tetap dapat diminta',async()=>{
 const report={r1:{tanggal:'2026-10-28',dilaporkan:'Ali',tipe:'Lapor Pelanggaran',unit:'PUTRA',kodePelanggaran:'TERLAMBAT',caseV2:{status:'SELESAI',tabayyun:{conclusion:'TERBUKTI'},counseling:{s1:{what:'Tepat waktu',savedAt:'2026-10-28T02:00:00Z',how:'Alarm'}}}}};
 const book={older:{santri:'Ali',sumberCaseId:'older',tanggalPenindakan:'2026-06-01',kodePelanggaran:'ALFA',status:'SELESAI',unit:'PUTRA'}};
 const {element,context,readPaths}=surface('book',{report,book});
 await new Promise(setImmediate);
 assert(readPaths.includes('cahaya_app/buku_kasus_konselor'));
 assert(!readPaths.includes(C.ROOT),'awal Buku Konseling harus memakai indeks riwayat, bukan semua laporan');
 assert(!readPaths.includes(C.PROGRAM_ATTENDANCE_ROOT));
 assert(!readPaths.includes(C.LEARNING_ATTENDANCE_ROOT));
 assert.match(element('bookStudents').innerHTML,/Ali/);
 assert.match(element('state').textContent,/catatan terindeks/);
 await vm.runInNewContext('loadBookArchive()',context);
 assert(readPaths.includes(C.ROOT));
 assert(readPaths.includes(C.PROGRAM_ATTENDANCE_ROOT));
 assert(readPaths.includes(C.LEARNING_ATTENDANCE_ROOT));
 assert.equal(vm.runInNewContext('bookArchiveLoaded',context),true);
 assert.match(element('state').textContent,/arsip lengkap/);
 assert.match(element('bookStudents').innerHTML,/2 catatan konseling/);
 await vm.runInNewContext('loadBookArchive()',context);
 assert.equal(readPaths.filter(x=>x===C.ROOT).length,1,'membuka ulang tidak mengunduh arsip lagi');
});
test('Bila indeks Buku Konseling gagal, opsi arsip lengkap tetap tersedia',async()=>{
 const report={r1:{tanggal:'2026-10-28',dilaporkan:'Ali',tipe:'Lapor Pelanggaran',unit:'PUTRA',kodePelanggaran:'ALFA',caseV2:{status:'SELESAI',tabayyun:{conclusion:'TERBUKTI'},counseling:{s1:{what:'Disiplin',savedAt:'2026-10-28T02:00:00Z'}}}}};
 const {context,element}=surface('book',{report,rejectPath:'cahaya_app/buku_kasus_konselor'});
 await new Promise(setImmediate);
 assert.match(element('state').textContent,/Muat Arsip Lengkap/);
 await vm.runInNewContext('loadBookArchive()',context);
 assert.match(element('bookStudents').innerHTML,/Ali/);
 assert.equal(vm.runInNewContext('bookArchiveLoaded',context),true);
});
