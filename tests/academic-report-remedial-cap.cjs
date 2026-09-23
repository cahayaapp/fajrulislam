'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const P = require('../js/academic-report-score-policy.js');

assert.equal(P.reportScore({ nilai_total: 90, is_remedial: true }), 75);
assert.equal(P.reportScore({ nilai_total: 76, is_remedial: true }), 75);
assert.equal(P.reportScore({ nilai_total: 75, is_remedial: true }), 75);
assert.equal(P.reportScore({ nilai_total: 68, is_remedial: true }), 68);
assert.equal(P.reportScore({ nilai_total: 90, is_remedial: false }), 90);
assert.equal(P.reportScore({ nilaiTotal: 88, is_remedial: 'true' }), 75);
assert(Number.isNaN(P.reportScore({ nilai_total: '', is_remedial: true })));

const admin = fs.readFileSync(require.resolve('../admin/rapot-uas.html'), 'utf8');
const wali = fs.readFileSync(require.resolve('../wali/dashboard/akademik.html'), 'utf8');
const supervisor = fs.readFileSync(require.resolve('../supervisor/raport-bulanan.html'), 'utf8');
for (const html of [admin, wali, supervisor]) {
  assert(html.includes('academic-report-score-policy.js?v=1'));
  assert(html.includes('CahayaAcademicReportScorePolicy.reportScore'));
}

console.log('Academic report remedial cap: raw score preserved, report value capped at 75 only when Remedial: PASS');
