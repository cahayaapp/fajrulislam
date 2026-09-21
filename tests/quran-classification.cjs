'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../js/student-program-applicability.js'),Q=require('../js/quran-menu-roster.js');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../config/master-data.js'),'utf8'),sandbox);
const classes=JSON.parse(JSON.stringify(sandbox.window.CAHAYA_MASTER_DATA.santriByClass));
const audit=A.auditRoster(classes);assert(audit.every(row=>row.ok));
assert.deepEqual(audit.map(row=>[row.tahsin,row.tahfiz]),[[6,2],[4,6],[18,7],[5,17]]);
const stale={};
for(const row of audit)for(const name of classes[row.className])stale[A.key(name)]={programQuran:'Tahfiz',effectiveFrom:'2026-08-01'};
for(const row of audit){
 const tahsin=Q.rows(classes,[row.className],'Tahsin',stale),tahfiz=Q.rows(classes,[row.className],'Tahfiz',stale);
 assert.equal(tahsin.length,row.tahsin);assert.equal(tahfiz.length,row.tahfiz);
 assert.equal(new Set([...tahsin,...tahfiz].map(r=>r.key)).size,row.total);
 assert(!tahsin.some(r=>tahfiz.some(t=>t.key===r.key)));
}
for(const [alias,canonical,cls] of [['Cahyiz Iszam','CAHYIS ISZAM','Kelas 1 Putra'],['Ezha Febri Al Fadzri','EZA FEBRI AL FADZRI','Kelas 2 Putra'],['Nurul','AISYAH NURUL AULIA','Kelas 2 Putri']]){
 assert.equal(A.resolveStudent(alias,{classes,className:cls}).name,canonical);
 assert.equal(A.currentProgram(alias,{classes,className:cls}),A.currentProgram(canonical,{classes,className:cls}));
}
const names=['ALIF SAMUDRA','EZA FEBRI AL FADZRI','MUHAMMAD ABIL IRWANSYAH','MUHAMMAD IZAM SAPUTRA','ADITYA PUTRA IBRAHIM'];
const records=Object.fromEntries(names.slice(0,3).map((name,i)=>[A.key(name),{programQuran:'Tahsin',tahsinLevel:'LEVEL_'+(i+1),effectiveFrom:'2026-09-01'}]));
const context={classes,className:'Kelas 2 Putra'};
const eligible=(subject,at='2026-09-30')=>names.filter(name=>A.applicable(name,subject,at,records,null,context).applicable);
for(let n=1;n<=3;n++)assert.deepEqual(eligible('tahsin_level_'+n),[names[n-1]]);
assert.deepEqual(eligible('tahfiz'),[names[4]]);
assert.equal(A.getQuranProgramPlacement(names[3],'2026-09-30',records,null,context).programQuran,'TAHSIN');
assert.equal(A.getQuranProgramPlacement(names[3],'2026-09-30',records,null,context).tahsinLevel,null);
assert.equal(Q.rows(classes,['Kelas 2 Putra'],'Tahsin',records).length,5);
const combined={...classes,'Quran Gabungan':[names[0],names[4],'FITRAH KIRANA']};
const combinedContext={classes:combined,className:'Quran Gabungan'};
assert(A.applicable(names[0],'tahsin_level_1','2026-09-30',records,null,combinedContext).applicable);
assert(A.applicable(names[4],'tahfiz','2026-09-30',records,null,combinedContext).applicable);
assert.deepEqual(Q.rows(combined,['Quran Gabungan'],'Tahsin',records).map(r=>r.nama),[names[0],'FITRAH KIRANA']);
assert(!Q.rows(classes,['Kelas 1 Putra'],'Tahsin',records).some(r=>r.nama===names[0]));
records[A.key(names[0])]={programQuran:'Tahsin',tahsinLevel:'LEVEL_2',effectiveFrom:'2026-10-01',history:[{programQuran:'Tahsin',tahsinLevel:'LEVEL_1',effectiveFrom:'2026-09-01'}]};
assert(eligible('tahsin_level_1','2026-09-30').includes(names[0]));
assert(!eligible('tahsin_level_1','2026-10-31').includes(names[0]));
assert(eligible('tahsin_level_2','2026-10-31').includes(names[0]));
// Snapshot must not change historic program assignments before confirmation.
assert.equal(A.getQuranProgramPlacement(names[0],'2026-08-31',stale,null,context).programQuran,'TAHFIZ');
assert.equal(A.getQuranProgramPlacement(names[0],'2026-09-30',stale,null,context).programQuran,'TAHSIN');
const aliasRecord={ezhafebrialfadzri:{namaSantri:'Ezha Febri Al Fadzri',programQuran:'Tahsin',tahsinLevel:'LEVEL_2',effectiveFrom:'2026-09-01'}};
assert.equal(A.assignmentKey(names[1],aliasRecord,context),'ezhafebrialfadzri');
assert(A.applicable(names[1],'tahsin_level_2','2026-09-30',aliasRecord,null,context).applicable);
const score={kode_penilaian:'tahsin_level_1',tahsinLevel:'LEVEL_1',programQuran:'Tahsin',nilai_total:0,programPeriodDate:'2026-09-30'};
assert(A.applicable(names[0],score,'2026-09-30',records,score,context).applicable);
assert(!A.applicable(names[0],score,'2026-10-31',records,score,context).applicable);
assert.equal(A.reportLabel(names[0],score,'2026-09-30',records,context),'Tahsin Level 1 • Tahsin Praktek');
assert(!A.applicable(names[4],score,'2026-09-30',records,score,context).applicable);
// Outside the explicit four classes existing program behavior is unchanged.
assert.equal(A.currentProgram('Unknown',{className:'Kelas 4 Putra',classes}), '');
assert.equal(Q.rows({'Kelas 4 Putra':['Unknown']},['Kelas 4 Putra'],'Tahsin',{}).length,1);
console.log('Quran classification: 33 Tahsin / 32 Tahfiz, XOR, aliases, exact levels, period history and report eligibility: PASS');
