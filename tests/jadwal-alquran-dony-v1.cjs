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
  ['home.html', 'docs/home.html']
]) {
  assert.equal(
    fs.readFileSync(path.join(root, left), 'utf8'),
    fs.readFileSync(path.join(root, right), 'utf8'),
    `${left} dan ${right} harus identik`
  );
}

const home = fs.readFileSync(path.join(root, 'home.html'), 'utf8');
assert.match(home, /DONY:\['dony','doni','dony setiawan','doni setiawan','donisetiawan'\]/, 'resolver beranda harus mengenali akun Dony');

console.log('PASS delapan jadwal Al-Qur’an Kelas 2 Putra berpindah dari Falah ke Dony tanpa mengganti ID');
