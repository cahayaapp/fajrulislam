'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const P = require('../js/academic-report-score-policy.js');

const fixtures = [
  { nilai_total: 90, is_remedial: true },
  { nilai_total: 75, is_remedial: true },
  { nilai_total: 65, is_remedial: true },
  { nilai_total: 90, is_remedial: false }
];
const original = JSON.stringify(fixtures);
assert.deepEqual(fixtures.map(item => P.reportScore(item)), [90, 75, 65, 90]);
assert.equal(JSON.stringify(fixtures), original, 'report policy must not mutate Firebase-shaped records');
assert.equal(P.reportScore({ nilai_total: 75, is_remedial: true }), 75);
assert.equal(P.reportScore({ nilai_total: 65, is_remedial: true }), 65);
assert.equal(P.reportScore({ nilaiTotal: 88, is_remedial: 'true' }), 88);
assert(Number.isNaN(P.reportScore({ nilai_total: '', is_remedial: true })));

const admin = fs.readFileSync(require.resolve('../admin/rapot-uas.html'), 'utf8');
const wali = fs.readFileSync(require.resolve('../wali/dashboard/akademik.html'), 'utf8');
const supervisor = fs.readFileSync(require.resolve('../supervisor/raport-bulanan.html'), 'utf8');
for (const html of [admin, wali, supervisor]) {
  assert(html.includes('academic-report-score-policy.js?v=2'));
  assert(html.includes('CahayaAcademicReportScorePolicy.reportScore'));
}

assert(!('REMEDIAL_REPORT_MAX' in P));
console.log('Academic report remedial metadata: 90/75/65 preserved, averages use raw Final scores, records unchanged: PASS');
