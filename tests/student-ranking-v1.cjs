const assert=require('node:assert/strict');
const Publication=require('../js/academic-report-publication-v1.js');
const Best=require('../js/student-ranking-v1.js');

const final=(name,subject,score,extra={})=>({nama_santri:name,mata_pelajaran:subject,nilai_total:score,status_nilai:'FINAL',...extra});
const academic=Publication.rankClassReports([
  {student:{name:'Ahmad',studentKey:'ahmad'},complete:true,records:[final('Ahmad','Fiqih',90),final('Ahmad','Tahfiz Al-Qur’an',90,{is_remedial:true})]},
  {student:{name:'Fauzan',studentKey:'fauzan'},complete:true,records:[final('Fauzan','Fiqih',90),final('Fauzan','Tahsin Teori',90)]},
  {student:{name:'Akbar',studentKey:'akbar'},complete:true,records:[final('Akbar','Fiqih',80)]},
  {student:{name:'Belum',studentKey:'belum'},complete:false,records:[final('Belum','Fiqih',100)]}
]);
assert.deepEqual(academic.map(x=>x.rank),[1,1,3,null]);
assert.equal(academic[0].average,90);
assert.equal(academic[0].remedial,1);
assert.equal(academic[3].rank,null,'nilai belum lengkap tidak memperoleh ranking resmi');

assert.deepEqual(Best.periodRange('bulanan','September','2026/2027'),{start:'2026-09-01',end:'2026-09-30'});
assert.deepEqual(Best.periodRange('triwulan','Triwulan 3','2026/2027'),{start:'2027-01-01',end:'2027-03-31'});
assert.deepEqual(Best.periodRange('semester','Semester 2','2026/2027'),{start:'2027-01-01',end:'2027-06-30'});

const attendance=[
  {tanggal:'2026-09-01',__attendanceSource:'PROGRAM',data:[{studentKey:'ahmad',status:'HADIR'},{studentKey:'fauzan',status:'TERLAMBAT'},{studentKey:'akbar',status:'SAKIT'}]},
  {tanggal:'2026-09-02',__attendanceSource:'PEMBELAJARAN',data:[{studentKey:'ahmad',status:'HADIR'},{studentKey:'fauzan',status:'ALFA'},{studentKey:'akbar',status:'IZIN'}]},
  {tanggal:'2026-10-01',data:[{studentKey:'ahmad',status:'ALFA'}]}
];
const best=Best.bestStudentRanking(academic,{attendance,type:'bulanan',period:'September',academicYear:'2026/2027'});
const ahmad=best.find(x=>x.student.name==='Ahmad'),fauzan=best.find(x=>x.student.name==='Fauzan'),akbar=best.find(x=>x.student.name==='Akbar');
assert.equal(ahmad.disciplineScore,100);
assert.deepEqual(ahmad.attendance.sources,{PROGRAM:1,PEMBELAJARAN:1},'kedisiplinan menggabungkan absensi program dan pembelajaran');
assert.equal(fauzan.disciplineScore,35);
assert.equal(ahmad.programAttendanceScore,100);
assert.equal(ahmad.learningAttendanceScore,100);
assert.equal(fauzan.programAttendanceScore,70);
assert.equal(fauzan.learningAttendanceScore,0);
assert.equal(akbar.disciplineScore,null,'Sakit/Izin dikeluarkan dari denominator');
assert.equal(fauzan.eligibleBestStudent,true,'kelengkapan akademik dan kedua sumber kehadiran menentukan eligibility');
assert.equal(akbar.dataComplete,false,'tanpa kesempatan hadir efektif data belum lengkap');
assert.equal(Number(ahmad.bestScore.toFixed(2)),95);

const classOneAttendance=[...Array.from({length:9},(_,i)=>({tanggal:`2026-09-${String(i+1).padStart(2,'0')}`,__attendanceSource:'PEMBELAJARAN',data:[{studentKey:'kelas-1',status:'HADIR'}]})),{tanggal:'2026-09-10',__attendanceSource:'PEMBELAJARAN',data:[{studentKey:'kelas-1',status:'ALFA'}]}];
const classTwoAttendance=[...Array.from({length:90},(_,i)=>({tanggal:`2026-09-${String(i%30+1).padStart(2,'0')}`,__attendanceSource:'PEMBELAJARAN',data:[{studentKey:'kelas-2',status:'HADIR'}]})),...Array.from({length:10},(_,i)=>({tanggal:`2026-09-${String(i+1).padStart(2,'0')}`,__attendanceSource:'PEMBELAJARAN',data:[{studentKey:'kelas-2',status:'ALFA'}]}))];
const classOneRate=Best.attendanceFor({studentKey:'kelas-1'},classOneAttendance,{start:'2026-09-01',end:'2026-09-30'}).learning.score;
const classTwoRate=Best.attendanceFor({studentKey:'kelas-2'},classTwoAttendance,{start:'2026-09-01',end:'2026-09-30'}).learning.score;
assert.equal(classOneRate,90,'kelas dengan 10 kesempatan belajar dinilai sebagai persentase kelasnya');
assert.equal(classTwoRate,90,'kelas dengan 100 kesempatan belajar tetap sebanding berdasarkan persentase, bukan jumlah mentah');
assert.deepEqual(Best.CONFIG.weights,{academic:.5,programAttendance:.25,learningAttendance:.25});

