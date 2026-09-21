const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const P = require('../js/supervisor-permit-contract.js');
const routes = require('../js/role-route-registry-v2.js');
const R = require('../js/role-system-v2.js');
const N = require('../js/role-navigation-v2.js');
const session = (role, assignment) => R.resolveSession({username:'izin-test',roleSystemVersion:2,roles:[role],defaultRole:role,assignments:{[role]:assignment}},{getItem:()=>null,setItem(){}});

assert.equal(P.status('MENUNGGU_PIMPINAN'), 'MENUNGGU_REVIEW');
assert.equal(P.status('perlu konfirmasi'), 'PERLU_KONFIRMASI');
assert.equal(P.status('DIBATALKAN'), 'DIBATALKAN');
assert.equal(P.source({ sumberPengajuan: 'WALI' }), 'WALI_SANTRI');
assert.equal(P.source({ sumberPengajuan: 'UKS' }), 'UKS');
assert.equal(P.unitOf({ jenisKelamin: 'Laki-laki' }), 'PUTRA');
assert.equal(P.unitOf({ kelas: 'Kelas 4 Putri' }), 'PUTRI');
assert.equal(P.unitOf({ namaSantri: 'Putra' }), '');
assert.equal(P.allowed({ unit: 'PUTRA' }, ['LAYANAN_KEBERSIHAN'], { kelas: 'Kelas 4 Putra' }), true);
assert.equal(P.allowed({ unit: 'PUTRA' }, ['LAYANAN_KEBERSIHAN'], { kelas: 'Kelas 4 Putri' }), false);
assert.equal(P.allowed({ unit: 'PUTRA' }, ['PENDIDIKAN'], { kelas: 'Kelas 4 Putra' }), false);
assert.equal(P.allowed({ unit: 'PUTRA' }, ['LAYANAN_KEBERSIHAN'], { namaSantri: 'Ahmad' }), false);
assert.equal(routes['supervisor/review-izin-santri.html'].policy, 'supervisor-layanan-v2');
assert.equal(routes['pimpinan/perizinan-santri.html'].policy, 'legacy-permit-decision-disabled');
const layanan = session('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['LAYANAN_KEBERSIHAN']});
const pendidikan = session('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['GURU_PONDOK']});
const manager = session('MANAJER',{area:'PENDIDIKAN',unit:'PUTRA',managedRoles:['GURU_PONDOK'],programDomain:'KEPONDOKAN'});
assert.equal(N.canAccessRoute(layanan,'supervisor/review-izin-santri.html').ok,true);
assert.equal(N.canAccessRoute(pendidikan,'supervisor/review-izin-santri.html').ok,false);
assert.equal(N.canAccessRoute(manager,'supervisor/review-izin-santri.html').ok,false);
assert.equal(N.canAccessRoute(layanan,'pimpinan/perizinan-santri.html').ok,false);
for (const file of [
  'js/supervisor-permit-contract.js', 'js/supervisor-permit-v2.js',
  'js/supervisor-workspace-v2.js', 'js/supervisor-home-v2.js',
  'js/role-route-registry-v2.js', 'js/role-navigation-v2.js',
  'supervisor/review-izin-santri.html', 'supervisor/workspace-v2.html',
  'home-supervisor-v2.html', 'main-dashboard.html', 'pimpinan/perizinan-santri.html'
]) {
  assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), fs.readFileSync(path.join(root, 'docs', file), 'utf8'), `docs mirror: ${file}`);
}
console.log('Supervisor permit contract, routes, unit scope, and docs mirrors: OK');
