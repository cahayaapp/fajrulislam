'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const migration=require('../js/teacher-reassignment-20261101.js');
const rows=require('../data/jadwal-pelajaran-awal-2026-2027.json');
const counts=Object.fromEntries(['ZAWAWI','DONY','MULTAZAM'].map(code=>[code,rows.filter(r=>r.guruKode===code)]));
assert.equal(counts.ZAWAWI.length,6);
assert.equal(counts.ZAWAWI.filter(r=>r.mapel==='Hadits Ahkam').length,3);
assert.equal(counts.ZAWAWI.filter(r=>r.mapel==='Adab').length,1);
assert.equal(counts.ZAWAWI.filter(r=>r.mapel==='Hadits').length,2);
assert.equal(counts.DONY.filter(r=>r.mapel==='Aqidah').length,1);
assert.equal(counts.MULTAZAM.filter(r=>/qur/i.test(r.mapel)&&r.kelas==='Kelas 4 Putra').length,8);
assert.equal(rows.filter(r=>r.guruKode==='FAIQ'&&/qur/i.test(r.mapel)).length,0);
assert(rows.every(r=>migration.patch(r)===null),'Migration must be idempotent');
assert.equal(migration.patch({guruKode:'FAIQ',mapel:'Hadits',kelas:'Kelas 2 Putra',hari:4}).guruKode,'ZAWAWI','Transfer Faiq Hadits class 2');
assert.equal(migration.patch({guruKode:'NAQIEB',mapel:'Adab',kelas:'Kelas 1 Putra'}),null,'Retain Nagib Adab class 1');
assert.equal(migration.patch({guruKode:'FATIMAH',mapel:'Aqidah',kelas:'Kelas 1 Putri'}),null,'Retain unrelated Putri assignment');
const original={id:'stable-id',guruKode:'FAIQ',guruNama:'Faiq Akbar Firdaus',mapel:'Al-Qur’an',kelas:'Kelas 4 Putra',jamMulai:'07:00'};
assert.deepEqual({...original,...migration.patch(original)},{...original,guruKode:'MULTAZAM',guruNama:'Multazam'});
const context={window:{},console,Intl,Date,Map,Set};vm.createContext(context);vm.runInContext(fs.readFileSync('js/guru-kpi-v144.js','utf8'),context);const K=context.window.CahayaGuruKPI;
for(const profile of [{username:'muhammadzawawi',label:'Muhammad Zawawi'},{teacherCode:'ZAWAWI',label:'Nama Baru'}])assert.equal(K.assignedSchedule(rows,K.identityFromProfile(profile,rows)).length,6);
for(const file of ['guru/absenguru.html','guru/absensiPembelajaran.html','guru/gurumenulis.html','cetak-kalender-materi.html','rpp-generator.html']){
 const text=fs.readFileSync(file,'utf8'),c={};const match=text.match(/const CLASS_TEACHERS\s*=\s*\{[\s\S]*?\};/);assert(match,file);vm.runInNewContext(match[0]+';this.teachers=CLASS_TEACHERS;',c);
 assert.equal(c.teachers[1][1],'DONY',file);assert.equal(c.teachers[2][2],'ZAWAWI',file);assert.equal(c.teachers[3][1],'ZAWAWI',file);assert.equal(c.teachers[3][3],'ZAWAWI',file);assert.equal(c.teachers[4][4],'ZAWAWI',file);assert.equal(c.teachers[5][4],'ZAWAWI',file);
 assert(!/subject:\s*"Al-Qur’an",\s*teacher:\s*"FAIQ"/.test(text),file);
 assert.equal(text,fs.readFileSync('docs/'+file,'utf8'));
}
const html=fs.readFileSync('admin/atur-jadwal.html','utf8');const defaultRows=JSON.parse(html.match(/const DEFAULT_ROWS=(\[[^\n]+?\]);/)[1]);assert.deepEqual(defaultRows,rows);
console.log('PASS assignment counts, preserved sessions, idempotent migration, Zawawi identity, attendance/material fallback maps and mirrors');
// The approved Tuesday/Thursday swap preserves every session key and teacher.
for(const day of [1,2,3,4])assert.equal(new Set(counts.ZAWAWI.filter(r=>r.hari===day).map(r=>r.mapel)).size,1,`One subject on weekday ${day}`);
assert(counts.ZAWAWI.filter(r=>r.mapel==='Hadits Ahkam').every(r=>r.hari===4&&r.hariLabel==='Kamis'));
assert(rows.some(r=>r.kelas==='Kelas 4 Putra'&&r.mapel==='Shirah'&&r.hari===2&&r.guruKode==='RAHIEL'));
assert(rows.some(r=>r.kelas==='Kelas 5 Putra'&&r.mapel==='Manajemen dan Bisnis'&&r.hari===2&&r.guruKode==='MULTAZAM'));
for(const file of ['guru/absenguru.html','guru/absensiPembelajaran.html','guru/gurumenulis.html','cetak-kalender-materi.html','rpp-generator.html']){
 const text=fs.readFileSync(file,'utf8');
 for(const name of ['CLASS_SCHEDULE','PUTRI_CLASS_SCHEDULE','PUTRI_CLASS_TEACHERS']){
  const match=text.match(new RegExp('const '+name+'\\s*=\\s*\\{[\\s\\S]*?\\};')),c={};assert(match,file);vm.runInNewContext(match[0]+';this.map='+name+';',c);
  assert.equal(c.map[4][4],name==='PUTRI_CLASS_TEACHERS'?'ZAWAWI':'Hadits Ahkam',file+' '+name);
  if(name==='CLASS_SCHEDULE'){assert.equal(c.map[4][2],'Shirah');assert.equal(c.map[5][2],'Manajemen dan Bisnis');assert.equal(c.map[5][4],'Hadits Ahkam')}
  else assert.equal(c.map[4][2],undefined);
 }
}
assert.deepEqual(migration.patch({id:'stable',guruKode:'ZAWAWI',mapel:'Hadits Ahkam',kelas:'Kelas 4 Putra',hari:2}),{hari:4,hariLabel:'Kamis'});
console.log('PASS Thursday swap, one subject per day and matching fallback day/teacher dictionaries');