const ties=Best.rankCompetition([{score:90},{score:80},{score:80},{score:70}],'score');
assert.deepEqual(ties.map(x=>x.rank),[1,2,2,4]);

assert.equal(Best.sameStudent({studentKey:'ahmad',sourceStudentKey:'student:ahmad:001',name:'Ahmad'},{studentKey:'student:ahmad:001',nama:'AHMAD'}),true,'ID stabil dan snapshot nama dapat di-resolve tanpa menjadikan nama satu-satunya key');
const sickNeutral=Best.attendanceFor({studentKey:'a'},[{tanggal:'2026-09-01',data:[{studentKey:'a',status:'HADIR'}]},{tanggal:'2026-09-02',data:[{studentKey:'a',status:'SAKIT'}]},{tanggal:'2026-09-03',data:[{studentKey:'a',status:'IZIN'}]}],{start:'2026-09-01',end:'2026-09-30'});
assert.equal(sickNeutral.score,100);

const fs=require('node:fs'),supervisor=fs.readFileSync(require('node:path').join(__dirname,'../supervisor/laporan-akademik.html'),'utf8'),wali=fs.readFileSync(require('node:path').join(__dirname,'../wali/dashboard/akademik.html'),'utf8');
assert.match(supervisor,/Ranking & Santri Terbaik/);
assert.match(supervisor,/Sinkronkan Ranking Terpublikasi/,'rapor lama yang sudah published dapat diberi snapshot ranking tanpa publikasi ulang');
assert.match(supervisor,/Menyiapkan data ranking dan memeriksa rapor yang sudah dipublikasikan/,'sinkronisasi selalu memberi status proses yang terlihat');
assert.match(supervisor,/rapor terpublikasi berhasil diperbarui/,'sinkronisasi melaporkan jumlah rapor yang benar-benar diperbarui');
assert.match(supervisor,/orderByChild\('tanggal'\)\.startAt\(range\.start\)\.endAt\(range\.end\)/,'data pendukung dibaca sesuai rentang periode');
assert.match(supervisor,/cahaya_app\/absensi_program_harian/);
assert.match(supervisor,/cahaya_app\/absensi_pembelajaran/);
assert.doesNotMatch(supervisor,/Termasuk laporan yang belum ditindak/);
assert.doesNotMatch(supervisor,/cahaya_app\/log_lapor_inisiatif/,'Santri Terbaik tidak lagi membaca laporan pelanggaran');
assert.doesNotMatch(supervisor,/cahaya_app\/poin_manual/,'Santri Terbaik tidak membaca ledger poin pelanggaran');
assert.match(supervisor,/Seluruh Kelas Putra/);
assert.match(supervisor,/Seluruh Kelas Putri/);
assert.match(supervisor,/rankingKind==='academic'.*Pilih Kelas/,'Ranking Akademik meminta kelas akademik tertentu');
assert.match(supervisor,/rankingKind==='best'.*Seluruh Kelas Putra/s,'Santri Terbaik menyediakan agregat seluruh Putra atau Putri');
assert.match(supervisor,/bestRankingForUnit\(models,x\.student\.kelas\)/,'preview dan publikasi memakai ranking Santri Terbaik tingkat Putra\/Putri');
assert.match(supervisor,/classRanking.*bestStudentRanking/s,'snapshot rapor memisahkan ranking kelas dari Santri Terbaik area');
assert.match(wali,/publicationRecord\?\.bestStudentRanking/);
assert.doesNotMatch(wali,/ranking-table/,'Wali tidak menerima leaderboard seluruh kelas');
assert.match(wali,/peringkat akademik/i);
assert.match(wali,/peringkat santri terbaik/i);
assert.match(wali,/bestRanking:bestRanking\?\.complete&&bestRanking\?\.eligible/,'PDF hanya menampilkan posisi Santri Terbaik yang eligible dan dipublikasikan');
assert.equal(fs.readFileSync(require('node:path').join(__dirname,'../docs/supervisor/laporan-akademik.html'),'utf8'),supervisor,'mirror Supervisor sinkron');
assert.equal(fs.readFileSync(require('node:path').join(__dirname,'../docs/wali/dashboard/akademik.html'),'utf8'),wali,'mirror Wali sinkron');
console.log('student-ranking-v1: all assertions passed');
