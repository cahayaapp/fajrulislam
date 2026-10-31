'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../js/student-program-applicability.js'),Q=require('../js/quran-menu-roster.js');
const classes={
  'Kelas 4 Putra':[
    {id:'s-a',nama:'Student A'},
    {id:'s-b',nama:'Student B'},
    {id:'s-c',nama:'Student C'},
    {id:'s-d',nama:'Student D'},
    {id:'s-f',nama:'Student F'},
    {id:'s-h',nama:'Student H'}
  ],
  'Kelas 5 Putra':[{id:'s-e',nama:'Student E'},{id:'s-g',nama:'Student G'}]
};
const records={
  's-a':{namaSantri:'Student A',programQuran:'Tahsin',tahsinLevel:'LEVEL_1',effectiveFrom:'2026-09-01'},
  's-b':{namaSantri:'Student B',programQuran:'Tahsin',tahsinLevel:'LEVEL_2',effectiveFrom:'2026-09-01'},
  's-c':{namaSantri:'Student C',programQuran:'Tahsin',tahsinLevel:'LEVEL_3',effectiveFrom:'2026-09-01'},
  's-d':{namaSantri:'Student D',programQuran:'Tahfiz',effectiveFrom:'2026-09-01'},
  's-f':{namaSantri:'Student F',programQuran:'Tahfiz',tahsinLevel:'LEVEL_2',effectiveFrom:'2026-09-01'},
  's-e':{namaSantri:'Student E',programQuran:'Tahfiz',effectiveFrom:'2026-09-01'},
  's-g':{namaSantri:'Student G',programQuran:'Tahsin',tahsinLevel:'LEVEL_1',effectiveFrom:'2026-09-01'}
};
const names=(assessment,scope=['Kelas 4 Putra'],at='2026-09-30',data=records)=>Q.resolveAssessmentStudents({classes,selectedClasses:scope,assessmentKey:assessment,periodDate:at,assignments:data}).map(x=>x.name);
assert.deepEqual(names('tahsin_level_1'),['Student A']);
assert.deepEqual(names('tahsin_level_2'),['Student B']);
assert.deepEqual(names('tahsin_level_3'),['Student C']);
assert.deepEqual(names('tahfiz'),['Student D','Student F','Student H']);
assert(!names('tahfiz').includes('Student A'));
assert(names('tahfiz').includes('Student D'));
assert(names('tahfiz').includes('Student F'),'Tahfiz must ignore stale Tahsin level metadata');
assert(names('tahfiz').includes('Student H'),'unassigned member becomes Tahfiz only because this class has proven Tahsin membership');
assert(!names('tahsin_level_1').includes('Student E'),'teacher class scope must apply');
const combined={...classes,'Quran Gabungan':[...classes['Kelas 4 Putra'],...classes['Kelas 5 Putra'],classes['Kelas 4 Putra'][3]]};
const combinedRows=Q.resolveAssessmentStudents({classes:combined,selectedClasses:['Quran Gabungan'],assessmentKey:'tahfiz',periodDate:'2026-09-30',assignments:records});
assert.deepEqual(combinedRows.map(x=>x.name),['Student D','Student E','Student F','Student H']);
const moved=JSON.parse(JSON.stringify(records));moved['s-b']={...moved['s-b'],programQuran:'Tahfiz',tahsinLevel:'',effectiveFrom:'2026-10-01',history:[{programQuran:'Tahsin',tahsinLevel:'LEVEL_2',effectiveFrom:'2026-09-01'}]};
assert(!names('tahsin_level_2',['Kelas 4 Putra'],'2026-10-31',moved).includes('Student B'));
assert(names('tahfiz',['Kelas 4 Putra'],'2026-10-31',moved).includes('Student B'));
assert(names('tahsin_level_2',['Kelas 4 Putra'],'2026-09-30',moved).includes('Student B'),'historical Tahsin roster retained');
assert.deepEqual(names('tahfiz'),names('tahfiz'),'reload must be deterministic');
assert.equal(records['s-d'].tahsinLevel,undefined,'resolver must not manufacture a Tahsin level');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('config/master-data.js','utf8'),sandbox);
const explicitNames=sandbox.window.CAHAYA_MASTER_DATA.santriByClass['Kelas 1 Putra'];
const explicitClasses={'Kelas 1 Putra':explicitNames.map((nama,index)=>({id:`putra-1-${index}`,nama}))};
assert.equal(Q.resolveAssessmentStudents({classes:explicitClasses,selectedClasses:['Kelas 1 Putra'],assessmentKey:'tahfiz',periodDate:'2026-09-30',assignments:{}}).length,7,'confirmed Tahfiz complement remains available with ID-based master records');
assert.deepEqual(Q.resolveAssessmentStudents({classes:{'Kelas Quran':['Belum Diklasifikasi']},selectedClasses:['Kelas Quran'],assessmentKey:'tahfiz',periodDate:'2026-09-30',assignments:{}}).map(x=>x.name),['Belum Diklasifikasi'],'Quran scope with no Tahsin members is entirely Tahfiz');
const html=fs.readFileSync('guru/inputNilaiUjian.html','utf8');
assert(html.includes('CahayaQuranMenuRoster.resolveAssessmentStudents'));
assert(html.includes('components: [{id:"syafawi",nama:"Lisan",bobot:80},{id:"tahriri",nama:"Tulisan",bobot:20}]'));
assert(html.includes('loadExistingScoresForCurrentSetup()')&&html.includes('currentSessionFinal'));
assert(html.includes('Peserta Tahfiz belum ditemukan untuk kelas/kelompok yang Anda ampu.'));
console.log('Input Nilai Quran roster: levels, Tahfiz without level, XOR, IDs, scope, combined group, transfer, reload, old scores/final contracts: PASS');
