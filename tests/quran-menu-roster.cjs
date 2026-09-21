const assert=require('node:assert/strict');
const {rows}=require('../js/quran-menu-roster.js');
const classes={'Kelas 4 Putra':['Ahmad','Bilal','Hasan'],'Kelas 4 Putri':['Aisyah'],'Kelas 5 Putra':['Umar']};
const programs={ahmad:{programQuran:'Tahsin'},bilal:{programQuran:'Tahfiz'},aisyah:{programQuran:'Tahsin'}};
assert.deepEqual(rows(classes,['Kelas 4 Putra'],'Tahsin',programs).map(r=>r.nama),['Ahmad','Hasan']);
assert.equal(rows(classes,['Kelas 4 Putra'],'Tahsin',programs).find(r=>r.nama==='Hasan').assigned,false);
assert.deepEqual(rows(classes,['Kelas 4 Putri'],'Tahsin',programs).map(r=>r.nama),['Aisyah']);
assert.deepEqual(rows(classes,[],'Tahsin',programs),[]);
assert.deepEqual(rows(classes,['Kelas 4 Putra'],'Tahfiz',programs).map(r=>r.nama),['Bilal','Hasan']);
// No history cap may silently remove students, including those without setoran.
const large=Array.from({length:1300},(_,i)=>`Santri ${i}`);
assert.equal(rows({'Kelas 1 Putra':large},['Kelas 1 Putra'],'Tahsin',{}).length,1300);
// Membership must remain independent of assigned levels.
const levelClasses={'Kelas 4 Putra':['Ahmad','Bilal'],'Kelas 5 Putra':['Hasan'],'Kelas 6 Putra':['Umar']};
const levels={ahmad:{programQuran:'Tahsin',tahsinLevel:'LEVEL_1'},hasan:{programQuran:'Tahsin',tahsinLevel:'LEVEL_3'}};
assert.deepEqual(rows(levelClasses,Object.keys(levelClasses),'Tahsin',levels).map(r=>r.nama),['Ahmad','Bilal','Hasan','Umar']);
const R=require('../js/role-system-v2.js'),N=require('../js/role-navigation-v2.js'),M=require('../js/role-menu-v2.js');
const route='pendidikan/penempatan-tahsin.html';
const manager={area:'PENDIDIKAN',unit:'PUTRA',programDomain:'KEPONDOKAN',managedRoles:['GURU_PONDOK']};
const supervisor={unit:'PUTRI',supervisedRoles:['GURU_PONDOK'],divisionIds:['PENDIDIKAN']};
for(const [role,input,allowed] of [
  ['MANAJER',manager,true],['MANAJER',{...manager,unit:'PUTRI'},true],
  ['MANAJER',{...manager,area:'PEMBINAAN_KARAKTER'},false],['MANAJER',{...manager,unit:'ALL'},false],
  ['SUPERVISOR',supervisor,true],['SUPERVISOR',{...supervisor,unit:'ALL'},true],
  ['SUPERVISOR',{...supervisor,divisionIds:['DAPUR']},false],
  ['SUPERVISOR',{unit:'PUTRA',supervisedRoles:['GURU_PKBM']},false],
  ['SUPERVISOR',{unit:'PUTRA',supervisedRoles:['DAPUR']},false],
  ['GURU_PONDOK',{programDomain:'KEPONDOKAN'},false]
]){
  const a=R.assignmentFor(role,input),s={mode:'canonical',activeRole:role,activeAssignment:a};
  assert.equal(R.canManageTahsinLevels(role,a),allowed);
  assert.equal(N.canAccessRoute(s,route).ok,allowed);
  assert.equal(M.model(s).some(item=>item.id==='menu-penempatan-tahsin'),allowed);
}
console.log('Shared class-based Quran menu roster: OK');
