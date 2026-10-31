'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../js/academic-input-progress-v1.js');
const root=path.resolve(__dirname,'..');let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS',name)};
const current=[
  {id:'arab-1',aktif:true,unit:'PUTRA',kelas:'Kelas 1 Putra',mapel:'Bahasa Arab',guruKode:'G01',guruNama:'Guru Satu',tahunAjaran:'2026/2027'},
  {id:'quran-1',aktif:true,unit:'PUTRA',kelas:'Kelas 1 Putra',mapel:'Al-Qur’an',guruKode:'G02',guruNama:'Guru Dua',tahunAjaran:'2026/2027'},
  {id:'arab-2',aktif:true,unit:'PUTRI',kelas:'Kelas 1 Putri',mapel:'Bahasa Arab',guruKode:'G03',guruNama:'Guru Tiga',tahunAjaran:'2026/2027'},
  {id:'old',aktif:true,unit:'PUTRA',kelas:'Kelas Pengusaha',mapel:'Fiqih',guruKode:'OLD',tahunAjaran:'2025/2026'}
];
const master={santriByClass:{'Kelas 1 Putra':[{id:'a',nama:'ANAK A'},{id:'b',nama:'ANAK B'}],'Kelas 1 Putri':[{id:'c',nama:'ANAK C'}],'Kelas Pengusaha':[{id:'old',nama:'DATA LAMA'}]}};
const score=(studentKey,name,subject,status='DRAFT',extra={})=>({studentKey,nama_santri:name,kelas_kelompok:'Kelas 1 Putra',guruKode:subject==='Bahasa Arab'?'G01':'G02',mata_pelajaran:subject,bulan:'September',tahun_akademik:'2026/2027',jenis_ujian:'Bulanan',status_nilai:status,locked:status==='FINAL',...extra});

test('only classes from the newest active schedule are exposed',()=>assert.deepEqual(G.classNames(current),['Kelas 1 Putra','Kelas 1 Putri']));
test('unit scope excludes the opposite unit and stale classes',()=>assert.deepEqual(G.classNames(G.activeSchedule(current,{unit:'PUTRA'})),['Kelas 1 Putra']));
test('different non-Quran subjects are not treated as equal',()=>{assert(G.sameSubject('Bahasa Arab','Bahasa Arab'));assert(!G.sameSubject('Bahasa Arab','Fiqih'))});
test('Quran schedule accepts Tahsin or Tahfiz score labels without level filtering',()=>{assert(G.sameSubject('Al-Qur’an','Tahsin Teori'));assert(G.sameSubject('Al-Qur’an','Tahfiz Al-Qur’an'))});
test('progress counts partial and final records per scheduled teacher',()=>{const result=G.summarize({schedule:current,master,scores:[score('a','ANAK A','Bahasa Arab','FINAL'),score('b','ANAK B','Bahasa Arab','DRAFT')],type:'bulanan',year:'2026/2027',period:'September',unit:'PUTRA'}),teacher=result.find(x=>x.teacherCode==='G01');assert.equal(teacher.expected,2);assert.equal(teacher.entered,2);assert.equal(teacher.final,1);assert.equal(teacher.partial,1);assert.equal(teacher.progress,100);assert.equal(teacher.finalProgress,50)});
test('Quran progress includes Tahfiz records that have no Tahsin level',()=>{const result=G.summarize({schedule:current,master,scores:[score('a','ANAK A','Tahsin Praktek','FINAL'),score('b','ANAK B','Tahfiz Al-Qur’an','FINAL',{tahsinLevel:null})],type:'bulanan',year:'2026/2027',period:'September',unit:'PUTRA'}),teacher=result.find(x=>x.teacherCode==='G02');assert.equal(teacher.entered,2);assert.equal(teacher.final,2);assert.equal(teacher.finalProgress,100)});
test('Supervisor and Manager use the same schedule progress resolver',()=>{const supervisor=fs.readFileSync(path.join(root,'supervisor/laporan-akademik.html'),'utf8'),manager=fs.readFileSync(path.join(root,'js/manager-education-v2.js'),'utf8');for(const source of [supervisor,manager]){assert(source.includes('CahayaAcademicInputProgress'));assert(source.includes('.summarize('))}});
test('Supervisor review merges every scheduled subject with Final and visible Draft records',()=>{const html=fs.readFileSync(path.join(root,'supervisor/laporan-akademik.html'),'utf8');for(const text of ['Review Rapor','Progres Input Nilai','expectedSubjects(student)','P.reviewScoreRecords','P.reportRows(x.reviewRecords,x.expected)','showWorkflowStatus:true','cahaya_app/jadwal_pelajaran'])assert(html.includes(text),text)});

console.log(`${checks} academic input progress tests passed.`);
