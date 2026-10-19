const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const C=require('../js/admin-master-v2-core.js');

const classes={'Kelas 1 Putra':['AHMAD','FAUZAN'],'Kelas 2 Putra':['AKBAR']};
const usrah={'Usrah 1':['AHMAD','AKBAR'],'Usrah 2':['FAUZAN']};
const rooms={'Kamar A':['AHMAD','FAUZAN'],'Kamar B':['AKBAR']};
const students=C.studentRows(classes,usrah,rooms);
assert.equal(students.length,3);
assert.equal(students.find(x=>x.nama==='AHMAD').kelas[0],'Kelas 1 Putra');
assert.equal(students.find(x=>x.nama==='AHMAD').usrah[0],'Usrah 1');
assert.match(students.find(x=>x.nama==='AHMAD').studentKey,/^legacy-/);

const moved=C.replaceMember(classes,'AHMAD','AHMAD','Kelas 2 Putra');
assert(!moved['Kelas 1 Putra'].includes('AHMAD'));
assert(moved['Kelas 2 Putra'].includes('AHMAD'));
const renamed=C.replaceMember(classes,'AHMAD','AHMAD BARU','Kelas 1 Putra');
assert(renamed['Kelas 1 Putra'].includes('AHMAD BARU'));
assert(!renamed['Kelas 1 Putra'].includes('AHMAD'));

const programs=C.programRows({spiritual:{subuh:{nama:'Shalat Subuh',mulai:'04:30',selesai:'05:00',wajibAbsen:true,wajibLaporan:true,hariAktif:['senin']}}});
assert.equal(programs.length,1);
assert.equal(programs[0].sourcePath,'spiritual/subuh');
assert.equal(programs[0].wajibAbsen,true);
assert.equal(programs[0].wajibLaporan,true);
assert.deepEqual(programs[0].hariAktif,['senin']);
const programSandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/program-harian-24jam-v45.js'),'utf8'),programSandbox);
const resolvedPrograms=C.resolveProgramCatalog({
  daily:programSandbox.window.CAHAYA_PROGRAM_HARIAN_24JAM,
  weekly:programSandbox.window.CAHAYA_PROGRAM_PEKANAN_PENGASUHAN,
  schedule:{},
  master:{Spiritual:{'Shalat Subuh Berjamaah':{poin:0}}},
  attendanceDefaults:programSandbox.window.CAHAYA_PROGRAM_ABSENSI_DEFAULTS
});
assert(resolvedPrograms.length>=32,'canonical 24-hour and weekly programs must remain visible when schedule path is empty');
assert(resolvedPrograms.filter(x=>x.wajibAbsen).length>=16,'Naqib attendance programs must be marked from the shared catalog');
assert.equal(resolvedPrograms.filter(x=>x.wajibLaporan).length,resolvedPrograms.length,'canonical operational programs must default to required reports');
assert.equal(resolvedPrograms.filter(x=>/subuh/i.test(x.nama)).length,1,'master and canonical aliases must not create duplicate Subuh programs');
const overridden=C.resolveProgramCatalog({daily:programSandbox.window.CAHAYA_PROGRAM_HARIAN_24JAM,schedule:{subuh:{nama:'Shalat Subuh',aktif:false,wajibAbsen:false,wajibLaporan:false}},attendanceDefaults:programSandbox.window.CAHAYA_PROGRAM_ABSENSI_DEFAULTS});
assert.equal(overridden.find(x=>/subuh/i.test(x.nama)).aktif,false,'admin schedule override must win over canonical fallback');
const policy=require('../js/naqib-program-today.js');
const base=[{id:'subuh',name:'Shalat Subuh',time:'04:30–05:00'},{id:'makan',name:'Sarapan',time:'06:15–06:40'}];
assert.deepEqual(policy.applyProgramPolicy(base,{subuh:{nama:'Shalat Subuh',wajibLaporan:false},sarapan:{nama:'Sarapan',wajibLaporan:true}},'wajibLaporan',new Date('2026-10-19T05:00:00+07:00')).map(x=>x.name),['Sarapan']);

const schedules=C.scheduleRows({a:{kelas:'Kelas 1 Putra',mapel:'Fiqih'},meta:{versi:'x'}});
assert.equal(schedules.length,1);
assert.equal(schedules[0]._sourceKey,'a');
assert.equal(C.inferLevel('PKBM XI'),'PKBM SMA');
assert.equal(C.inferLevel('Kelas 3 Putri'),'Kepondokan');
assert.equal(C.featureRoleKey('GURU_PONDOK'),'guru-pondok');
assert.equal(C.featureRoleKey('Administrator'),'admin');
assert.deepEqual(C.applyFeatureRule(['menu-home','menu-nilai','menu-chat'],{roles:{guru:{enabledMenus:['menu-nilai']}}},['guru']),['menu-home','menu-nilai']);
assert.deepEqual(C.applyFeatureRule(['menu-home','menu-nilai'],{roles:{}},['guru']),['menu-home','menu-nilai']);

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'admin/database.html'),'utf8');
for(const view of ['santri','sdm','sekolah','asrama','jadwal','program','user','fitur'])assert(html.includes(`data-view="${view}"`),`missing ${view}`);
const js=fs.readFileSync(path.join(root,'js/admin-master-v2.js'),'utf8');
for(const p of ['cahaya_app/master_akademik','cahaya_app/master_usrah','cahaya_app/jadwal_pelajaran','cahaya_app/jadwal_program_harian'])assert(js.includes(p),`missing path ${p}`);
assert(!html.includes('const db = getDatabase'));
const dashboard=fs.readFileSync(path.join(root,'main-dashboard.html'),'utf8');
for(const menu of ['menu-db-master','menu-admin-sdm','menu-admin-sekolah','menu-admin-asrama','menu-jadwal','menu-admin-program','menu-users','menu-admin-features'])assert(dashboard.includes(`id="${menu}"`),`missing admin menu ${menu}`);
assert(dashboard.includes("settings').doc('feature_management')"),'dashboard must load feature management overlay');
assert(dashboard.includes('featureMenuAllowed(gabunganMenu[i], rolesUntukMenu)'),'legacy menus must honor feature management after core menus');
assert(dashboard.includes('featureFilteredModel'),'Role V2 menus must honor feature management');
assert(dashboard.includes("activeNow === 'admin'"),'admin landing override missing');
assert(dashboard.includes("activeRoleForPage === 'admin'"),'admin home route override missing');
assert(dashboard.includes("gabunganMenu.splice(0, gabunganMenu.length, ...adminMenus)"),'legacy admin menu override missing');
const adminDefault=(dashboard.match(/admin:\[(.*?)\],/)||[])[1]||'';
assert(!adminDefault.includes('menu-dashboard-operasional'),'admin must not inherit operational dashboard');
assert(!adminDefault.includes('menu-keputusan-direktur'),'admin must not inherit director decisions');
console.log('admin-master-v2: all assertions passed');
