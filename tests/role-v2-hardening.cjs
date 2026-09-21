const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../js/role-system-v2.js'),N=require('../js/role-navigation-v2.js'),S=require('../js/role-scope-v2.js');
const session=(role,a={},extra={})=>R.resolveSession({username:'fixture',roleSystemVersion:2,roles:[role],assignments:{[role]:a},...extra});
const guru=session('GURU_PONDOK'),naqib=session('NAQIB'),naqibah=session('NAQIBAH');
const services=session('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['DAPUR','SARPRAS']});
const education=session('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['GURU_PONDOK','NAQIB','KONSELOR','MEDIA']});
const manager=session('MANAJER',{unit:'PUTRA',managedRoles:['GURU_PONDOK'],programDomain:'KEPONDOKAN'});
const mentor=session('MENTOR_USRAH',{usrahIds:['USRAH_3']});
const wali=session('WALI_SANTRI',{}, {namaAnak:'AKBAR PRAYOGA'});
for(const [s,route] of [[guru,'admin/users.html'],[guru,'supervisor/command-center.html'],[naqib,'konselor/daftar-kasus-baru.html?mode=naqib'],[services,'manajer/kontrol-pendidikan.html'],[education,'observer/dapur.html'],[manager,'pimpinan/rekap-kepala-sekolah.html'],[wali,'admin/database.html'],[session('GURU_PKBM'),'guru/inputNilaiUjian.html']])assert(!N.canAccessRoute(s,route).ok,route);
for(const route of ['https://evil.invalid/a','//evil.invalid/a','javascript:alert(1)','admin/%2575sers.html','admin%5cusers.html','not-registered.html'])assert(!N.canAccessRoute(guru,route).ok,route);
assert(N.canAccessRoute(guru,'docs/guru/inputNilaiUjian.html').ok);
assert(N.canAccessRoute(naqib,'naqib/absensi.html?unit=PUTRI').ok);
assert(!N.canAccessRoute(mentor,'pembinaan/mentoring-usrah.html').ok,'obsolete duplicate workflow stays closed');
assert(N.canAccessRoute(mentor,'pembinaan/mentor-usrah-v2.html?view=history').ok);
assert(!N.canAccessRoute(naqib,'home-direktur.html').ok);
assert(!N.decision(guru,'menu-nilai','admin/users.html','admin/users.html').ok,'caller supplied expected route is not authority');
assert(!N.canAccessRoute(session('DIREKTUR',{unit:'ALL'}),'pimpinan/dashboard-divisi.html?division=dapur').ok,'obsolete division dashboard stays closed');
assert(N.canAccessRoute(session('DIREKTUR',{unit:'ALL'}),'pimpinan/direktur-v2.html?view=condition').ok);
assert(!N.canAccessRoute(session('DIREKTUR',{unit:'PUTRI'}),'pimpinan/dashboard-divisi.html?division=dapur').ok);
assert(!N.canAccessRoute(services,'pimpinan/dashboard-divisi.html?division=pendidikan').ok);
assert(N.canAccessRoute({mode:'compatibility'},'admin/users.html').ok,'legacy compatibility untouched');
const ctx=S.create(manager);
const rows=[{id:'pondok',unit:'PUTRA',roleId:'GURU_PONDOK',programDomain:'KEPONDOKAN'},{id:'pkbm',unit:'PUTRA',roleId:'GURU_PKBM',programDomain:'PKBM'},{id:'putri',unit:'PUTRI',roleId:'GURU_PONDOK',programDomain:'KEPONDOKAN'},{id:'missing',mapel:'Tahfiz'}];
assert.deepEqual(ctx.education(rows,r=>r).map(r=>r.id),['pondok']);
assert.deepEqual(S.create(session('GURU_PKBM')).education(rows,r=>r).map(r=>r.id),['pkbm']);
assert(!S.create(services).can('operations.read',rows[0]));
assert(!S.create(education).can('operations.read',{roleId:'DAPUR',unit:'PUTRA'}));
for(const [unit,level] of [['PUTRA','PEMULA'],['PUTRI','MUDA']]){
 const c=S.create(session('KONSELOR',{unit,level}));
 assert(c.can('case.read',{unit}));assert(!c.can('case.handle',{unit:unit==='PUTRA'?'PUTRI':'PUTRA'}));
 assert(!c.can('case.read',{}));
}
assert.deepEqual(S.create(naqib).usrahKeys(),['Usrah 1','Usrah 2','Usrah 3','Usrah 4','Usrah 5','Usrah 6']);
assert.deepEqual(S.create(naqibah).usrahKeys(),['Usrah 7','Usrah 8']);
assert.deepEqual(S.create(mentor).usrahKeys(),['Usrah 3']);
assert.throws(()=>S.create(session('MENTOR_USRAH',{usrahIds:['unknown']})).usrahKeys(),/SOURCE_KEY/);
assert.equal(S.create(wali).childName,'AKBAR PRAYOGA');
assert(!S.create(wali).can('student.read',{namaAnak:'OTHER CHILD'}));
let active=session('DIREKTUR',{unit:'ALL'},{roles:['DIREKTUR','GURU_PONDOK'],assignments:{DIREKTUR:{unit:'ALL'},GURU_PONDOK:{programDomain:'KEPONDOKAN'}}});
const previous=S.create(active,()=>active);
active=R.switchRole(active,'GURU_PONDOK').session;
assert.throws(()=>previous.can('operations.read',{unit:'ALL'}),/EXPIRED/);
assert.equal(S.create(active).unit,'');
assert.deepEqual(S.create(active).allowedRoles,[]);
(async()=>{
 const reads=[];
 const u=await S.create(mentor).loadUsrah(async p=>{reads.push(p);return ['FIXTURE']});
 assert.deepEqual(reads,['cahaya_app/master_usrah/Usrah 3']);assert.deepEqual(Object.keys(u),['Usrah 3']);
 let s=mentor;const pending=S.create(s,()=>s).loadUsrah(async()=>{s=naqib;return ['LATE']});
 await assert.rejects(pending,/EXPIRED/);
 for(const f of ['home-guru.html','home-direktur.html','home-naqib.html','guru/absensiPembelajaran.html','guru/inputNilaiUjian.html','wali/dashboard/index.html','naqib/absensi.html','pembinaan/mentoring-usrah.html']){
  const a=fs.readFileSync(path.join(__dirname,'..',f),'utf8'),b=fs.readFileSync(path.join(__dirname,'../docs',f),'utf8');
  assert.equal(a,b,'mirror '+f);
  const guard=a.indexOf('role-entry-v2.js'),sdk=a.search(/<script[^>]+(?:firebasejs|type="module")/);assert(guard>0&&guard<a.indexOf('</head>')&&(sdk<0||guard<sdk),'entry before feature code: '+f);
 }
 for(const f of ['js/role-system-v2.js','js/role-navigation-v2.js','js/role-route-registry-v2.js','js/role-scope-v2.js','js/role-entry-v2.js','js/cahaya-workspace-core-v82.js','pendidikan/kpi-guru.html','role-access-denied.html'])assert.equal(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),fs.readFileSync(path.join(__dirname,'../docs',f),'utf8'),'mirror '+f);
 console.log('PASS centralized routes, exact role/assignment scope, PKBM isolation, counselor units, assigned usrah, Wali namaAnak, expired contexts, narrow reads, mirrors');
})().catch(e=>{console.error(e);process.exitCode=1});
