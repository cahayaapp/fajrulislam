const assert=require('node:assert/strict');
global.CahayaRoleSystemV2=require('../js/role-system-v2.js');
const M=require('../js/user-management-v2.js');
const base={username:'legacy',label:'Legacy User',akses:['admin','guru'],jabatan:['admin'],teacherId:'TEACHER-9',mysteryField:{keep:true}};
function patch(d){return M.buildPatch({username:'fixture',label:'Fixture',...d},'2026-09-17T00:00:00.000Z')}
assert.equal(M.ROLE_IDS.length,15);assert(!M.ROLE_IDS.includes('admin'));assert(!M.ROLE_IDS.includes('guru'));
let p=patch({roles:['GURU_PONDOK'],defaultRole:'GURU_PONDOK',assignments:{GURU_PONDOK:{}}});
assert.deepEqual(p.assignments.GURU_PONDOK,{programDomain:'KEPONDOKAN'});
p=patch({roles:['SUPERVISOR','KONSELOR','GURU_PONDOK'],defaultRole:'SUPERVISOR',assignments:{SUPERVISOR:{unit:'PUTRA',supervisedRoles:['GURU_PONDOK','NAQIB','KONSELOR','MEDIA']},KONSELOR:{unit:'PUTRA',level:'MUDA'},GURU_PONDOK:{}}});
assert.deepEqual(p.roles,['SUPERVISOR','KONSELOR','GURU_PONDOK']);assert.equal(p.assignments.KONSELOR.level,'MADYA');
p=patch({roles:['MANAJER'],defaultRole:'MANAJER',assignments:{MANAJER:{unit:'PUTRA',managedRoles:['GURU_PONDOK'],programDomain:'KEPONDOKAN'}}});assert.deepEqual(p.assignments.MANAJER.managedRoles,['GURU_PONDOK']);assert.equal(p.assignments.MANAJER.area,'PENDIDIKAN');
p=patch({roles:['MENTOR_USRAH'],defaultRole:'MENTOR_USRAH',assignments:{MENTOR_USRAH:{usrahIds:['USRAH_3']}}});assert.deepEqual(p.assignments.MENTOR_USRAH.usrahIds,['USRAH_3']);
p=patch({roles:['KONSELOR'],defaultRole:'KONSELOR',assignments:{KONSELOR:{unit:'PUTRA',level:'MUDA'}}});assert.deepEqual(p.assignments.KONSELOR,{unit:'PUTRA',level:'MADYA'});
p=patch({roles:['NAQIBAH'],defaultRole:'NAQIBAH',assignments:{NAQIBAH:{unit:'PUTRA'}}});assert.deepEqual(p.assignments.NAQIBAH,{unit:'PUTRI'});
const wali=M.createDraft({...base,roleSystemVersion:2,roles:['WALI_SANTRI'],defaultRole:'WALI_SANTRI',assignments:{WALI_SANTRI:{}},namaAnak:'AKBAR PRAYOGA'});p=M.buildPatch(wali,'now');assert.equal(p.namaAnak,'AKBAR PRAYOGA');assert(!('studentIds' in p.assignments.WALI_SANTRI));
const merged={...base,...p};assert.deepEqual(merged.akses,['admin','guru']);assert.equal(merged.teacherId,'TEACHER-9');assert.deepEqual(merged.mysteryField,{keep:true});
const legacyDraft=M.createDraft({...base,namaAnak:'AKBAR PRAYOGA'});assert.deepEqual(legacyDraft.roles,[]);assert(legacyDraft.legacyNotice);assert.equal(legacyDraft.namaAnak,'AKBAR PRAYOGA');
let d={username:'x',roles:['SUPERVISOR'],defaultRole:'SUPERVISOR',assignments:{SUPERVISOR:{unit:'PUTRA',supervisedRoles:[]}}};assert(!M.validate(d).ok);
d={username:'x',roles:['GURU_PONDOK','KONSELOR'],defaultRole:'KONSELOR',assignments:{GURU_PONDOK:{},KONSELOR:{unit:'PUTRA',level:'MADYA'}}};d.roles=d.roles.filter(r=>r!=='KONSELOR');delete d.assignments.KONSELOR;d.defaultRole='';assert(!M.validate(d).ok);d.defaultRole='GURU_PONDOK';p=M.buildPatch(d,'now');assert(!('KONSELOR' in p.assignments));
for(const invalid of [
 {roles:['MENTOR_USRAH'],defaultRole:'MENTOR_USRAH',assignments:{MENTOR_USRAH:{usrahIds:[]}}},
 {roles:['KONSELOR'],defaultRole:'KONSELOR',assignments:{KONSELOR:{unit:'ALL',level:'MADYA'}}},
 {roles:['WALI_SANTRI'],defaultRole:'WALI_SANTRI',assignments:{WALI_SANTRI:{}},namaAnak:''}
])assert(!M.validate({username:'x',...invalid}).ok);
console.log('PASS canonical roles, multi-role/default, assignments, intrinsic scope, Wali namaAnak, legacy preservation, removal and validation');
