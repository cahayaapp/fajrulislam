'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const R = require('../js/wali-academic-report-v2.js');

const base = { nama_santri:'ANAK A', studentKey:'anak-a', tahun_akademik:'2026/2027', status_nilai:'FINAL', locked:true, nilai_total:84 };
const records = [
  {...base,id:'m1',jenis_ujian:'Bulanan',periode_ujian:'September',bulan:'September',mata_pelajaran:'Fiqih'},
  {...base,id:'t1',jenis_ujian:'Triwulan',periode_ujian:'Triwulan 1',mata_pelajaran:'Fiqih',nilai_total:86},
  {...base,id:'t2',jenis_ujian:'Triwulan',periode_ujian:'Triwulan 2',mata_pelajaran:'Fiqih',nilai_total:87},
  {...base,id:'s1',jenis_ujian:'Semester',periode_ujian:'Semester 1',semester:'Ganjil',mata_pelajaran:'Fiqih',nilai_total:88,is_remedial:true},
  {...base,id:'draft',jenis_ujian:'Semester',periode_ujian:'Semester 1',semester:'Ganjil',mata_pelajaran:'Bahasa Arab',status_nilai:'DRAFT',locked:false,nilai_total:99},
  {...base,id:'other',nama_santri:'ANAK B',studentKey:'anak-b',jenis_ujian:'Triwulan',periode_ujian:'Triwulan 1',mata_pelajaran:'Fiqih',nilai_total:100},
  {...base,id:'legacy',jenis_ujian:'Triwulan',periode_ujian:'Triwulan 1',mata_pelajaran:'Adab',status_nilai:'',nilai_total:90}
];
const student={name:'ANAK A',studentKey:'anak-a'};
assert.deepEqual(R.filterScores(records,{tab:'bulanan',year:'2026/2027',period:'September',student}).map(x=>x.id),['m1']);
assert.deepEqual(R.filterScores(records,{tab:'triwulan',year:'2026/2027',period:'Triwulan 1',student}).map(x=>x.id),['t1']);
assert.deepEqual(R.filterScores(records,{tab:'semester',year:'2026/2027',period:'Semester 1',student}).map(x=>x.id),['s1']);
assert.deepEqual(R.summary(R.filterScores(records,{tab:'semester',year:'2026/2027',period:'Semester 1',student})),{subjects:1,average:88,remedial:1});
assert.equal(R.isFinal(records.find(x=>x.id==='draft')),false);
assert.equal(R.isFinal(records.find(x=>x.id==='legacy')),false);
const page=fs.readFileSync(require.resolve('../wali/dashboard/akademik.html'),'utf8');
const input=fs.readFileSync(require.resolve('../guru/inputNilaiUjian.html'),'utf8');
const manager=fs.readFileSync(require.resolve('../js/manager-education-v2.js'),'utf8');
const session=fs.readFileSync(require.resolve('../wali/dashboard/script.js'),'utf8');
for(const contract of ['id="reportTypeStep"','id="reportPeriodStep"','id="reportContentStep"','readStudentScoreIndex(\'cahaya_app/nilai_ujian\'','selectedPeriodicScores()','rapor-triwulan','rapor-semester','checkPublicationAndRender'])assert(page.includes(contract),contract);
assert(input.includes('/nilai_akademik/${recordKey}`] = finalData'));
assert(manager.includes('/nilai_akademik/${item.recordKey}`]=data'));
assert(session.includes('"cahaya_app/nilai_ujian":"nilai_akademik"'));
console.log('Wali Academic Report V2: exact periods, FINAL-only, student isolation, no synthetic aggregation, remedial display policy: PASS');
