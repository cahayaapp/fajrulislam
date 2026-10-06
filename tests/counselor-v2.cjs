const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../js/counselor-case-v2.js');
const R=require('../js/role-system-v2.js');
function row(date,code='BOLOS_PROGRAM',student='Ahmad',extra={}){return C.normalizeCase({tanggal:date,tipe:'Lapor Pelanggaran',dilaporkan:student,kodePelanggaran:code,...extra},date+code)}
assert.equal(C.routeCase(row('2026-09-18'),[]).level,'PEMULA');
assert.equal(C.routeCase(row('2026-09-18','TERLAMBAT_PROGRAM'),[]).level,'PEMULA');
assert.equal(C.routeCase(row('2026-09-18','KEBERSIHAN'),[]).level,'PEMULA');
assert.deepEqual(C.routeCase(row('2026-09-18','MORAL'),[]),{level:'MADYA',reason:'MORAL'});
assert.equal(C.routeCase(row('2026-09-18','LAIN','Ahmad',{severity:'BERAT'}),[]).level,'MADYA');
assert.equal(C.routeCase(row('2026-09-18','LAIN','Ahmad',{severity:'KRITIS'}),[]).level,'MADYA');
const consecutive=[row('2026-09-16'),row('2026-09-17'),row('2026-09-18')];assert.equal(C.routeCase(consecutive[2],consecutive).reason,'THREE_CONSECUTIVE_DAYS');
const broken=[row('2026-09-15'),row('2026-09-17'),row('2026-09-18')];assert.equal(C.routeCase(broken[2],broken).level,'PEMULA');
assert.equal(C.routeCase(row('2026-09-18','BOLOS_PROGRAM','Ahmad',{caseV2:{escalation:{reason:'Kompleks'}}}),[]).reason,'MANUAL_ESCALATION');
assert.equal(C.pointFor('BIMBINGAN'),0);assert.equal(C.pointFor('RINGAN'),-25);assert.equal(C.pointFor('SEDANG'),-50);assert.equal(C.pointFor('BERAT'),-100);assert.equal(C.pointFor('KRITIS'),-200);
assert.deepEqual(C.nfdk({niat:2,frekuensi:2,dampak:2,kondisi:1}),{score:7,severity:'KRITIS'});
const legacy=R.resolveSession({roleSystemVersion:2,username:'x',roles:['KONSELOR'],defaultRole:'KONSELOR',assignments:{KONSELOR:{unit:'PUTRI',level:'MUDA'}}},{getItem(){return''},setItem(){}});assert.equal(legacy.activeAssignment.level,'MADYA');
assert.equal(C.weekKey(new Date('2026-09-18T12:00:00Z')),'2026-09-14');
assert.deepEqual(C.calendarRange('TODAY','2026-09-18'),{start:'2026-09-18',end:'2026-09-18'});
assert.deepEqual(C.calendarRange('WEEK','2026-09-18'),{start:'2026-09-14',end:'2026-09-18'});
assert.deepEqual(C.calendarRange('MONTH','2026-09-18'),{start:'2026-09-01',end:'2026-09-18'});
assert.equal(C.validRange('2026-08-29','2026-09-02'),true);assert.equal(C.validRange('2026-09-18','2026-09-01'),false);
assert.equal(C.jakartaDate(new Date('2026-09-17T17:30:00Z')),'2026-09-18');
const escalated=row('2026-09-18','BOLOS_PROGRAM','Ahmad',{caseV2:{escalation:{reason:'Kompleks',note:'Fakta baru',escalatedByName:'Pemula',escalatedAt:'2026-09-18T10:00:00Z'},higherEscalation:{targetRole:'SUPERVISOR',requestedByName:'Madya',requestedAt:'2026-09-18T11:00:00Z',reason:'Butuh arahan',summary:'Ringkas',decisionNeeded:'Arahan',urgency:'SEGERA',response:{respondedBy:'Supervisor',respondedAt:'2026-09-18T12:00:00Z',decision:'Lanjutkan',instruction:'Pantau'}}}});
assert.deepEqual(C.timeline(escalated).filter(x=>x.type.includes('ESKALASI')||x.type.includes('RESPONS')).map(x=>x.label),['Kasus dieskalasi ke Konselor Madya','Meminta arahan Supervisor','Arahan Supervisor diterima']);
assert(C.timeline(escalated).some(x=>x.type==='DILANJUTKAN_MADYA'&&x.label==='Dilanjutkan Konselor Madya'));
const pendingSupervisor=row('2026-09-18','MORAL','Ahmad',{unit:'PUTRA',statusPenanganan:'MENUNGGU_ARAHAN_SUPERVISOR',caseV2:{status:'MENUNGGU_ARAHAN_SUPERVISOR',routeLevel:'MADYA',claim:{assignedCounselorId:'madya'},higherEscalation:{targetRole:'SUPERVISOR',requestedAt:'2026-09-18T11:00:00Z'}}});
const supervisor={activeRole:'SUPERVISOR',activeAssignment:{unit:'PUTRA',supervisedRoles:['KONSELOR']}};
assert.equal(C.canHigherAuthorityRespond(supervisor,pendingSupervisor),true);
assert.equal(C.canHigherAuthorityRespond({activeRole:'DIREKTUR',activeAssignment:{unit:'ALL'}},pendingSupervisor),false);
assert.equal(C.canHigherAuthorityRespond({activeRole:'MANAJER',activeAssignment:{unit:'PUTRA',managedRoles:['KONSELOR']}},pendingSupervisor),false);
const supervisorPatch=C.higherResponsePatch(supervisor,pendingSupervisor,{instruction:'Lanjutkan pendampingan',note:'Pantau pekanan'},{username:'spv',name:'Supervisor'},'2026-09-18T13:00:00Z');
assert.equal(supervisorPatch.status,'ARAHAN_SUPERVISOR_DITERIMA');assert.equal(supervisorPatch.response.respondedRole,'SUPERVISOR');
assert.equal(pendingSupervisor.caseV2.claim.assignedCounselorId,'madya');
const pendingDirector=row('2026-09-18','MORAL','Ahmad',{unit:'PUTRA',statusPenanganan:'MENUNGGU_KEPUTUSAN_DIREKTUR',caseV2:{status:'MENUNGGU_KEPUTUSAN_DIREKTUR',routeLevel:'MADYA',claim:{assignedCounselorId:'madya'},higherEscalation:{targetRole:'DIREKTUR',requestedAt:'2026-09-18T11:00:00Z'}}});
const director={activeRole:'DIREKTUR',activeAssignment:{unit:'ALL'}};
const directorPatch=C.higherResponsePatch(director,pendingDirector,{decision:'Disetujui','instruction':'Laksanakan sesuai SOP'},{username:'dir',name:'Direktur'},'2026-09-18T13:30:00Z');
assert.equal(directorPatch.status,'KEPUTUSAN_DIREKTUR_DITERIMA');assert.equal(directorPatch.response.respondedRole,'DIREKTUR');
// Semua kasus seorang santri tetap menjadi record tersendiri, termasuk pada hari yang sama.
const grouped=C.groupCasesByStudent([
  row('2026-09-18','TERLAMBAT_PROGRAM','Ahmad'),
  row('2026-09-18','KEBERSIHAN','Ahmad'),
  row('2026-09-17','BOLOS_PROGRAM','Ahmad'),
  row('2026-09-18','BOLOS_PROGRAM','Fauzan')
]);
assert.equal(grouped.length,2);assert.equal(grouped.find(x=>x.student==='Ahmad').cases.length,3);
// Satu tindakan massal membawa semua case ID, tetapi tetap dapat ditulis ke tiap record kasus.
const batch=C.batchActionRecord({actionType:'Konseling Pembinaan',date:'2026-09-18T10:00',note:'Pembinaan bersama',followUp:'Pantau tiga hari',batchActionId:'batch-test'},{id:'k1',name:'Konselor'},['c1','c2'],'2026-09-18T10:05:00Z');
assert.equal(batch.caseCount,2);assert.deepEqual([...batch.caseIds],['c1','c2']);assert.equal(batch.actionLabel,'Konseling / Pembinaan');
assert.equal(C.batchActionRecord({actionType:'Pemantauan',date:'2026-09-18',note:''},{id:'k1'},['c1']),null);
const withBatch=row('2026-09-18','BOLOS_PROGRAM','Ahmad',{caseV2:{batchActions:{'batch-test':batch}}});
assert(C.timeline(withBatch).some(x=>x.type==='PENINDAKAN_BERSAMA'&&x.note.includes('Pembinaan bersama')));
const queueSource=fs.readFileSync(require('node:path').join(__dirname,'..','konselor','daftar-kasus-baru.html'),'utf8');
assert.match(queueSource,/jadwalIdPresensi \|\| record\.jadwalIdAsli \|\| record\.jadwalId/,'deduplikasi antrean harus memakai ID sesi');
assert.match(queueSource,/jamMulaiJadwal \|\| record\.jamMulai/,'fallback sesi harus membedakan waktu');
const appSource=fs.readFileSync(require('node:path').join(__dirname,'..','js','counselor-app-v2.js'),'utf8');
assert.match(appSource,/groupCasesByStudent\(visible\)/);assert.match(appSource,/batchActions\/\$\{batchId\}/);
console.log('counselor-v2: ok');
