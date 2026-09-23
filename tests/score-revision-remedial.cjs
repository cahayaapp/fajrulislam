const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const N=require('../js/role-navigation-v2.js');
const manager=fs.readFileSync('js/manager-education-v2.js','utf8');
const guru=fs.readFileSync('guru/inputNilaiUjian.html','utf8');
const report=fs.readFileSync('wali/dashboard/akademik.html','utf8');
const pick=name=>{const match=manager.match(new RegExp(`function ${name}\\([^]*?\\n\\}`));assert(match,name);return match[0]};
const context={
  unit:'PUTRA',state:{schedule:[{mapel:'Fiqih',guruKode:'G01',kelas:'Kelas 4 Putra'},{mapel:'Fiqih',guruKode:'G01',kelas:'Kelas 4 Putri'}]},
  norm:v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' '),
  isPkbm:x=>String([x.programDomain,x.kelas,x.kelas_kelompok,x.kelasScope].filter(Boolean).join(' ')).toLowerCase().includes('pkbm'),
  unitOf:x=>String(x.kelas||x.kelas_kelompok||'').toLowerCase().includes('putri')?'PUTRI':String(x.kelas||x.kelas_kelompok||'').toLowerCase().includes('putra')?'PUTRA':''
};
vm.createContext(context);
vm.runInContext(pick('sessionClasses')+'\n'+pick('scoreSessionScope'),context);
const marker={sessionVersion:'v805',sessionKey:'k123',status:'FINAL',mapel:'Fiqih',guru:'Guru A',guruKode:'G01',jenisUjian:'Bulanan',periode:'September 2026',tahunAkademik:'2026/2027',kodePenilaian:'kitab',kelasScope:'Kelas 4 Putra'};
const item={recordKey:'rec-1',dbPath:'cahaya_app/nilai_ujian_bulanan',data:{kelas_kelompok:'Kelas 4 Putra',guru_penguji:'Guru A',mata_pelajaran:'Fiqih',jenis_ujian:'Bulanan',periode_ujian:'September 2026',tahun_akademik:'2026/2027',kode_penilaian:'kitab'}};
assert.equal(context.scoreSessionScope(marker,[item]),true);
assert.equal(context.scoreSessionScope({...marker,kelasScope:'Kelas 4 Putra | Kelas 4 Putri'},[item]),false,'manager cannot partially unlock a combined session');
assert.equal(context.scoreSessionScope(marker,[{...item,data:{...item.data,programDomain:'PKBM'}}]),false);
assert.equal(context.scoreSessionScope(marker,[{...item,data:{...item.data,jenis_ujian:'Triwulan'}}]),false);
const managerSession={mode:'canonical',activeRole:'MANAJER',activeAssignment:{area:'PENDIDIKAN',unit:'PUTRA',programDomain:'KEPONDOKAN',managedRoles:['GURU_PONDOK']}};
const supervisorSession={mode:'canonical',activeRole:'SUPERVISOR',activeAssignment:{unit:'PUTRA',programDomain:'KEPONDOKAN',divisionIds:['PENDIDIKAN'],supervisedRoles:['GURU_PONDOK']}};
const directorSession={mode:'canonical',activeRole:'DIREKTUR',activeAssignment:{unit:'ALL'}};
const teacherSession={mode:'canonical',activeRole:'GURU_PONDOK',activeAssignment:{unit:'PUTRA',programDomain:'KEPONDOKAN'}};
const route='manajer/pendidikan-v2.html?view=scores';
for(const s of [managerSession,supervisorSession,directorSession])assert.equal(N.canAccessRoute(s,route).ok,true,s.activeRole);
assert.equal(N.canAccessRoute(teacherSession,route).ok,false);
assert.equal(N.canAccessRoute(supervisorSession,'manajer/pendidikan-v2.html?view=coaching').ok,false);
for(const path of ['guru/inputNilaiUjian.html','js/manager-education-v2.js','js/role-navigation-v2.js','wali/dashboard/akademik.html','supervisor/review-pendidikan.html','supervisor/raport-bulanan.html','admin/rapot-uas.html'])assert.equal(fs.readFileSync(path,'utf8'),fs.readFileSync('docs/'+path,'utf8'),path+' mirror');
for(const code of ['finalData.is_remedial=Boolean(remedial?.checked)','remedial.dataset.dirty','verifyWritableScoreSession(params,rowsToSave)','revision_history','final_history','scoreStatusVerified=false'])assert(guru.includes(code),code);
for(const period of ['Bulanan','Triwulan','Semester'])assert(guru.includes(`selectExamType('${period}')`),period);
assert(guru.match(/function scoreSessionKey[^]*?params\.jenis,[^]*?params\.periode/),'jenis ujian and period are part of session key');
assert(report.includes('Remedial pada penilaian bulanan'));
assert(manager.includes('await update(ref(db),updates)'));
assert(fs.readFileSync('supervisor/review-pendidikan.html','utf8').includes('../manajer/pendidikan-v2.html?view=scores'));
console.log('PASS: session scope, role routes, draft/final/remedial contracts and docs mirrors (fixture/static checks, no Firebase writes).');
