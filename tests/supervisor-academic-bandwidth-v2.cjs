const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const html = fs.readFileSync('supervisor/laporan-akademik.html', 'utf8');
const mirror = fs.readFileSync('docs/supervisor/laporan-akademik.html', 'utf8');
const arraySource = html.slice(html.indexOf('function array(v)'), html.indexOf('function profile()'));
const dataSource = html.slice(html.indexOf('function flattenTahfiz(value)'), html.indexOf('const requestedMode='));
assert.ok(arraySource.startsWith('function array(v)') && dataSource.startsWith('function flattenTahfiz'));

function harness(values) {
  const calls = [];
  const context = vm.createContext({
    db: { ref(path) { return { once: async () => { calls.push(path); return { val: () => values[path] || {} }; } }; } },
    loadSchedule: async () => {}, populateFilters: () => {},
    $: () => ({ innerHTML: '' }), esc: value => String(value), console
  });
  vm.runInContext(`let rows=[],tahfizRows=[],tahfizHistoryPromise=null,markers={},quranAssignments={};
    ${arraySource}${dataSource}
    globalThis.inspect=()=>({ rows, tahfizRows, markers, quranAssignments });`, context);
  return { calls, context, load: () => vm.runInContext('load()', context),
    loadHistory: () => vm.runInContext('loadTahfizHistory()', context),
    inspect: () => context.inspect() };
}

test('daftar rapor memuat nilai Bulanan, Periodik, publikasi, dan program tanpa setoran Tahfiz penuh', async () => {
  const fixture = {
    'cahaya_app/nilai_ujian_bulanan': { m: { status: 'FINAL', nilai_total: 88, is_remedial: true } },
    'cahaya_app/nilai_ujian': { t: { status: 'FINAL', nilai_total: 90 }, s: { status: 'DRAFT', nilai_total: 75 } },
    'cahaya_app/rapor_publication': { child: { published: true } },
    'cahaya_app/program_quran_santri': { child: { program: 'TAHFIZ' } },
    'cahaya_app/setoran_tahfiz': { one: { program: 'tahfiz', tanggal: '2026-10-01', data: { a: { namaSantri: 'A', surah: 'Al-Mulk' } } } }
  };
  const h = harness(fixture);
  await h.load();
  assert.equal(h.calls.length, 4);
  assert.equal(h.calls.includes('cahaya_app/setoran_tahfiz'), false);
  assert.equal(h.inspect().rows.length, 3, 'Final, remedial, dan Draft tetap tersedia untuk perhitungan lama');
  assert.equal(h.inspect().rows[0].nilai_total, 88);
  assert.equal(h.inspect().rows[0].is_remedial, true);
  assert.equal(h.inspect().markers.child.published, true);
  assert.equal(h.inspect().quranAssignments.child.program, 'TAHFIZ');
  await h.loadHistory();
  assert.equal(h.calls.filter(path => path === 'cahaya_app/setoran_tahfiz').length, 1);
  assert.equal(h.inspect().tahfizRows[0].surah, 'Al-Mulk');
  await h.loadHistory();
  assert.equal(h.calls.filter(path => path === 'cahaya_app/setoran_tahfiz').length, 1);
  assert.ok(html.includes("$('type').value==='triwulan'&&isTahfizStudent(x.student,x.reviewRecords)"));
  assert.ok(html.includes('await loadTahfizHistory()'));
});

test('gagal memuat setoran dapat dicoba lagi tanpa mengganggu daftar rapor', async () => {
  const h = harness({});
  await h.load();
  h.context.db.ref = path => ({ once: async () => {
    h.calls.push(path);
    if (h.calls.filter(value => value === path).length === 1) throw new Error('offline');
    return { val: () => ({}) };
  } });
  await assert.rejects(h.loadHistory(), /offline/);
  await h.loadHistory();
  assert.equal(h.calls.filter(path => path === 'cahaya_app/setoran_tahfiz').length, 2);
});

test('mirror publikasi sama dengan source utama', () => assert.equal(mirror, html));
