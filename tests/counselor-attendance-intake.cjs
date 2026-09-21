const assert=require('node:assert/strict');
const C=require('../js/counselor-case-v2.js');

const program=(date,status='A',extra={})=>C.attendanceCases({[`p-${date}`]:{tanggal:date,program:'Shalat Subuh',unit:'PUTRA',naqibPenginput:'Kamal',data:[{nama:'Ahmad',status,poin:status==='A'?-40:-20,...extra}] }},'ABSENSI_PROGRAM');
const learning=(date,status='Alfa',extra={})=>C.attendanceCases({[`k-${date}`]:{tanggal:date,mapel:'Matematika',unit:'PUTRA',guru:'Ustadz',statusFinalisasi:'FINAL',data:[{nama:'Ahmad',status,statusFinal:status,final:true,poin:status==='Alfa'?-40:-20,...extra}] }},'ABSENSI_KBM');

// A–C: ALFA/TERLAMBAT dari kedua sumber masuk sebagai fakta final.
assert.equal(program('2026-09-18')[0].code,'ALFA');
assert.equal(program('2026-09-18','T')[0].code,'TERLAMBAT');
assert.equal(learning('2026-09-18')[0].sourceType,'ABSENSI_KBM');
// D–F: status non-kasus dan sementara tidak pernah menjadi intake.
assert.equal(program('2026-09-18','H').length,0);
assert.equal(program('2026-09-18','I').length,0);assert.equal(program('2026-09-18','S').length,0);
assert.equal(C.attendanceCases({x:{tanggal:'2026-09-18',statusFinalisasi:'BELUM_FINAL',data:[{nama:'Ahmad',status:'Belum Hadir',final:false}]}},'ABSENSI_KBM').length,0);
// G: satu fakta berubah dari draft menjadi final menghasilkan tepat satu case.
assert.equal(C.attendanceCases({x:{tanggal:'2026-09-18',statusFinalisasi:'BELUM_FINAL',data:[{nama:'Ahmad',status:'Alfa',final:false}]}},'ABSENSI_KBM').length,0);
assert.equal(C.attendanceCases({x:{tanggal:'2026-09-18',statusFinalisasi:'FINAL',data:[{nama:'Ahmad',statusFinal:'Alfa',status:'Alfa',final:true}]}},'ABSENSI_KBM').length,1);
// H–J: routing memakai tanggal kalender unik, bukan jumlah record.
const days=[...program('2026-09-16'),...program('2026-09-17'),...program('2026-09-18')];
assert.equal(C.routeCase(days[0],days).level,'PEMULA');assert.equal(C.routeCase(days[1],days).level,'PEMULA');assert.equal(C.routeCase(days[2],days).reason,'THREE_CONSECUTIVE_DAYS');
const lateDays=[...program('2026-09-16','T'),...program('2026-09-17','T'),...program('2026-09-18','T')];assert.equal(C.routeCase(lateDays[2],lateDays).reason,'THREE_CONSECUTIVE_DAYS');
const broken=[...program('2026-09-15'),...program('2026-09-17'),...program('2026-09-18')];assert.equal(C.routeCase(broken[2],broken).level,'PEMULA');
const sameDay=[...program('2026-09-18'),...learning('2026-09-18'),...learning('2026-09-18','Alfa',{nama:'Ahmad'})];assert.equal(C.routeCase(sameDay[2],sameDay).level,'PEMULA');
const mixed=[...program('2026-09-16'),...program('2026-09-17','T'),...program('2026-09-18')];assert.equal(C.routeCase(mixed[2],mixed).level,'PEMULA');
// K–M: identitas deterministik, dedupe lintas representasi, caseV2 tidak menggandakan item.
const stable=program('2026-09-18')[0];assert.equal(stable.id,'PROGRAM-p-2026-09-18-0');assert.equal(stable.dbPath,'cahaya_app/absensi_program_harian/p-2026-09-18/data/0');
assert.equal(C.excludeRepresented([stable],[{sumberCaseId:stable.id}]).length,0);assert.equal(C.excludeRepresented([stable],[{sumberPath:stable.dbPath}]).length,0);
assert.equal(program('2026-09-18','A',{caseV2:{status:'DITANGANI',routeLevel:'PEMULA'}}).length,1);
assert.equal(program('2026-09-18','A',{statusPenanganan:'SELESAI'}).length,0);
// N: assignment unit membatasi actionable case.
assert.equal(C.actionable(stable,{unit:'PUTRA',level:'PEMULA'},[stable]),true);assert.equal(C.actionable(stable,{unit:'PUTRI',level:'PEMULA'},[stable]),false);
// O: intake hanya membawa poin sumber; tidak membuat transaksi/rumus poin baru.
assert.equal(stable.initialPoint,-40);assert.equal(stable.pointRef,'');assert.equal(stable.raw.caseV2.pointTransactionId,undefined);
assert.equal(learning('2026-09-18','Terlambat')[0].initialPoint,-20);
console.log('counselor-attendance-intake: ok');
