/* Shared presentation policy for academic reports. Raw score records stay unchanged. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CahayaAcademicReportScorePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SCORE_FIELDS = [
    'nilai_total', 'nilaiTotal', 'nilai_akhir', 'nilaiAkhir',
    'nilai_final', 'nilaiFinal', 'total_nilai', 'totalNilai', 'nilai'
  ];

  function isRemedial(record) {
    return record?.is_remedial === true || String(record?.is_remedial || '').trim().toLowerCase() === 'true';
  }

  function rawScore(record) {
    for (const field of SCORE_FIELDS) {
      const value = record?.[field];
      if (value === '' || value === null || value === undefined) continue;
      const score = Number(value);
      if (Number.isFinite(score)) return score;
    }
    return NaN;
  }

  function reportScore(record, scoreValue) {
    const source = arguments.length > 1 ? scoreValue : rawScore(record);
    const score = Number(source);
    if (!Number.isFinite(score)) return NaN;
    return isRemedial(record) && score > 75 ? 75 : score;
  }

  return { REMEDIAL_REPORT_MAX: 75, isRemedial, rawScore, reportScore };
});
