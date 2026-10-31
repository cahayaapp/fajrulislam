const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const html = fs.readFileSync('wali/dashboard/beranda.html', 'utf8');
const mirror = fs.readFileSync('docs/wali/dashboard/beranda.html', 'utf8');
const start = html.indexOf('  function lepasListenerTimeline()');
const end = html.indexOf('  /* =========================================================\n     V62', start);
assert.ok(start > 0 && end > start);
const source = html.slice(start, end);

function harness() {
  const nodes = new Map();
  const bindings = [];
  let student = 'anakA';
  const context = vm.createContext({
    dbRT: { ref(path) {
      const query = {
        path, limitToLast(limit) { this.limit = limit; return this; },
        on(_event, callback, error) { bindings.push({ path, callback, error, query: this }); },
        off(_event, callback) { const item = bindings.find(x => x.query === this && x.callback === callback); if (item) item.detached = true; }
      };
      return query;
    } },
    document: { getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', style: {}, classList: { toggle() {} } });
      return nodes.get(id);
    } },
    clearTimeout: () => {}, setTimeout: () => 1,
    console: { warn() {} },
    renderWaliMobileDashboard: () => {}, renderRiwayatTerlihat: () => {},
    parsePengaturanMedia: value => { context.media = value; },
    jadwalkanRefreshTimeline: () => {},
    kunciIndexSantriTimeline: () => Array.isArray(student) ? student : [student]
  });
  vm.runInContext(`
    let timelineListenerSignature='', timelineListenerBindings=[], timelineIndexedSnapshots={};
    let timelineListenerGeneration=0, timelineInitialPromise=Promise.resolve(), timelineInitialResolve=null;
    let initialTimelineReady=false, timelineRefreshTimer=null, sourceWarnings=[];
    let globalDB={}, currentDayOffset=0; const INITIAL_HISTORY_DAYS=7;
    ${source}
    globalThis.inspect=()=>({ ready:initialTimelineReady, data:globalDB, warnings:sourceWarnings,
      signature:timelineListenerSignature, bindings:timelineListenerBindings.length });
  `, context);
  return {
    context, nodes, bindings,
    switchTo(value) { student = value; return vm.runInContext('pasangListenerTimeline()', context); },
    fireFor(value, data = {}) {
      for (const item of bindings.filter(x => !x.detached && (x.path.includes(`/${value}/`) || x.path.endsWith('/pengaturan_media')))) {
        item.callback({ val: () => item.path.endsWith('/program') ? data : {} });
      }
    }
  };
}

test('snapshot awal listener menggantikan pembacaan awal ganda dan tetap realtime', async () => {
  const h = harness();
  const loading = h.nodes.get('loadingData') || h.context.document.getElementById('loadingData');
  const first = h.switchTo('anakA');
  assert.equal(h.bindings.length, 6, 'lima indeks anak dan satu pengaturan media');
  assert.equal(loading.style.display, 'block');
  assert.equal(h.context.inspect().ready, false);
  h.fireFor('anakA', { a: { tanggal: '2026-10-31', namaSantri: 'A' } });
  await first;
  assert.equal(h.context.inspect().ready, true);
  assert.equal(h.context.inspect().data.program.a.namaSantri, 'A');
  assert.equal(loading.style.display, 'none');
  const program = h.bindings.find(x => x.path.endsWith('/anakA/program'));
  program.callback({ val: () => ({ b: { namaSantri: 'A baru' } }) });
  assert.equal(h.context.inspect().data.program.b.namaSantri, 'A baru');
  assert.doesNotMatch(html.slice(html.indexOf("document.addEventListener('DOMContentLoaded'"), html.indexOf('async function kirimKomentar')), /sourceDefinitions\.map\(/);
});

test('pergantian anak cepat melepas listener lama dan tidak menampilkan data lama', async () => {
  const h = harness();
  const oldLoad = h.switchTo('anakA');
  const stale = h.bindings.find(x => x.path.endsWith('/anakA/program'));
  const newLoad = h.switchTo('anakB');
  await oldLoad;
  assert.equal(h.context.inspect().data.program && Object.keys(h.context.inspect().data.program).length, 0);
  assert.equal(h.context.inspect().ready, false);
  assert.ok(h.bindings.filter(x => x.path.includes('/anakA/')).every(x => x.detached));
  stale.callback({ val: () => ({ stale: { namaSantri: 'A' } }) });
  h.fireFor('anakB', { current: { namaSantri: 'B' } });
  await newLoad;
  assert.equal(h.context.inspect().data.program.current.namaSantri, 'B');
  assert.equal(h.context.inspect().data.program.stale, undefined);
  const count = h.bindings.length;
  await h.switchTo('anakB');
  assert.equal(h.bindings.length, count, 'profil yang sama tidak memasang listener baru');
});

test('key identitas dan alias anak digabung setelah keduanya selesai dimuat', async () => {
  const h = harness();
  const first = h.switchTo(['anakA', 'aliasA']);
  assert.equal(h.bindings.length, 11);
  h.fireFor('anakA', { official: { namaSantri: 'A' } });
  assert.equal(h.context.inspect().ready, false);
  h.fireFor('aliasA', { legacy: { namaSantri: 'A' } });
  await first;
  assert.deepEqual(Object.keys(h.context.inspect().data.program).sort(), ['legacy', 'official']);
});

test('error satu sumber tidak menahan loading sumber lain', async () => {
  const h = harness();
  const first = h.switchTo('anakA');
  for (const item of h.bindings) {
    if (item.path.endsWith('/tahfiz')) item.error(new Error('permission_denied'));
    else item.callback({ val: () => ({}) });
  }
  await first;
  assert.equal(h.context.inspect().ready, true);
  assert.equal(h.context.inspect().warnings.length, 1);
  assert.equal(h.nodes.get('loadingData').style.display, 'none');
});

test('mirror publikasi sama dengan source utama', () => assert.equal(mirror, html));
