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
  const calls = [],type={value:'bulanan'};
  const context = vm.createContext({
    R:require('../js/wali-academic-report-v2.js'),
    db: { ref(path) {
      let from,to,field;
      return {orderByChild(value){field=value;return this},startAt(value){from=value;return this},endAt(value){to=value;return this},async once(){
        calls.push(path);
        if(values.failOnce && path.endsWith('setoran_tahfiz')){values.failOnce=false;throw Error('offline')}
        const data=Object.fromEntries(Object.entries(values[path]||{}).filter(([,row])=>{
          const date=row[field]||'';
          return (!from||date>=from)&&(to===undefined||date<=to);
        }));
        return {val:()=>data};
      }};
    } },
    loadSchedule: async () => {}, populateFilters: () => {},
    $: id => id==='type'?type:id==='year'?{value:'2026/2027'}:id==='period'?{value:'Triwulan 2'}:({ innerHTML: '' }), esc: value => String(value), console
  });
  vm.runInContext(`let rows=[],tahfizRows=[],tahfizHistoryPromise=null,markers={},quranAssignments={};
    ${arraySource}${dataSource}
    globalThis.inspect=()=>({ rows, tahfizRows, markers, quranAssignments });`, context);
  return { calls, context, type, load: () => vm.runInContext('load()', context),
    loadHistory: () => vm.runInContext('loadTahfizHistory()', context),
    inspect: () => context.inspect() };
}

test('daftar rapor memuat nilai Bulanan, Periodik, publikasi, dan program tanpa setoran Tahfiz penuh', async () => {
  const fixture = {
    'cahaya_app/nilai_ujian_bulanan': { m: { status: 'FINAL', nilai_total: 88, is_remedial: true } },
    'cahaya_app/nilai_ujian': { t: { status: 'FINAL', nilai_total: 90 }, s: { status: 'DRAFT', nilai_total: 75 } },
    'cahaya_app/rapor_publication': { child: { published: true } },
    'cahaya_app/program_quran_santri': { child: { program: 'TAHFIZ' } },
    'cahaya_app/setoran_tahfiz': { one: { program: 'tahfiz', tanggal: '2026-10-01', data: { a: { namaSantri: 'A', surah: 'Al-Mulk' } } }, old:{tanggal:'2026-07-12',data:{b:{nama:'B'}}}, legacy:{data:{c:{nama:'C',tanggal:'2026-10-07'}}} }
  };
  const h = harness(fixture);
  await h.load();
  assert.equal(h.calls.length, 3);
  assert(!h.calls.includes('cahaya_app/nilai_ujian'));
  assert.equal(h.calls.includes('cahaya_app/setoran_tahfiz'), false);
  assert.equal(h.inspect().rows.length, 1);
  assert.equal(h.inspect().rows[0].nilai_total, 88);
  assert.equal(h.inspect().rows[0].is_remedial, true);
  assert.equal(h.inspect().markers.child.published, true);
  assert.equal(h.inspect().quranAssignments.child.program, 'TAHFIZ');
  h.type.value='triwulan';await h.load();
  assert.equal(h.inspect().rows.length,2);
  h.type.value='semester';await h.load();
  h.type.value='bulanan';await h.load();
  assert.equal(h.calls.length,4,'periode lain memakai sumber yang sudah dimuat');
  const history=await h.loadHistory();
  assert.equal(h.calls.filter(path=>path==='cahaya_app/setoran_tahfiz').length,2);
  assert.equal(history.length,2,'selected quarter and legacy child-dated records');
  assert.equal(history[0].surah,'Al-Mulk');
  await h.loadHistory();
  assert.equal(h.calls.filter(path=>path==='cahaya_app/setoran_tahfiz').length,2);
  assert.ok(html.includes("$('type').value==='triwulan'&&isTahfizStudent(x.student,x.reviewRecords)"));
  assert.ok(html.includes('await loadTahfizHistory()'));
});

test('gagal memuat setoran dapat dicoba lagi tanpa mengganggu daftar rapor', async () => {
  const h = harness({failOnce:true});
  await h.load();
  await assert.rejects(h.loadHistory(), /offline/);
  await h.loadHistory();
  assert.equal(h.calls.filter(path => path === 'cahaya_app/setoran_tahfiz').length, 4);
});

test('mirror publikasi sama dengan source utama', () => assert.equal(mirror, html));
