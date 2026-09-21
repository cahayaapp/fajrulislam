const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const A=require('../js/student-program-applicability.js');
const at='2026-08-31';
const assignment=(level,program='Tahsin')=>({programQuran:program,tahsinLevel:level,effectiveFrom:'2026-08-01'});
const records={
  [A.key('Student A')]:assignment('LEVEL_1'),
  [A.key('Student B')]:assignment('LEVEL_2'),
  [A.key('Student C')]:assignment('LEVEL_3'),
  [A.key('Student E')]:assignment('LEVEL_1'),
  [A.key('Student F')]:assignment('', 'Tahfiz')
};
const classes={'Kelas 4':['Student A','Student B','Student C','Student D','Student F'],'Kelas 5':['Student E']};
const roster=(klass,subject,date)=>classes[klass].filter(name=>A.applicable(name,subject,date,records).applicable);
assert.deepEqual(roster('Kelas 4','Tahsin Praktek',at),['Student A','Student C']);
assert.deepEqual(roster('Kelas 4','Tahsin Teori',at),['Student B']);
assert.deepEqual(roster('Kelas 4','Tahfiz',at),['Student F']);
assert(!roster('Kelas 4','Tahsin Praktek',at).includes('Student D'));
assert(!roster('Kelas 4','Tahsin Praktek',at).includes('Student E'));
records[A.key('Student A')].history=[
  {effectiveFrom:'2026-08-01',programQuran:'Tahsin',tahsinLevel:'LEVEL_1'},
  {effectiveFrom:'2026-09-01',programQuran:'Tahsin',tahsinLevel:'LEVEL_2'}
];
records[A.key('Student A')].effectiveFrom='2026-09-01';records[A.key('Student A')].tahsinLevel='LEVEL_2';
assert(A.applicable('Student A','Tahsin Praktek','2026-08-31',records).applicable);
assert(!A.applicable('Student A','Tahsin Teori','2026-08-31',records).applicable);
assert(A.applicable('Student A','Tahsin Teori','2026-09-30',records).applicable);
assert(!A.applicable('Student A','Tahsin Praktek','2026-09-30',records).applicable);
assert.equal(A.periodDate({tahun:'2026/2027',bulan:'Agustus'}),'2026-08-31');
assert.equal(A.periodDate({tahun:'2026/2027',bulan:'September'}),'2026-09-30');
assert.equal(A.periodDate({tahun:'2026/2027',bulan:'September',tanggal:'2026-09-10'}),'2026-09-10');
assert.equal(A.periodDate({tahun:'2026/2027',bulan:'Agustus',tanggal:'2026-09-21'}),'2026-08-31');
assert(A.applicable('Student A',{kode_penilaian:'tahsin_praktek',programQuran:'Tahsin',tahsinLevel:'LEVEL_1'},'2026-08-31',{},
  {programQuran:'Tahsin',tahsinLevel:'LEVEL_1',programPeriodDate:'2026-08-31',nilai_total:0}).applicable);
assert(!A.applicable('Student D','Tahsin Praktek',at,records).applicable);
const root=path.join(__dirname,'..');
const score=fs.readFileSync(path.join(root,'guru/inputNilaiUjian.html'),'utf8');
const report=fs.readFileSync(path.join(root,'admin/rapot-uas.html'),'utf8');
const wali=fs.readFileSync(path.join(root,'wali/dashboard/akademik.html'),'utf8');
const placement=fs.readFileSync(path.join(root,'js/tahsin-placement-v2.js'),'utf8');
const placementPage=fs.readFileSync(path.join(root,'pendidikan/penempatan-tahsin.html'),'utf8');
assert(placementPage.includes('id="studentList"')&&placementPage.includes('id="selectAll"'));
assert(placement.includes("Q.rows(state.classes,classes,'Tahsin',state.programs)")&&placementPage.includes('id="classSelect"'));
assert(!placement.includes('limitToLast')&&!placement.includes('setoran_tahfiz'));
assert(!placement.includes('legacyNames')&&!placement.includes('Halqah Quraniyah'));
assert(placement.includes("runTransaction(ref(db,'cahaya_app/program_quran_santri/'+row.storageKey)"));
const navigation=require('../js/role-navigation-v2.js');
const manager={mode:'canonical',activeRole:'MANAJER',activeAssignment:{area:'PENDIDIKAN',unit:'PUTRA',programDomain:'KEPONDOKAN',managedRoles:['GURU_PONDOK']}};
assert(navigation.canAccessRoute(manager,'pendidikan/penempatan-tahsin.html').ok);
assert(!navigation.canAccessRoute({...manager,activeAssignment:{...manager.activeAssignment,area:'PEMBINAAN_KARAKTER'}},'pendidikan/penempatan-tahsin.html').ok);
assert(!navigation.canAccessRoute({...manager,activeRole:'GURU_PONDOK'},'pendidikan/penempatan-tahsin.html').ok);
assert(score.includes('CahayaStudentProgramApplicability.applicable(name,currentAssessmentKey'));
assert(score.includes('validateCurrentRoster(params,rows)'));
assert(score.includes('programPeriodDate:CahayaStudentProgramApplicability.periodDate(params)'));
assert(report.includes('CahayaStudentProgramApplicability.applicable('));
assert(wali.includes('A.applicable(activeStudentName,exam'));
assert(!/async function prosesPembaruanNilai\([^)]*\)\s*\{[^}]*sinkronkanNilaiNolKePusat/.test(report));
console.log('Tahsin/Tahfiz applicability fixtures and shared consumers: OK');
