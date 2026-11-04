const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('guru/inputNilaiUjian.html','utf8');
const classes={'Kelas 4 Putra':[],'Kelas 5 Putra':[],'Kelas 4 Putri':[],'Kelas 1 Putra':[]};
const ctx={teacherCodeAktif:'MULTAZAM',teacherSubjectClasses:{},scheduleRows:[{mapel:'Hadits Ahkam',kelas:'Kelas 4 Putra',guruKode:'ZAWAWI'}],buildClassSource:()=>classes,document:{getElementById:id=>({value:id==='tahunAkademik'?'2026/2027':'Hadits Ahkam'})}};
vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('  const HISTORICAL_HADITS_CLASSES'),html.indexOf('  function populateMasterOptions()')),ctx);
ctx.buildTeacherSubjectMap();assert.equal(ctx.teacherSubjectClasses['Hadits Ahkam'].length,3);
const p={mapel:'Hadits Ahkam',tahun:'2026/2027',jenis:'Bulanan',periode:'Oktober',kelas:'Kelas 4 Putra'};
assert(ctx.historicalExamAllowed(p));
for(const update of [{periode:'November'},{periode:'September'},{tahun:'2027/2028'},{jenis:'Semester'},{kelas:'Kelas 1 Putra'},{kelas:''}])assert.equal(ctx.historicalExamAllowed({...p,...update}),false);
ctx.teacherCodeAktif='RAHIEL';ctx.buildTeacherSubjectMap();assert.equal(ctx.teacherSubjectClasses['Hadits Ahkam'],undefined);
ctx.teacherCodeAktif='ZAWAWI';ctx.buildTeacherSubjectMap();assert.deepEqual(Array.from(ctx.teacherSubjectClasses['Hadits Ahkam']),['Kelas 4 Putra']);assert(ctx.historicalExamAllowed({...p,periode:'November'}));
// Reject an out-of-period save/final before any database read; retain FINAL locks.
ctx.teacherCodeAktif='MULTAZAM';ctx.scoreStatusVerified=true;ctx.ref=()=>{};ctx.db={};let reads=0;ctx.get=async()=>{reads++;return{val:()=>({status:'FINAL'})}};
vm.runInContext(html.slice(html.indexOf('  async function verifyWritableScoreSession('),html.indexOf('  function teacherMatchesSession(')),ctx);
ctx.scoreFinalPath=()=>'';
(async()=>{await assert.rejects(()=>ctx.verifyWritableScoreSession({...p,periode:'November'}),/Oktober/);assert.equal(reads,0);await assert.rejects(()=>ctx.verifyWritableScoreSession(p),/Final/);assert.equal(reads,1);assert.equal(html,fs.readFileSync('docs/guru/inputNilaiUjian.html','utf8'));console.log('PASS historical subject visibility, exact October/class scope, current teacher access, save/final guards and mirrors')})().catch(e=>{console.error(e);process.exitCode=1});
