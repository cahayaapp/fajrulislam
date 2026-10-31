'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const A=require('../js/student-program-applicability.js');
const P=require('../js/academic-report-score-policy.js');
const html=fs.readFileSync(require.resolve('../admin/rapot-uas.html'),'utf8');
// Execute actual report pipeline functions; fixture only replaces the existing UAS window/UI.
const functions=['getNilaiRaport','quranReportContext','reportSubject','isNilaiOtomatis','bacaNilaiAkhir','ambilRekamanNilaiEfektif','ambilNilaiSantri','tampilkanNilai'];
const source=functions.map(name=>{
 const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  \\}'));
 assert(match, name);return match[0];
}).join('\n');
const name='ALIF SAMUDRA',other='ADITYA PUTRA IBRAHIM',classes={'Kelas 2 Putra':[name,other]};
const record=(code,value,id,level='')=>({id,nama_santri:name,mata_pelajaran:code,kode_penilaian:code,
 programPeriodDate:'2026-09-30',kelas_kelompok:'Kelas 2 Putra',nilai_total:value,tahsinLevel:level});
const assignments={alifsamudra:{programQuran:'Tahsin',tahsinLevel:'LEVEL_2',effectiveFrom:'2026-10-01',history:[{programQuran:'Tahsin',tahsinLevel:'LEVEL_1',effectiveFrom:'2026-09-01'}]}};
const context={CahayaStudentProgramApplicability:A,CahayaAcademicReportScorePolicy:P,masterAkademik:{kelas:classes},window:{},quranAssignments:assignments,
 semuaNilai:[record('tahsin_praktek',70,'old','LEVEL_1'),record('tahsin_level_1',80,'new','LEVEL_1'),record('tahsin_level_2',0,'wrong2','LEVEL_2'),record('tahsin_level_3',0,'wrong3','LEVEL_3'),record('tahfiz',0,'wrongf'),record('FIQIH',100,'fiqih')],
 nilaiMasukRentangUas:()=>true,normal:v=>String(v).toLowerCase(),namaSama:(a,b)=>A.key(a)===A.key(b),
 bandingkanRekamanNilai:(a,b)=>a.id==='new'?-1:b.id==='new'?1:0,
 nilaiTampilKeputusanRapat:(name,value)=>value,kosong:(v,f='-')=>v||f,
 escapeHtml:v=>String(v),statusNilai:v=>v>=70?'Lulus':'Remedial',setText:(scope,id,value)=>scope[id]=value};
vm.createContext(context);vm.runInContext(source,context);
let rows=JSON.parse(JSON.stringify(context.ambilNilaiSantri(name)));
assert.equal(rows.length,2);assert.deepEqual(rows.map(row=>row.mapel),['FIQIH','Tahsin Level 1 • Tahsin Praktek']);
const tbody={innerHTML:''},scope={querySelector:()=>tbody};context.tampilkanNilai(scope,rows);
assert.equal(scope.rRataRata,'90.0');assert(!tbody.innerHTML.includes('Level 2'));assert(!tbody.innerHTML.includes('Tahfiz'));
// The same rendering pipeline is used for individual and bulk/print papers.
assert(html.includes('const daftarNilai = ambilNilaiSantri(nama);'));
assert(html.includes('tampilkanNilai(paper, daftarNilai);'));
// October does not inherit a Level 1 value after promotion.
context.semuaNilai=[{...record('tahsin_level_1',90,'wrong1','LEVEL_1'),programPeriodDate:'2026-10-31'},
 {...record('tahsin_level_2',85,'right2','LEVEL_2'),programPeriodDate:'2026-10-31'}];
rows=JSON.parse(JSON.stringify(context.ambilNilaiSantri(name)));assert.equal(rows.length,1);assert.equal(rows[0].mapel,'Tahsin Level 2 • Tahsin Teori');
context.semuaNilai=[{...record('tahsin_level_1',0,'excluded','LEVEL_1'),nama_santri:other},
 {...record('tahfiz',88,'included'),nama_santri:other}];
rows=JSON.parse(JSON.stringify(context.ambilNilaiSantri(other)));assert.equal(rows.length,1);assert.equal(rows[0].mapel,'Tahfiz');
// An explicit zero for a genuinely applicable participant stays visible.
context.semuaNilai=[record('tahsin_level_1',0,'zero','LEVEL_1')];
assert.equal(context.ambilNilaiSantri(name)[0].nilai,0);
console.log('Actual report pipeline: level labels, legacy deduplication, applicable-only denominator, period history, Tahfiz XOR and print shared path: PASS');