assert(rows.some(r=>r.kelas==='Kelas 2 Putra'&&r.mapel==='Hadits'&&r.guruKode==='ZAWAWI'&&r.hari===2));
assert(rows.some(r=>r.kelas==='Kelas 2 Putra'&&r.mapel==='Adab'&&r.guruKode==='ZAKY'&&r.hari===4));
assert.deepEqual(migration.patch({guruKode:'ZAWAWI',mapel:'Adab',kelas:'Kelas 2 Putra',hari:2}),{guruKode:'ZAKY',guruNama:'Zaky',hari:4,hariLabel:'Kamis'});
for(const file of ['guru/absenguru.html','guru/absensiPembelajaran.html','guru/gurumenulis.html','cetak-kalender-materi.html','rpp-generator.html']){
 const text=fs.readFileSync(file,'utf8'),c={};
 for(const name of ['CLASS_SCHEDULE','CLASS_TEACHERS']){const match=text.match(new RegExp('const '+name+'\\s*=\\s*\\{[\\s\\S]*?\\};'));vm.runInNewContext(match[0]+';this.'+name+'='+name+';',c)}
 assert.equal(c.CLASS_SCHEDULE[2][2],'Hadits');assert.equal(c.CLASS_TEACHERS[2][2],'ZAWAWI');assert.equal(c.CLASS_SCHEDULE[2][4],'Adab');assert.equal(c.CLASS_TEACHERS[2][4],'ZAKY');
}
console.log('PASS class 2 teacher and day exchange, including all fallback schedules');
