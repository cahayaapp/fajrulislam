'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../js/counselor-simplified-v3-model.js');
const C=require('../js/counselor-case-v2.js');
const R=require('../js/role-system-v2.js');
const N=require('../js/role-navigation-v2.js');
const Menu=require('../js/role-menu-v2.js');
const {profile}=require('./role-menu-v2-fixtures.cjs');
function row(id,student,date,options={}){
 const raw={tanggal:date,dilaporkan:student,tipe:'Lapor Pelanggaran',kodePelanggaran:options.code||'TERLAMBAT',statusPenanganan:options.status||'SELESAI',caseV2:{status:options.status||'SELESAI',tabayyun:options.conclusion?{conclusion:options.conclusion}:undefined,counseling:options.counseling||undefined,clearance:options.clearance}};
 return C.normalizeCase(raw,id);
}
test('periode Senin–Minggu dan bulan kalender',()=>{
 assert.deepEqual(M.period('WEEK','2026-10-29'),{mode:'WEEK',start:'2026-10-26',end:'2026-11-01'});
 assert.deepEqual(M.period('MONTH','2026-10-29'),{mode:'MONTH',start:'2026-10-01',end:'2026-10-31'});
});
test('perbandingan empat pekan dan empat bulan mengikuti periode kalender tanpa celah',()=>{
 const weeks=M.comparisonPeriods('WEEK','2026-10-30');
 assert.deepEqual(weeks.map(x=>[x.start,x.end]),[['2026-10-05','2026-10-11'],['2026-10-12','2026-10-18'],['2026-10-19','2026-10-25'],['2026-10-26','2026-11-01']]);
 const months=M.comparisonPeriods('MONTH','2027-01-08');
 assert.deepEqual(months.map(x=>[x.start,x.end]),[['2026-10-01','2026-10-31'],['2026-11-01','2026-11-30'],['2026-12-01','2026-12-31'],['2027-01-01','2027-01-31']]);
});
test('tanggal kejadian memakai zona Jakarta saat hanya ada timestamp',()=>{
 assert.equal(M.occurrenceDate({raw:{waktu:'2026-10-29T18:30:00Z'}}),'2026-10-30');
 assert.equal(M.occurrenceDate({raw:{tanggal:'2026-10-29',waktu:'2026-10-29T18:30:00Z'}}),'2026-10-29');
});
test('evaluasi hanya kasus terbukti, kelompok satu kejadian per record dan unik santri',()=>{
 const cases=[row('a','Ali','2026-10-29',{conclusion:'TERBUKTI'}),row('b','Ali','2026-10-29',{conclusion:'TERBUKTI',code:'ALFA'}),row('c','Budi','2026-10-29',{conclusion:'BELUM CUKUP BUKTI',status:'DIESKALASI'}),row('d','Cici','2026-10-29',{conclusion:'TIDAK_TERBUKTI',status:'DIHAPUS',clearance:{clearedAt:'2026-10-29T10:00:00Z'}}),row('e','Dedi','2026-11-02',{conclusion:'TERBUKTI'})];
 const result=M.evaluation([...cases,cases[0]],M.period('WEEK','2026-10-29'));
 assert.equal(result.total,2);assert.equal(result.students,1);assert.equal(result.kinds,2);assert.equal(result.finished,2);assert.equal(result.studentRows[0].count,2);assert.equal(result.trend.reduce((n,x)=>n+x.count,0),2);
});
test('perbandingan memakai kasus terbukti pada pekan masing-masing',()=>{
 const cases=[row('a','Ali','2026-10-05',{conclusion:'TERBUKTI'}),row('b','Budi','2026-10-12',{conclusion:'TERBUKTI'}),row('c','Cici','2026-10-12',{conclusion:'TERBUKTI'}),row('d','Dedi','2026-10-19',{conclusion:'TIDAK_TERBUKTI',status:'DIHAPUS',clearance:{clearedAt:'2026-10-20'}})];
 const totals=M.comparisonPeriods('WEEK','2026-10-30').map(period=>M.evaluation(cases,period).total);
 assert.deepEqual(totals,[1,2,0,0]);
});
test('sumber lama tetap terbaca dan absensi yang sudah ditindak tidak muncul ulang',()=>{
 const reports={r1:{tanggal:'2026-10-29',dilaporkan:'Ali',tipe:'Lapor Pelanggaran',kodePelanggaran:'KETERTIBAN'}};
 const program={p1:{tanggal:'2026-10-29',unit:'PUTRA',statusFinalisasi:'FINAL',program:'Shalat Subuh',data:[{nama:'Budi',statusFinal:'ALFA'}]}};
 const learning={k1:{tanggal:'2026-10-29',unit:'PUTRA',statusFinalisasi:'FINAL',mapel:'Bahasa Arab',data:[{nama:'Cici',statusFinal:'TERLAMBAT'}]}};
 const rows=M.sourceCases(reports,program,learning,[{sumberCaseId:'PROGRAM-p1-0'}]);
 assert.deepEqual(rows.map(x=>x.id).sort(),['LEARNING-k1-0','r1']);
 assert.equal(rows.find(x=>x.id==='LEARNING-k1-0').code,'TERLAMBAT');
 const cleared=M.sourceCases({r1:{...reports.r1,excludedFromViolation:true,caseV2:{status:'DIHAPUS',clearance:{clearedAt:'2026-10-29'}}}}, {}, {}, []);
 assert.equal(cleared.length,1);assert.equal(M.proven(cleared[0]),false);
});
test('buku menggabungkan konseling kelompok per santri dan menolak kasus dibersihkan',()=>{
 const counsel={g1:{groupSessionId:'g1',what:'Disiplin',why:'Tanggung jawab',how:'Alarm',consequence:'Tidak Ada',savedAt:'2026-10-29T12:00:00Z'}};
 const cases=[row('a','Ali','2026-10-29',{conclusion:'TERBUKTI',counseling:counsel}),row('b','Ali','2026-10-29',{conclusion:'TERBUKTI',counseling:counsel}),row('c','Budi','2026-10-29',{conclusion:'TIDAK_TERBUKTI',status:'DIHAPUS',clearance:{clearedAt:'2026-10-29T12:00:00Z'}})];
 const book=M.bookEntries(cases,{'case_a':{santri:'Ali',sumberCaseId:'a'},'case_c':{santri:'Budi',sumberCaseId:'c'}});
 assert.equal(book.length,1);assert.deepEqual(book[0].caseIds,['a','b']);assert.equal(book[0].what,'Disiplin');
});
test('Buku Konseling menampilkan status absensi bersama nama program dan mapel',()=>{
 const counseling={s1:{what:'Tepat waktu',savedAt:'2026-10-30T05:00:00Z'}};
 const programs={p1:{tanggal:'2026-10-30',unit:'PUTRA',statusFinalisasi:'FINAL',program:"Sholat Zuhur Berjama'ah",data:[{nama:'Ali',statusFinal:'ALFA',caseV2:{status:'SELESAI',tabayyun:{conclusion:'TERBUKTI'},counseling}}]}};
 const learning={k1:{tanggal:'2026-10-30',unit:'PUTRA',statusFinalisasi:'FINAL',mapel:'Bahasa Arab',data:[{nama:'Budi',statusFinal:'TERLAMBAT',caseV2:{status:'SELESAI',tabayyun:{conclusion:'TERBUKTI'},counseling}}]}};
 const book=M.bookEntries(M.sourceCases({},programs,learning));
 assert.equal(book.find(x=>x.student==='Ali').cases[0],"ALFA SHOLAT ZUHUR BERJAMA'AH");
 assert.equal(book.find(x=>x.student==='Budi').cases[0],'TERLAMBAT BAHASA ARAB');
});
test('Buku Konseling lama memakai uraian kejadian saat nama program tidak disimpan terpisah',()=>{
 const book=M.bookEntries([],{old:{santri:'Ali',kodePelanggaran:'ALFA',deskripsiAwal:"Alfa pada Sholat Zuhur Berjama'ah.",kategoriAkhir:'TERBUKTI'}});
 assert.equal(book[0].cases[0],"ALFA SHOLAT ZUHUR BERJAMA'AH");
 const withoutDetail=M.bookEntries([],{old:{santri:'Budi',kodePelanggaran:'ALFA',kategoriAkhir:'TERBUKTI'}});
 assert.equal(withoutDetail[0].cases[0],'ALFA');
});
test('jenis pelanggaran manual memakai nama spesifik jika tersedia',()=>{
 const raw={tanggal:'2026-10-30',dilaporkan:'Ali',tipe:'Lapor Pelanggaran',kodePelanggaran:'KEDISIPLINAN',jenisPelanggaran:'Tidak mengikuti program asrama',caseV2:{status:'SELESAI',counseling:{s1:{savedAt:'2026-10-30T05:00:00Z'}}}};
 assert.equal(M.bookEntries([C.normalizeCase(raw,'manual')])[0].cases[0],'Tidak mengikuti program asrama');
});
test('Konselor mendapat empat fungsi utama dan beranda, role lain ditolak',()=>{
 const s=R.resolveSession(profile('KONSELOR'));const items=Menu.model(s);
 assert.deepEqual(items.map(x=>x.id),['menu-home','menu-kasus-masuk','menu-buku-konseling','menu-evaluasi-pelanggaran','menu-surat-peringatan','menu-kalender-pendidikan','menu-panduan-kerja','menu-profil']);
 for(const item of items)assert(N.decision(s,item.permission,item.route).ok);
 assert.equal(N.canAccessRoute(s,'kalender.html?mode=view','menu-kalender-pendidikan').ok,true);
 assert.equal(N.canAccessRoute(s,'kalender.html?mode=edit','menu-kalender-pendidikan').ok,false);
 const wali=R.resolveSession(profile('WALI_SANTRI'));
 assert.equal(N.canAccessRoute(wali,'konselor/workspace-v3.html?view=cases').ok,false);
 assert.equal(N.canAccessRoute(wali,'konselor/workspace-v3.html?view=warnings').ok,false);
});
