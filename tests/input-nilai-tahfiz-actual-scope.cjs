'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Q = require('../js/quran-menu-roster.js');

const sandbox = { window: {} };
vm.runInNewContext(
  fs.readFileSync(require.resolve('../config/master-data.js'), 'utf8'),
  sandbox
);

const classes = sandbox.window.CAHAYA_MASTER_DATA.santriByClass;
const schedule = JSON.parse(
  fs.readFileSync(require.resolve('../data/jadwal-pelajaran-awal-2026-2027.json'), 'utf8')
);
const selectedClasses = [...new Set(schedule
  .filter(row => row.aktif !== false && row.guruKode === 'ALAMANDA' && /qur/i.test(row.mapel || ''))
  .map(row => row.kelas))]
  .sort();

assert.deepEqual(selectedClasses, ['Kelas 3 Putri', 'Kelas 4 Putri']);

const withoutPlacements = Q.resolveAssessmentStudents({
  classes,
  selectedClasses,
  assessmentKey: 'tahfiz',
  periodDate: '2026-09-30',
  assignments: {}
});

assert.equal(withoutPlacements.length, 7);
assert.equal(new Set(withoutPlacements.map(row => row.studentId)).size, 7);
assert(withoutPlacements.some(row => row.name === 'JESSICA PUTRY AYRA'));
assert(withoutPlacements.some(row => row.name === 'NYAYU MARLITSA ARDHANI'));

const withTahsinMember = Q.resolveAssessmentStudents({
  classes,
  selectedClasses,
  assessmentKey: 'tahfiz',
  periodDate: '2026-09-30',
  assignments: {
    jessica: {
      namaSantri: 'JESSICA PUTRY AYRA',
      kelasAkademik: 'Kelas 3 Putri',
      programQuran: 'Tahsin',
      tahsinLevel: 'LEVEL_1',
      effectiveFrom: '2026-09-01'
    }
  }
});

assert.equal(withTahsinMember.length, 6);
assert(!withTahsinMember.some(row => row.name === 'JESSICA PUTRY AYRA'));
console.log('Actual Alamanda Quran scope: 7 Tahfiz without placements; confirmed Tahsin members are excluded: PASS');
