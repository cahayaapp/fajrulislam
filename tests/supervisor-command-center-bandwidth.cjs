const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'supervisor/command-center.html'), 'utf8');
const mirror = fs.readFileSync(path.join(root, 'docs/supervisor/command-center.html'), 'utf8');

function source() {
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match, 'modul Command Center tersedia');
  return match[1]
    .replace(/import\{[^;]+;/g, '')
    .replace(/load\(\);\s*$/, 'globalThis.firstLoad = load();');
}

test('Command Center memakai satu pembacaan observasi untuk dua indikator', async () => {
  const calls = [],queries=[];
  const nodes = new Map();
  const values = {
    'cahaya_app/absensi_pembelajaran': { a: { tanggal: '2026-10-30', unit: 'Putra', status: 'Hadir' } },
    'cahaya_app/nilai_ujian_bulanan': { a: { tanggal: '2026-10-30', unit: 'Putra', data: { s: { nilai: 90 } } } },
    'observasi_lapangan': {
      a: { tanggal: '2026-10-30', unit: 'Putra', jenis: 'pembelajaran', persentase: 80 },
      b: { tanggal: '2026-10-30', unit: 'Putra', jenis: 'pengasuhan', persentase: 70 }
    },
    'cahaya_app/absensi_program_harian': {},
    'cahaya_app/asesmen_cahaya_santri': {},
    'cahaya_app/log_lapor_inisiatif': {},
    'cahaya_app/review_supervisor_terpadu': {}
  };
  const context = vm.createContext({
    window: { CAHAYA_CONFIG: { firebase: {} }, CahayaWorkspace: {
      monthKey: () => '2026-10', unitFromProfile: () => 'Putra', name: () => 'Supervisor',
      norm: value => String(value || '').toLowerCase(),
      records: value => Object.values(value || {}), toast: () => {}
    } },
    document: { getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', innerHTML: '', onclick: null, onchange: null });
      return nodes.get(id);
    } },
    getApps: () => [{}], initializeApp: () => ({}), getDatabase: () => ({}),
    ref: (_database, target) => target,
    query: (path,...clauses)=>{const q={path,...Object.assign({},...clauses)};queries.push(q);return q},orderByChild:field=>({field}),startAt:start=>({start}),endAt:end=>({end}),
    get: async target => { const p=target.path||target;calls.push(p);const data=Object.fromEntries(Object.entries(values[p]||{}).filter(([,r])=>!target.field||(r[target.field]>=target.start&&r[target.field]<=target.end)));return { exists: () => true, val: () => data }; },
    push: () => ({ key: 'unused' }), set: async () => {},
    location: { href: '' }, console
  });
  vm.runInContext(source(), context);
  await context.firstLoad;

  assert.equal(queries.length,3);assert(queries.every(q=>q.start==='2026-10-01'&&q.end==='2026-10-31\uf8ff'));
  assert.equal(calls.length, 7, 'tujuh sumber unik saja yang diunduh');
  assert.equal(calls.filter(target => target === 'observasi_lapangan').length, 1);
  assert.equal(calls.includes('cahaya_app/capaian_materi'), false, 'sumber tidak terpakai tidak diunduh');
  assert.equal(nodes.get('eduScore').textContent, '93%');
  assert.equal(nodes.get('careScore').textContent, '85%');
  assert.match(nodes.get('audit').innerHTML, /Observasi Pembelajaran/);
  assert.match(nodes.get('audit').innerHTML, /Observasi Pengasuhan/);
});

test('file publikasi docs identik dengan source utama', () => {
  assert.equal(mirror, html);
});
