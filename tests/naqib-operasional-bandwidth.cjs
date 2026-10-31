const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'workspace/naqib-operasional.html'), 'utf8');
const mirror = fs.readFileSync(path.join(root, 'docs/workspace/naqib-operasional.html'), 'utf8');

test('halaman operasional Naqib hanya mengunduh absensi hari Jakarta ini', async () => {
  const module = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(module);
  const source = module[1]
    .replace(/import\{[^;]+;/g, '')
    .replace(/load\(\);\s*$/, 'globalThis.firstLoad = load();');
  const nodes = new Map();
  const calls = [];
  const rows = {
    previous: { tanggal: '2026-10-30', programId: 'subuh' },
    today: { tanggal: '2026-10-31', programId: 'subuh' },
    todayTimestamp: { tanggal: '2026-10-31T07:00:00+07:00', programId: 'zuhur' }
  };
  const context = vm.createContext({
    window: {
      CAHAYA_CONFIG: { firebase: {} },
      CAHAYA_PROGRAM_HARIAN_24JAM: [
        { id: 'subuh', program: 'Subuh', waktu: '04.00' },
        { id: 'zuhur', program: 'Zuhur', waktu: '12.00' }
      ],
      CahayaWorkspace: {
        localDate: () => '2026-10-31', dayName: () => 'Sabtu', unitFromProfile: () => 'Putra',
        name: () => 'Naqib', norm: value => String(value || '').toLowerCase(),
        records: value => Object.values(value || {}), esc: value => String(value)
      }
    },
    document: { getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { textContent: '', innerHTML: '' });
      return nodes.get(id);
    } },
    getApps: () => [{}], initializeApp: () => ({}), getDatabase: () => ({}),
    ref: (_db, name) => ({ name }),
    orderByChild: field => ({ field }),
    startAt: start => ({ start }),
    endAt: end => ({ end }),
    query: (base, ...clauses) => ({ ...base, clauses }),
    get: async request => {
      calls.push(request);
      const clauses = request.clauses || [];
      const start = clauses.find(clause => clause.start !== undefined)?.start;
      const end = clauses.find(clause => clause.end !== undefined)?.end;
      const filtered = Object.fromEntries(Object.entries(rows).filter(([, row]) =>
        start === undefined || (row.tanggal >= start && row.tanggal <= end)));
      return { exists: () => true, val: () => filtered };
    },
    console
  });
  vm.runInContext(source, context);
  await context.firstLoad;

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'cahaya_app/absensi_program_harian');
  assert.equal(calls[0].clauses.find(clause => clause.field)?.field, 'tanggal');
  assert.equal(calls[0].clauses.find(clause => clause.start !== undefined)?.start, '2026-10-31');
  assert.equal(calls[0].clauses.find(clause => clause.end !== undefined)?.end, '2026-10-31\uf8ff');
  assert.equal((nodes.get('programList').innerHTML.match(/Sudah Diabsen/g) || []).length, 2);
});

test('file publikasi docs identik dengan source utama', () => {
  assert.equal(mirror, html);
});
