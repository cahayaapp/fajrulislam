'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const schedulePath = path.join(root, 'data/jadwal-pelajaran-awal-2026-2027.json');
const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
const isQuran = row => /al[^a-z0-9]*qur/i.test(String(row.mapel || ''));

const donyQuran = schedule.filter(row => row.aktif !== false && row.guruKode === 'DONY' && isQuran(row));
const falahQuran = schedule.filter(row => row.aktif !== false && row.guruKode === 'FALAH' && isQuran(row));

assert.equal(donyQuran.length, 8, 'Dony harus menerima delapan jadwal Al-Qur’an aktif milik Falah');
assert.equal(falahQuran.length, 0, 'Falah tidak boleh lagi memiliki jadwal Al-Qur’an aktif');
assert.deepEqual([...new Set(donyQuran.map(row => row.kelas))], ['Kelas 2 Putra']);
assert.deepEqual([...new Set(donyQuran.map(row => row.hari))].sort(), [1, 2, 3, 4]);
assert.deepEqual([...new Set(donyQuran.map(row => row.jamMulai))].sort(), ['07:00', '12:30']);
assert.equal(new Set(donyQuran.map(row => row.id)).size, 8, 'ID jadwal harus tetap unik untuk menjaga riwayat');

for (const [left, right] of [
  ['data/jadwal-pelajaran-awal-2026-2027.json', 'docs/data/jadwal-pelajaran-awal-2026-2027.json'],
  ['admin/atur-jadwal.html', 'docs/admin/atur-jadwal.html'],
  ['home.html', 'docs/home.html'],
  ['home-guru.html', 'docs/home-guru.html'],
  ['js/guru-home-actions.js', 'docs/js/guru-home-actions.js'],
  ['js/guru-home-hub.js', 'docs/js/guru-home-hub.js'],
  ['guru/absensiPembelajaran.html', 'docs/guru/absensiPembelajaran.html'],
  ['guru/inputNilaiUjian.html', 'docs/guru/inputNilaiUjian.html'],
  ['guru/inputSetoranTahfiz.html', 'docs/guru/inputSetoranTahfiz.html'],
  ['guru/gurumenulis.html', 'docs/guru/gurumenulis.html'],
  ['guru/tindak-lanjut.html', 'docs/guru/tindak-lanjut.html']
]) {
  assert.equal(
    fs.readFileSync(path.join(root, left), 'utf8'),
    fs.readFileSync(path.join(root, right), 'utf8'),
    `${left} dan ${right} harus identik`
  );
}

const home = fs.readFileSync(path.join(root, 'home.html'), 'utf8');
assert.match(home, /DONY:\['dony','doni','dony setiawan','doni setiawan','donisetiawan'\]/, 'resolver beranda harus mengenali akun Dony');

const functionalFiles = [
  'guru/absensiPembelajaran.html',
  'guru/absenguru.html',
  'guru/gurumenulis.html',
  'guru/inputNilaiUjian.html',
  'guru/inputSetoranTahfiz.html',
  'guru/tindak-lanjut.html',
  'cetak-kalender-materi.html',
  'rpp-generator.html'
];
functionalFiles.forEach(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.match(source, /DONY/, `${file} harus mengenali guru DONY`);
  assert.doesNotMatch(source, /teacher:\s*["']FALAH["']/, `${file} tidak boleh lagi menugaskan Al-Qur'an kepada FALAH`);
});

const homeActions = fs.readFileSync(path.join(root, 'js/guru-home-actions.js'), 'utf8');
assert.match(homeActions, /cahaya_guru_schedule_v183/,'quick access harus mengabaikan cache jadwal lama');
assert.match(homeActions, /jadwal-pelajaran-awal-2026-2027\.json\?v=183/,'quick access harus meminta jadwal versi baru');

const master = require(path.join(root, 'data/jadwal-pelajaran-awal-2026-2027.json'));
const vm = require('node:vm');
const kpiContext = {window:{},console,Intl,Date,Map,Set};
vm.createContext(kpiContext);
vm.runInContext(fs.readFileSync(path.join(root,'js/guru-kpi-v144.js'),'utf8'),kpiContext);
const K = kpiContext.window.CahayaGuruKPI;
const identity = K.identityFromProfile({username:'donisetiawan',label:'Dony Setiawan'},master);
assert.equal(identity.code,'DONY');
assert.equal(K.assignedSchedule(master,identity).filter(isQuran).length,8,'seluruh fungsi berbasis resolver harus mendapatkan 8 jadwal Dony');

console.log('PASS delapan jadwal dan seluruh fungsi Guru Al-Qur’an berpindah dari Falah ke Dony; cache lama diabaikan');
