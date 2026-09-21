'use strict';
const assert=require('node:assert/strict');
const R=require('../js/role-system-v2.js'),N=require('../js/role-navigation-v2.js');
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS',name)}
function session(role,assignment={},extra={}){return R.resolveSession({uid:'fixture-user',roleSystemVersion:2,roles:[role],assignments:{[role]:assignment},...extra})}
const menu=(s,m)=>R.can(s.activeRole,m,s.activeAssignment);
test('exact canonical registry: 15 roles including MANAJER',()=>{
  assert.equal(R.ROLE_IDS.length,15);assert.equal(R.exactRole('guru'),'');assert.equal(R.exactRole('guru_pondok'),'');
  assert(!R.ROLE_IDS.includes('ADMIN'));assert(!R.ROLE_IDS.includes('KONSELOR_MUDA'));
});
test('single Guru Pondok uses approved Home and no PKBM domain',()=>{
  const s=session('GURU_PONDOK');assert.equal(s.activeAssignment.programDomain,'KEPONDOKAN');
  assert.equal(R.homeFor(s.activeRole),'home-guru.html?v=201');assert(menu(s,'menu-nilai'));assert(!menu(s,'menu-users'));
  assert(R.authorize(s,'education.read',{programDomain:'KEPONDOKAN'}));assert(!R.authorize(s,'education.read',{programDomain:'PKBM'}));
});
test('canonical roles ignore old admin/allowedMenus grants',()=>{
  const s=session('GURU_PONDOK',{}, {akses:['admin'],allowedMenus:['menu-users'],workspaceRoles:['admin']});
  assert(!menu(s,'menu-users'));assert.deepEqual(s.roles,['GURU_PONDOK']);
});
test('Director + Guru role switch changes Home and assignment without union',()=>{
  const storage=new Map(),store={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
  let s=session('DIREKTUR',{unit:'ALL'},{roles:['DIREKTUR','GURU_PONDOK'],defaultRole:'DIREKTUR',assignments:{DIREKTUR:{unit:'ALL'},GURU_PONDOK:{programDomain:'KEPONDOKAN'}}});
  assert(R.homeFor(s.activeRole).startsWith('home-direktur'));
  s=R.switchRole(s,'GURU_PONDOK',store).session;
  assert.equal(s.activeAssignment.unit,'');assert.equal(s.activeAssignment.programDomain,'KEPONDOKAN');assert(!menu(s,'menu-keputusan-direktur'));
  assert.equal(storage.get('cahayaActiveRoleV2'),'GURU_PONDOK');assert.equal(storage.get('cahayaActiveRole'),'guru');
  assert(!R.switchRole(s,'MANAJER',store).ok);
});
test('Naqib/Naqibah share Home; reporting and positive points do not grant case handling',()=>{
  for(const [role,unit,other] of [['NAQIB','PUTRA','PUTRI'],['NAQIBAH','PUTRI','PUTRA']]){
    const s=session(role);assert(R.homeFor(role).startsWith('home-naqib'));
    assert(menu(s,'menu-gamifikasi'));assert(menu(s,'menu-laporan-murojaah'));assert(!menu(s,'menu-antrean-kasus'));
    assert(R.authorize(s,'initiative.record',{unit}));assert(!R.authorize(s,'initiative.record',{unit:other}));
    assert(!R.authorize(s,'case.handle',{unit}));assert(!R.authorize(s,'initiative.record',{}));
  }
});
test('Supervisor Dapur/Sarpras excludes Pendidikan, including direct data access',()=>{
  const s=session('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['DAPUR','SARPRAS']});
  assert(menu(s,'menu-supervisor-v2'));assert(!menu(s,'menu-jurnal-sarpras'));assert(!menu(s,'menu-review-pendidikan'));
  assert(R.authorize(s,'operations.read',{roleId:'DAPUR',unit:'PUTRA'}));
  assert(!R.authorize(s,'operations.read',{roleId:'GURU_PONDOK',unit:'PUTRA',programDomain:'KEPONDOKAN'}));
  assert(!R.authorize(s,'operations.read',{roleId:'DAPUR',unit:'PUTRI'}));
});
test('Supervisor Pendidikan excludes Dapur and PKBM unless assigned',()=>{
  const s=session('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['GURU_PONDOK']});
  assert(menu(s,'menu-supervisor-v2'));assert(!menu(s,'menu-review-pendidikan'));assert(!menu(s,'menu-jurnal-sarpras'));
  assert(R.authorize(s,'operations.read',{roleId:'GURU_PONDOK',unit:'PUTRA',programDomain:'KEPONDOKAN'}));
  assert(!R.authorize(s,'operations.read',{roleId:'DAPUR',unit:'PUTRA'}));
  assert(!R.authorize(s,'operations.read',{roleId:'GURU_PKBM',unit:'PUTRA',programDomain:'PKBM'}));
});
test('Manager Guru Pondok sees only assigned Kepondokan unit/domain',()=>{
  const s=session('MANAJER',{unit:'PUTRA',managedRoles:['GURU_PONDOK'],programDomain:'KEPONDOKAN'});
  assert(menu(s,'menu-kontrol-pendidikan'));assert(!menu(s,'menu-kontrol-pembinaan'));
  const resources=[{id:'pondok',roleId:'GURU_PONDOK',unit:'PUTRA',programDomain:'KEPONDOKAN'},{id:'pkbm',roleId:'GURU_PKBM',unit:'PUTRA',programDomain:'PKBM'},{id:'putri',roleId:'GURU_PONDOK',unit:'PUTRI',programDomain:'KEPONDOKAN'}];
  assert.deepEqual(R.filterResources(s,'operations.read',resources,x=>x).map(x=>x.id),['pondok']);
});
test('Mentor USRAH_3 can see only Usrah 3; missing resource scope denied',()=>{
  const s=session('MENTOR_USRAH',{usrahIds:['USRAH_3']});
  assert(R.authorize(s,'mentoring.read',{usrahId:'USRAH_3'}));assert(!R.authorize(s,'mentoring.read',{usrahId:'USRAH_2'}));
  assert(!R.authorize(s,'mentoring.read',{}));assert(!R.authorize(s,'case.handle',{usrahId:'USRAH_3'}));
});
test('Counselor PEMULA PUTRA / MADYA PUTRI keep competency metadata and unit',()=>{
  for(const [level,unit,other] of [['PEMULA','PUTRA','PUTRI'],['MADYA','PUTRI','PUTRA']]){
    const s=session('KONSELOR',{level,unit});assert(menu(s,'menu-kasus-masuk'));
    assert(R.authorize(s,'case.read',{unit}));assert(!R.authorize(s,'case.read',{unit:other}));
    assert.equal(s.activeRole,'KONSELOR');assert.equal(s.activeAssignment.level,level);
  }
  assert(!menu(session('KONSELOR',{level:'UTAMA',unit:'ALL'}),'menu-antrean-kasus'));
});
test('PKBM is separate and cannot enter Guru Pondok feature',()=>{
  const s=session('GURU_PKBM');assert.equal(s.activeAssignment.programDomain,'PKBM');
  assert(!menu(s,'menu-absen-kbm'));assert(!N.decision(s,'menu-absen-kbm','guru/absensiPembelajaran.html','guru/absensiPembelajaran.html').ok);
});
test('Wali adapts the existing child name, never requires or trusts new studentIds',()=>{
  const s=session('WALI_SANTRI',{studentIds:['other-child'],namaAnak:'OTHER CHILD'},{namaAnak:'AKBAR PRAYOGA'});
  assert.equal(s.activeAssignment.namaAnak,'AKBAR PRAYOGA');
  assert.deepEqual(s.activeAssignment.studentIds,[]);
  assert(R.authorize(s,'student.read',{namaSantri:'AKBAR PRAYOGA'}));
  assert(!R.authorize(s,'student.read',{namaAnak:'OTHER CHILD'}));
  assert(!R.authorize(s,'student.read',{}));
  assert(!R.authorize(session('WALI_SANTRI',{studentIds:['child-a']}),'student.read',{studentId:'child-a'}));
});
test('switching Supervisor / Counselor / Guru never leaks assignments',()=>{
  let s=session('SUPERVISOR',{}, {roles:['SUPERVISOR','KONSELOR','GURU_PONDOK'],assignments:{SUPERVISOR:{unit:'PUTRA',supervisedRoles:['GURU_PONDOK','NAQIB','KONSELOR','MEDIA']},KONSELOR:{unit:'PUTRI',level:'MADYA'},GURU_PONDOK:{programDomain:'KEPONDOKAN'}}});
  s=R.switchRole(s,'KONSELOR').session;assert.equal(s.activeAssignment.unit,'PUTRI');assert.deepEqual(s.activeAssignment.supervisedRoles,[]);
  s=R.switchRole(s,'GURU_PONDOK').session;assert.equal(s.activeAssignment.level,'');assert.equal(s.activeAssignment.unit,'');
  assert.throws(()=>s.assignments.KONSELOR.studentIds.push('unapproved'),TypeError);
  const child=R.projectLegacyProfile({akses:['admin'],workspaceAssignments:[{role:'admin'}]},s);
  assert.deepEqual(child.akses,['guru']);assert.deepEqual(child.workspaceAssignments,[]);
});
test('ambiguous legacy profiles remain compatibility, never guessed from name',()=>{
  const s=R.adaptUser({username:'multazam',akses:['guru','mentor','admin']});
  assert.equal(s.mode,'compatibility');assert.equal(s.roles.length,0);assert.equal(s.unresolved.length,3);
  assert.equal(R.adaptUser({roleAssignmentsV2:[{role:'guru'}]}).mode,'compatibility');
  const invalid=R.adaptUser({roleSystemVersion:2,roles:['admin'],akses:['direktur']});
  assert.equal(invalid.mode,'canonical');assert.deepEqual(invalid.roles,[]);
});
test('legacy counselor levels proposed as metadata and Guru requires explicit domain',()=>{
  const s=R.adaptUser({workspaceAssignments:[{role:'konselor-muda',unit:'PUTRI'},{role:'guru',programDomain:'PKBM'}]});
  assert.equal(s.assignments.KONSELOR.level,'MADYA');assert(s.roles.includes('GURU_PKBM'));
});
test('direct shell URL cannot spoof allowed menu; unadapted scopes fail closed',()=>{
  const guru=session('GURU_PONDOK');
  assert(!N.decision(guru,'menu-nilai','admin/users.html','guru/inputNilaiUjian.html').ok);
  assert(N.decision(guru,'menu-nilai','guru/inputNilaiUjian.html?v=200','guru/inputNilaiUjian.html').ok);
  const naqibah=session('NAQIBAH');
  assert.equal(N.decision(naqibah,'menu-absen-asrama','naqib/absensi.html','naqib/absensi.html').reason,'UNIT_PROGRAM_ADAPTER');
  assert.equal(N.decision(naqibah,'menu-gamifikasi','naqib/gamifikasi.html','naqib/gamifikasi.html').reason,'UNIT_NAQIB_ADAPTER');
});
test('missing assignments fail closed; session choice belongs to current account',()=>{
  assert(!menu(session('SUPERVISOR',{divisionIds:['PENDIDIKAN']}),'menu-review-pendidikan'));
  assert(!menu(session('MANAJER'),'menu-kontrol-pendidikan'));
  const user={roleSystemVersion:2,uid:'next-user',roles:['DIREKTUR','GURU_PONDOK'],defaultRole:'GURU_PONDOK'};
  const s=R.resolveSession(user,{getItem:k=>({cahayaRoleUserV2:'old-user',cahayaActiveRoleV2:'DIREKTUR'})[k]});
  assert.equal(s.activeRole,'GURU_PONDOK');
});
test('conflicting intrinsic role assignment is rejected, not silently reinterpreted',()=>{
  assert(!menu(session('NAQIB',{unit:'PUTRI'}),'menu-gamifikasi'));
  assert(!menu(session('GURU_PONDOK',{programDomain:'PKBM'}),'menu-nilai'));
});
test('login preserves the existing standalone Wali portal for both legacy and V2',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  const start=source.indexOf('function getLoginTarget(user){'),end=source.indexOf('// Tentukan layar',start);
  const context={window:{CahayaRoleSystemV2:R},localStorage:{getItem:()=>null}};
  vm.createContext(context);vm.runInContext(source.slice(start,end),context);
  for(const role of R.ROLE_IDS)assert.equal(context.getLoginTarget({roleSystemVersion:2,roles:[role]}),role==='WALI_SANTRI'?'wali/dashboard/index.html?v=20260820-v70':'main-dashboard.html?v=205');
  assert(context.getLoginTarget({akses:['wali']}).startsWith('wali/dashboard'));
});
console.log(`${checks} role/assignment/security contract tests passed; no Firebase/network used.`);
