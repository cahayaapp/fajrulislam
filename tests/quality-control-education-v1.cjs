const assert=require('node:assert/strict');
const Q=require('../js/quality-control-education-v1.js');

const attendance=Q.attendanceSummary([
  {status:'HADIR'},{status:'TERLAMBAT'},{status:'ALFA'},{status:'IZIN'},{status:'SAKIT'}
]);
assert.equal(attendance.attendance,66.7,'izin dan sakit netral dari kesempatan hadir efektif');
assert.equal(attendance.punctuality,50,'ketepatan waktu hanya dibanding guru/santri yang hadir');
assert.equal(attendance.excusedAbsence,40,'izin/sakit dilaporkan terhadap seluruh status tercatat');

const teacher=Q.teacherQuality({
  month:'2026-10',unit:'PUTRA',asOf:'2026-10-31',
  schedule:[{hari:'Senin',kelas:'Kelas 1 Putra',mapel:'Fiqih',guruNama:'Ustadz A',aktif:true}],
  attendance:[
    {tanggal:'2026-10-05',kelas:'Kelas 1 Putra',mapel:'Fiqih',guruNama:'Ustadz A',status:'HADIR'},
    {tanggal:'2026-10-12',kelas:'Kelas 1 Putra',mapel:'Fiqih',guruNama:'Ustadz A',status:'TERLAMBAT'}
  ],
  leaves:[{tanggalMulai:'2026-10-19',tanggalSelesai:'2026-10-19',guruNama:'Ustadz A',status:'DISETUJUI'}]
});
assert.equal(teacher.expected,4);
assert.equal(teacher.present,2);
assert.equal(teacher.onTime,1);
assert.equal(teacher.excused,1);
assert.equal(teacher.undetected,1);
assert.equal(teacher.attendance,50);
assert.equal(teacher.punctuality,50);
assert.equal(teacher.undetectedPct,25);

const exams=Q.examSummary([
  {tanggal:'2026-10-01',kelas:'Kelas 1 Putra',status_nilai:'FINAL',nilai_total:80,kkm:75},
  {tanggal:'2026-10-02',kelas:'Kelas 1 Putra',status_nilai:'FINAL',nilai_total:70,kkm:75},
  {tanggal:'2026-10-03',kelas:'Kelas 1 Putra',status_nilai:'DRAFT',nilai_total:100,kkm:75},
  {tanggal:'2026-09-30',kelas:'Kelas 1 Putra',status_nilai:'FINAL',nilai_total:100,kkm:75}
],'2026-10','PUTRA',75);
assert.deepEqual(exams,{pass:1,fail:1,total:2,passPct:50,failPct:50});

const tahfiz=Q.tahfizSummary([
  {tanggal:'2026-10-01',kelas:'Kelas 2 Putra',program:'Tahfiz Al-Quran',baris:5,targetBarisHarian:5},
  {tanggal:'2026-10-02',kelas:'Kelas 2 Putra',program:'Tahfiz Al-Quran',baris:3,targetBarisHarian:5},
  {tanggal:'2026-10-03',kelas:'Kelas 2 Putra',program:'Tahsin',baris:9,targetBarisHarian:5}
],'2026-10','PUTRA');
assert.equal(tahfiz.percent,50);

const violations=Q.violationSummary([
  {tanggal:'2026-10-01',kelas:'Kelas 1 Putra',tipe:'PELANGGARAN',kategori:'Adab'},
  {tanggal:'2026-10-02',kelas:'Kelas 1 Putra',tipe:'PELANGGARAN',kategori:'Terlambat'},
  {tanggal:'2026-10-03',kelas:'Kelas 1 Putri',tipe:'PELANGGARAN',kategori:'Adab'}
],'2026-10','PUTRA');
assert.equal(violations.total,1,'pelanggaran waktu dan unit lain tidak ikut dihitung');
assert.equal(violations.categories.Adab,1);

const counseling=Q.counselingSummary([
  {id:'a',tanggal:'2026-10-01',kelas:'Kelas 1 Putra',tipe:'KASUS'},
  {id:'b',tanggal:'2026-10-02',kelas:'Kelas 1 Putra',tipe:'KASUS'}
],[{tanggal:'2026-10-03',kelas:'Kelas 1 Putra',sourceCaseId:'a',status:'SELESAI'}],'2026-10','PUTRA');
assert.equal(counseling.percent,50);

console.log('quality-control-education-v1: ok');
