const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const context={window:{},console,Intl,Date,Map,Set};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/guru-kpi-v144.js','utf8'),context);

const K=context.window.CahayaGuruKPI;
const schedule=JSON.parse(fs.readFileSync('data/jadwal-pelajaran-awal-2026-2027.json','utf8'));

assert.equal(K.version,'182');

const accountIdentity=K.identityFromProfile({
  username:'rosyidin',
  label:'Rosyidin'
},schedule);
assert.equal(accountIdentity.code,'RASYIDIN','variasi ejaan akun harus dipetakan ke kode jadwal stabil');

const assigned=K.assignedSchedule(schedule,accountIdentity);
assert.equal(assigned.length,4,'akun Rosyidin harus membaca empat jadwal aktif Kepondokan');
assert.deepEqual(
  assigned.map(row=>[row.hari,row.kelas,row.mapel]).sort((a,b)=>a[0]-b[0]),
  [
    [1,'Kelas 2 Putra','Fiqih'],
    [2,'Kelas 1 Putra','Fiqih'],
    [3,'Kelas 4 Putra','Nahwu Sharaf'],
    [4,'Kelas 3 Putra','Fiqih']
  ]
);

const renamedIdentity=K.identityFromProfile({
  teacherCode:'RASYIDIN',
  username:'rosyidin',
  label:'Nama Tampilan Baru'
},schedule);
assert.equal(renamedIdentity.code,'RASYIDIN');
assert.equal(K.assignedSchedule(schedule,renamedIdentity).length,4,'nama tampilan tidak boleh memutus jadwal');

assert.equal(
  fs.readFileSync('js/guru-kpi-v144.js','utf8'),
  fs.readFileSync('docs/js/guru-kpi-v144.js','utf8'),
  'mirror docs harus sama'
);
assert.match(fs.readFileSync('js/guru-home-hub.js','utf8'),/guru-kpi-v144\.js\?v=182/);
assert.match(fs.readFileSync('home-guru.html','utf8'),/guru-home-hub\.js\?v=205/);

console.log('PASS Rosyidin/Rasyidin identity, four active schedules, stable teacherCode, mirrors and cache versions');
