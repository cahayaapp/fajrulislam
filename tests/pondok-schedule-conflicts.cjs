const fs=require('node:fs'),assert=require('node:assert/strict');
const rows=JSON.parse(fs.readFileSync('data/jadwal-pelajaran-awal-2026-2027.json'));
const migration=require('../js/teacher-reassignment-20261101.js');
const core=rows.filter(r=>r.aktif!==false&&r.jenis==='inti');
const timed=rows.filter(r=>r.aktif!==false&&['inti','harian'].includes(r.jenis)&&r.jamMulai&&r.jamSelesai);
// Confirmed teaching groups, not a blanket exemption for matching subjects.
const groups=[
 ['MULTAZAM','Aqidah Tasawuf',['Kelas 4 Putra','Kelas 5 Putra','Kelas 4 Putri']],
 ['ZAWAWI','Hadits Ahkam',['Kelas 4 Putra','Kelas 5 Putra','Kelas 4 Putri']],
 ['MULTAZAM','Bahasa Arab',['Kelas 3 Putra','Kelas 4 Putra','Kelas 5 Putra']],
 ['MULTAZAM','Al-Qur’an',['Kelas 4 Putra','Kelas 5 Putra']],
 ['ALAMANDA','Bahasa Arab',['Kelas 3 Putri','Kelas 4 Putri']],
 ['ALAMANDA','Al-Qur’an',['Kelas 3 Putri','Kelas 4 Putri']]
];
function allowed(a,b){
 if(a.guruKode!==b.guruKode||a.jamMulai!==b.jamMulai||a.jamSelesai!==b.jamSelesai)return false;
 const friday=a.hari===5&&a.guruKode==='MULTAZAM'&&a.kelas==='Kelas 4 Putri'&&b.kelas===a.kelas&&new Set([a.mapel,b.mapel]).size===2&&[a.mapel,b.mapel].every(x=>['Nahwu Sharaf','Shirah'].includes(x));
 return friday||groups.some(([teacher,subject,classes])=>a.guruKode===teacher&&a.mapel===subject&&b.mapel===subject&&classes.includes(a.kelas)&&classes.includes(b.kelas)&&a.kelas!==b.kelas);
}
let exceptions=0;
for(let i=0;i<timed.length;i++)for(const b of timed.slice(i+1)){
 const a=timed[i];if(a.hari!==b.hari||a.jamMulai>=b.jamSelesai||b.jamMulai>=a.jamSelesai)continue;
 if(a.kelas!==b.kelas&&a.guruKode!==b.guruKode)continue;
 assert(allowed(a,b),`Collision day ${a.hari}: ${a.kelas} ${a.mapel} ${a.guruKode} / ${b.kelas} ${b.mapel} ${b.guruKode}`);exceptions++;
}
const expected=[['Kelas 1 Putra','Adab',2,'ZAKY'],['Kelas 1 Putra','Fiqih',4,'RASYIDIN'],['Kelas 3 Putra','Fiqih',2,'RASYIDIN'],['Kelas 3 Putra','Shirah',4,'RAHIEL']];
for(const [kelas,mapel,hari,guruKode] of expected){
 const row=core.find(r=>r.kelas===kelas&&r.mapel===mapel);assert.equal(row.hari,hari);assert.equal(row.guruKode,guruKode);
 const patch=migration.patch({...row,hari:hari===2?4:2});assert.equal(patch.hari,hari);assert.equal(migration.patch(row),null);
}
assert.equal(fs.readFileSync('data/jadwal-pelajaran-awal-2026-2027.json','utf8'),fs.readFileSync('docs/data/jadwal-pelajaran-awal-2026-2027.json','utf8'));
console.log(`PASS all ${timed.length} timed Pondok lessons: zero unapproved collisions; ${exceptions} approved overlaps; four moves and idempotent migrations`);
