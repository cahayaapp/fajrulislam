const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const Model = require('../js/counselor-simplified-v3-model.js');

const source = fs.readFileSync('js/counselor-simplified-v3.js', 'utf8');

test('Kasus Masuk mempertahankan kasus lama dan lebih dari 100 kasus aktif', () => {
  const reports = Object.fromEntries(Array.from({ length: 125 }, (_, index) => [
    `legacy_${index}`, {
      tanggal: index < 5 ? '2019-01-15' : '2026-10-30',
      dilaporkan: `Santri ${index}`, tipe: 'Lapor Pelanggaran',
      kodePelanggaran: 'KEDISIPLINAN', statusPenanganan: 'BELUM DITANGANI'
    }
  ]));
  const program = { oldPrayer: { tanggal: '2020-05-01', unit: 'PUTRA', statusFinalisasi: 'FINAL', program: 'Shalat Subuh', data: [{ nama: 'Santri lama', statusFinal: 'ALFA' }] } };
  const learning = { newClass: { tanggal: '2026-10-30', unit: 'PUTRA', statusFinalisasi: 'FINAL', mapel: 'Bahasa Arab', data: [{ nama: 'Santri baru', statusFinal: 'TERLAMBAT' }] } };
  const cases = Model.sourceCases(reports, program, learning);
  assert.equal(cases.length, 127);
  assert.ok(cases.some(item => item.id === 'legacy_0'));
  assert.ok(cases.some(item => item.id === 'PROGRAM-oldPrayer-0'));
  assert.ok(cases.some(item => item.id === 'LEARNING-newClass-0'));
  assert.match(source, /const today=C\.jakartaDate\(\),from='2019-01-01'/);
  assert.doesNotMatch(source.slice(source.indexOf('async function loadCases()'), source.indexOf('function openSheet(')), /limitToLast\(/);
});

test('Buku Konseling tetap menggabungkan data lama dan riwayat panjang', () => {
  const legacy = Object.fromEntries(Array.from({ length: 150 }, (_, index) => [
    `old_${index}`, { santri: 'Santri lama', tanggalKejadian: `2025-01-${String(index % 28 + 1).padStart(2, '0')}`, kodePelanggaran: 'TERLAMBAT', kategoriAkhir: 'TERBUKTI', waktuKonseling: '2025-02-01T10:00:00Z' }
  ]));
  const history = Model.bookEntries([], legacy);
  assert.equal(history.length, 150);
  assert.match(source.slice(source.indexOf('async function loadBook()'), source.indexOf('function renderBookStudents()')), /get\(ref\(db,'cahaya_app\/buku_kasus_konselor'\)\)/);
});
