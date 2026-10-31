'use strict';
const assert = require('node:assert/strict');
const A = require('../push-backend/functions/access-index-core');

for (const role of ['GURU_PONDOK', 'GURU_PKBM', 'NAQIB', 'NAQIBAH',
  'KONSELOR', 'MENTOR_USRAH', 'MANAJER', 'SUPERVISOR', 'DIREKTUR',
  'KESEHATAN', 'LAYANAN_KEBERSIHAN', 'DAPUR', 'SARPRAS', 'MEDIA']) {
  const access = A.accessFor({roleSystemVersion:2, roles:[role]}, 'staff');
  assert.equal(access.active, true, role);
  assert.equal(access.internal, true, role);
  assert.equal(access.roles[role.toLowerCase()], true, role);
}
assert.deepEqual(A.rolesOf({roleSystemVersion:2,roles:{SUPERVISOR:true,GURU_PKBM:false}}), ['supervisor']);
assert.equal(A.accessFor({akses:['wali']}, 'wali').internal, false);
assert.equal(A.accessFor({roles:['WALI_SANTRI']}, 'wali').isWali, true);
assert.equal(A.accessFor({roles:['SANTRI']}, 'santri').internal, false);
assert.equal(A.accessFor({roles:['GURU_PONDOK'],disabled:true}, 'off').active, false);
assert.equal(A.accessFor({roles:['GURU_PONDOK'],active:false}, 'off').active, false);
const children = A.explicitWaliStudents({students:[
  {studentKey:'ANAK-1',namaSantri:'Anak Satu'},
  {studentKey:'ANAK-2',namaSantri:'Anak Dua',active:false},
  {studentKey:'invalid/key',namaSantri:'Salah'}
]});
assert.deepEqual(Object.keys(children), ['ANAK-1','ANAK-2']);
assert.equal(children['ANAK-1'].active, true);
assert.equal(children['ANAK-2'].active, false);
console.log('PASS trusted role index and Wali child scope fixtures');
