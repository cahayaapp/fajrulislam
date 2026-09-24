/* Period-safe academic report resolver for the Wali portal. */
(function (root, factory) {
  const api = factory(
    typeof module === 'object' && module.exports ? require('./academic-report-score-policy.js') : root.CahayaAcademicReportScorePolicy
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CahayaWaliAcademicReportV2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (ScorePolicy) {
  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const key = value => norm(value).replace(/\s+/g, '');
  const values = value => Array.isArray(value) ? value : Object.values(value || {});
  const score = record => ScorePolicy?.reportScore ? ScorePolicy.reportScore(record) : Number(record?.nilai_total ?? record?.nilai);
  const rawScore = record => ScorePolicy?.rawScore ? ScorePolicy.rawScore(record) : Number(record?.nilai_total ?? record?.nilai);
  const updatedAt = record => new Date(record?.updated_at || record?.updatedAt || record?.final_at || record?.finalAt || record?.timestamp || 0).getTime() || 0;
  const studentName = record => String(record?.nama_santri || record?.namaSantri || record?.nama || '').trim();
  const studentId = record => String(record?.studentKey || record?.santriId || record?.studentId || '').trim();
  const typeOf = record => {
    const type = norm(record?.jenis_ujian || record?.jenisUjian || record?.jenis_penilaian || record?.jenisPenilaian || record?.__sourceType);
    if (type.includes('triwulan')) return 'triwulan';
    if (type.includes('semester')) return 'semester';
    if (type.includes('bulan')) return 'bulanan';
    return '';
  };
  function monthOf(record) {
    const explicit = String(record?.bulan || '').trim();
    const found = MONTHS.find(month => norm(month) === norm(explicit));
    if (found) return found;
    const raw = String(record?.tanggal_ujian || record?.tanggal || record?.timestamp || '').slice(0,10);
    const match = raw.match(/^\d{4}-(\d{2})-/);
    return match ? MONTHS[Number(match[1]) - 1] || '' : '';
  }
  function quarterOf(record) {
    const text = norm(record?.periode_ujian || record?.periode || record?.triwulan);
    const match = text.match(/(?:triwulan|quarter|kuartal|t)\s*([1-4])/);
    return match ? `Triwulan ${match[1]}` : '';
  }
  function semesterOf(record) {
    const period = norm(record?.periode_ujian || record?.periode);
    const semester = norm(record?.semester);
    const text = `${period} ${semester}`;
    if (/semester\s*1|ganjil/.test(text)) return 'Semester 1';
    if (/semester\s*2|genap/.test(text)) return 'Semester 2';
    return '';
  }
  const periodOf = (record, tab) => tab === 'triwulan' ? quarterOf(record) : tab === 'semester' ? semesterOf(record) : monthOf(record);
  const yearOf = record => String(record?.tahun_akademik || record?.tahunAkademik || record?.tahunAjaran || '').trim();
  const isFinal = record => norm(record?.status_nilai || record?.statusNilai || record?.status) === 'final' && record?.locked !== false;
  function belongsToStudent(record, student = {}) {
    const wantedId = String(student.studentKey || student.santriId || student.studentId || '').trim();
    const recordId = studentId(record);
    if (wantedId && recordId) return key(wantedId) === key(recordId);
    return Boolean(student.name && key(studentName(record)) === key(student.name));
  }
  const subjectOf = record => String(record?.mata_pelajaran || record?.mapel || record?.jenis_penilaian || 'Mata Pelajaran').trim();
  const recordIdentity = record => [typeOf(record), norm(record?.periode_ujian || record?.periode || record?.bulan), norm(subjectOf(record)), norm(record?.kode_penilaian), norm(record?.kelas_kelompok || record?.kelas)].join('|');
  function dedupe(records) {
    const selected = new Map();
    for (const record of records) {
      const id = recordIdentity(record);
      const previous = selected.get(id);
      if (!previous || updatedAt(record) >= updatedAt(previous)) selected.set(id, record);
    }
    return [...selected.values()];
  }
  function filterScores(records, options = {}) {
    const tab = ['bulanan','triwulan','semester'].includes(options.tab) ? options.tab : 'bulanan';
    return dedupe(values(records)
      .filter(record => belongsToStudent(record, options.student || {}))
      .filter(isFinal)
      .filter(record => typeOf(record) === tab)
      .filter(record => !options.year || norm(yearOf(record)) === norm(options.year))
      .filter(record => !options.period || norm(periodOf(record, tab)) === norm(options.period))
      .filter(record => Number.isFinite(rawScore(record)))
      .filter(record => typeof options.applicable !== 'function' || options.applicable(record)))
    .sort((a,b) => subjectOf(a).localeCompare(subjectOf(b), 'id', {numeric:true}));
  }
  function summary(records) {
    const scores = values(records).map(score).filter(Number.isFinite);
    return {
      subjects: scores.length,
      average: scores.length ? Math.round((scores.reduce((a,b) => a + b, 0) / scores.length) * 10) / 10 : null,
      remedial: values(records).filter(record => ScorePolicy?.isRemedial ? ScorePolicy.isRemedial(record) : record?.is_remedial === true).length
    };
  }
  function years(records, fallback = '') {
    const result = [...new Set(values(records).map(yearOf).filter(Boolean))].sort((a,b) => b.localeCompare(a,'id',{numeric:true}));
    if (fallback && !result.includes(fallback)) result.unshift(fallback);
    return result;
  }
  return { MONTHS, norm, key, typeOf, periodOf, yearOf, isFinal, belongsToStudent, subjectOf, filterScores, summary, years };
});
