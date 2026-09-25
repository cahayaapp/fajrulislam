const assert = require('node:assert/strict');
const fs = require('node:fs');
const R = require('../js/role-system-v2.js');
const N = require('../js/role-navigation-v2.js');

const areaOnly = R.resolveSession({
  username: 'manager-putra',
  roleSystemVersion: 2,
  roles: ['MANAJER'],
  defaultRole: 'MANAJER',
  assignments: { MANAJER: { area: 'PENDIDIKAN', unit: 'PUTRA' } }
});
const full = R.resolveSession({
  username: 'manager-putri',
  roleSystemVersion: 2,
  roles: ['MANAJER'],
  defaultRole: 'MANAJER',
  assignments: { MANAJER: { area: 'PENDIDIKAN', unit: 'PUTRI', managedRoles: ['GURU_PONDOK'], programDomain: 'KEPONDOKAN' } }
});
const savedByOldEditor = R.resolveSession({
  username: 'manager-existing',
  roleSystemVersion: 2,
  roles: ['MANAJER'],
  defaultRole: 'MANAJER',
  assignments: { MANAJER: { unit: 'PUTRA', managedRoles: ['GURU_PONDOK'], programDomain: 'KEPONDOKAN' } }
});
const futureArea = R.resolveSession({
  username: 'manager-other',
  roleSystemVersion: 2,
  roles: ['MANAJER'],
  defaultRole: 'MANAJER',
  assignments: { MANAJER: { area: 'PEMBINAAN_KARAKTER', unit: 'PUTRA', managedRoles: ['NAQIB', 'KONSELOR'] } }
});
const multiRole = R.resolveSession({
  username: 'multi-role',
  roleSystemVersion: 2,
  roles: ['GURU_PONDOK', 'MANAJER'],
  defaultRole: 'GURU_PONDOK',
  assignments: {
    GURU_PONDOK: { programDomain: 'KEPONDOKAN' },
    MANAJER: { area: 'PENDIDIKAN', unit: 'PUTRA', managedRoles: ['GURU_PONDOK'], programDomain: 'KEPONDOKAN' }
  }
});

assert.equal(R.homeFor('MANAJER', areaOnly.activeAssignment), 'home-manajer-pendidikan.html?v=232');
assert.equal(R.homeFor('MANAJER', full.activeAssignment), 'home-manajer-pendidikan.html?v=232');
assert.equal(savedByOldEditor.activeAssignment.area, 'PENDIDIKAN');
assert.equal(R.homeFor('MANAJER', savedByOldEditor.activeAssignment), 'home-manajer-pendidikan.html?v=232');
assert.equal(R.homeFor('MANAJER', futureArea.activeAssignment), 'home-manajer-pembinaan-karakter.html?v=238');
assert.equal(N.canAccessRoute(futureArea, 'home-manajer-pembinaan-karakter.html?v=238', 'menu-home').ok, true);
assert.equal(N.canAccessRoute(futureArea, 'manajer/pembinaan-karakter-v2.html?view=kpi', 'menu-kpi-manajer').ok, true);
assert.equal(N.canAccessRoute(areaOnly, 'home-manajer-pendidikan.html?v=232', 'menu-home').ok, true);
assert.equal(N.canAccessRoute(futureArea, 'home-manajer-pendidikan.html?v=232', 'menu-home').ok, false);
const switched = R.switchRole(multiRole, 'MANAJER');
assert.equal(switched.ok, true);
assert.equal(switched.session.activeAssignment.area, 'PENDIDIKAN');
assert.equal(R.homeFor(switched.session.activeRole, switched.session.activeAssignment), 'home-manajer-pendidikan.html?v=232');

const dashboard = fs.readFileSync('main-dashboard.html', 'utf8');
assert(dashboard.includes("roleSystemV2.homeFor(activeNow,roleV2Session.activeAssignment)"));
assert(dashboard.includes("roleSystemV2.homeFor(activeRoleForPage, roleV2Session.activeAssignment)"));
assert(dashboard.includes("openAuthorizedMenu('menu-home')"));
assert(dashboard.includes('id="menu-absensi-ibadah-guru"'));
const menu=require('../js/role-menu-v2.js');
assert.equal(menu.bottom(full,'kpi'),'menu-kpi-manajer');
assert.equal(menu.model(full).find(x=>x.id==='menu-kontrol-pendidikan').route,'manajer/pendidikan-v2.html?view=control');
assert.equal(menu.resolve(full,'menu-kpi-manajer','admin/users.html'),null);
assert(!dashboard.includes("if(home){loadPage('home.html?v=193',home)}"));
const guide = fs.readFileSync('js/role-guide-v2.js', 'utf8');
assert(guide.includes("parent.openAuthorizedMenu('menu-home')"));

const homeLogic = fs.readFileSync('js/manager-education-home-v2.js', 'utf8');
for (const label of ['Kontrol Hari Ini', 'Capaian Materi', 'Tindak Lanjut', 'Guru Mukim & Ibadah', 'Guru Pondok', 'Progres Input Nilai', 'Observasi Pembelajaran', 'Riwayat Temuan', 'Pembinaan Guru', 'Panduan Kerja']) {
  assert(homeLogic.includes(label), label);
}
assert(!homeLogic.includes("'Pelaksanaan KBM'"));
assert(!homeLogic.includes('KPI'));
console.log('manager-home-routing-v2: ok');
