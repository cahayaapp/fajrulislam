/* Shared eligibility rule for score entry and academic reports. No Firebase access. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CahayaStudentProgramApplicability = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const key = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').slice(0, 10)) ? String(value).slice(0, 10) : '';
  // Current roster confirmed 21 September 2026; never backdate this snapshot.
  const CURRENT_FROM = '2026-09-21';
  const CURRENT = {
    kelas1putri: { count: 6, total: 8, except: ['QONITA AZZAHRAH ALFANSYURI', 'NABILA NUR WAMAWADDA AL- MAIRA'], required: ['NAMI RIA RAMADHANI','NAEVA MARNIA','NAYYA SALSABILLA','QIARA ANJANI DIVANTI','NAURA ADELIA FITRI','NAJIHA SHAFIYAH AFIFAH'] },
    kelas2putri: { count: 4, total: 10, only: ['FITRAH KIRANA', 'ADIBA AILA KHANZA', 'AISYAH NURUL AULIA', 'WINDY WINDARI'] },
    kelas1putra: { count: 18, total: 25, except: ['CAHYIS ISZAM', 'FAHRY AKBAR RAMDHANI', 'IHZA TRINANDI', 'MUHAMMAD AQIL RIDHO', 'MUHAMMAD USAMAH', 'DZIKRI MUDHOFFAR', 'MUHAMMAD YASIR AL FAZAR JHIRA'] },
    kelas2putra: { count: 5, total: 22, only: ['ALIF SAMUDRA', 'EZA FEBRI AL FADZRI', 'MUHAMMAD ABIL IRWANSYAH', 'MUHAMMAD IZAM SAPUTRA', 'FAUZAN IBNI JABAR'] }
  };
  const aliases = { cahyiziszam: 'CAHYIS ISZAM', ezhafebrialfadzri: 'EZA FEBRI AL FADZRI' };
  function identityKey(name, className = '') {
    const normalized = key(name);
    return key(aliases[normalized] || (normalized === 'nurul' && key(className) === 'kelas2putri' ? 'AISYAH NURUL AULIA' : name));
  }
  function resolveStudent(name, context = {}) {
    const classes = context.classes || globalThis.CAHAYA_MASTER_DATA?.santriByClass || {};
    const requested = context.className || context.kelas || '';
    const matches = [];
    for (const [className, values] of Object.entries(classes)) {
      for (const canonical of Object.values(values || {})) {
        if (typeof canonical === 'string' && identityKey(canonical, className) === identityKey(name, requested || className))
          matches.push({ name: canonical, className, key: identityKey(canonical, className) });
      }
    }
    const selected = matches.find(item => key(item.className) === key(requested));
    const academic = matches.filter(item => CURRENT[key(item.className)]);
    // A TeachingGroup is the caller's roster intersection, not a replacement
    // for a member's actual academic class when resolving the four-class snapshot.
    if (selected && /^kelas\d+(putra|putri)$/.test(key(requested))) return selected;
    return (academic.length === 1 ? academic[0] : selected) ||
      (matches.length === 1 ? matches[0] : { name, className: requested, key: identityKey(name, requested) });
  }
  function assignmentKey(name, assignments = {}, context = {}) {
    const student = resolveStudent(name, context);
    if (Object.prototype.hasOwnProperty.call(assignments, student.key)) return student.key;
    const matches = Object.entries(assignments).filter(([id, record]) =>
      identityKey(record?.namaSantri || record?.nama_santri || id, student.className) === student.key);
    return matches.length === 1 ? matches[0][0] : student.key;
  }
  function currentProgram(name, context = {}) {
    const student = resolveStudent(name, context), rule = CURRENT[key(student.className)];
    if (!rule) return '';
    const included = (rule.only || rule.except).some(value => identityKey(value, student.className) === student.key);
    return (rule.only ? included : !included) ? 'TAHSIN' : 'TAHFIZ';
  }
  function auditRoster(classes) {
    return Object.entries(CURRENT).map(([classKey, rule]) => {
      const className = Object.keys(classes).find(name => key(name) === classKey) || classKey;
      const names = Object.values(classes[className] || {}).filter(name => typeof name === 'string');
      const tahsin = names.filter(name => currentProgram(name, { classes, className }) === 'TAHSIN').length;
      const missing = [...(rule.only || rule.except),...(rule.required || [])].filter(name => !names.some(actual => identityKey(actual, className) === key(name)));
      return { className, tahsin, tahfiz: names.length - tahsin, total: names.length,
        expected: rule.count, missing, ok: tahsin === rule.count && names.length === rule.total && !missing.length && new Set(names.map(name=>identityKey(name,className))).size===names.length };
    });
  }
  function level(value) {
    const match = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').match(/^(?:LEVEL|TAHSIN)?([123])$/);
    return match ? `LEVEL_${match[1]}` : '';
  }
  function program(value) {
    const valueKey = key(value);
    return valueKey === 'tahsin' ? 'TAHSIN' : valueKey === 'tahfiz' ? 'TAHFIZ' : valueKey === 'murojaah' ? 'MUROJAAH' : '';
  }
  function subject(record) {
    const raw = typeof record === 'string' ? { mata_pelajaran: record } : record || {};
    const code = key(raw.kode_penilaian || raw.assessmentType || raw.jenis_penilaian || raw.mata_pelajaran || raw.mapel);
    const exact = code.match(/^tahsinlevel([123])/);
    if (exact) return 'TAHSIN_LEVEL_' + exact[1];
    if (code.includes('tahsinpraktek')) return 'TAHSIN_PRAKTEK';
    if (code.includes('tahsinteori')) return 'TAHSIN_TEORI';
    if (code.includes('tahfiz')) return 'TAHFIZ';
    if (code === 'tahsin' && level(raw.tahsinLevel || raw.levelTahsin || raw.level_tahsin))
      return level(raw.tahsinLevel || raw.levelTahsin || raw.level_tahsin) === 'LEVEL_2' ? 'TAHSIN_TEORI' : 'TAHSIN_PRAKTEK';
    return code === 'tahsin' ? 'TAHSIN_UNKNOWN' : '';
  }
  function assignmentFor(studentName, periodDate, assignments = {}, scoreRecord = null, context = {}) {
    const at = date(periodDate);
    if (!at) return null;
    const source = assignments[assignmentKey(studentName, assignments, context)] || {};
    const history = Array.isArray(source.history) ? source.history : Object.values(source.history || {});
    const entries = history.filter(Boolean).map(item => ({
      effectiveFrom: date(item.effectiveFrom || item.berlakuMulai || item.tanggalMulai),
      program: program(item.programQuran || item.program),
      level: level(item.tahsinLevel || item.levelTahsin || item.level_tahsin)
    }));
    if (source.programQuran || source.program) entries.push({
      effectiveFrom: date(source.effectiveFrom || source.berlakuMulai || source.updatedAt),
      program: program(source.programQuran || source.program),
      level: level(source.tahsinLevel || source.levelTahsin || source.level_tahsin)
    });
    const valid = entries.filter(item => item.effectiveFrom && item.effectiveFrom <= at)
      .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    if (valid.length) return valid[valid.length - 1];
    // A newly recorded score may carry period-specific proof when the current assignment has moved on.
    if (scoreRecord && date(scoreRecord.programPeriodDate || scoreRecord.tanggal_ujian || scoreRecord.tanggal) === at) {
      const scoreProgram = program(scoreRecord.programQuran || scoreRecord.program_quran);
      const scoreLevel = level(scoreRecord.tahsinLevel || scoreRecord.levelTahsin || scoreRecord.level_tahsin);
      if (scoreProgram) return { effectiveFrom: at, program: scoreProgram, level: scoreLevel };
    }
    return null;
  }
  function getQuranProgramPlacement(studentName, periodDate, assignments = {}, scoreRecord = null, context = {}) {
    const historical = assignmentFor(studentName, periodDate, assignments, scoreRecord, context);
    const override = (context.current || date(periodDate) >= CURRENT_FROM) ? currentProgram(studentName, context) : '';
    const source = assignments[assignmentKey(studentName, assignments, context)] || {};
    const programQuran = override || historical?.program || (context.current ? program(source.programQuran) : '') || null;
    // A stale Tahfiz level is never evidence of a Tahsin placement.
    const tahsinLevel = programQuran === 'TAHSIN' && historical?.program === 'TAHSIN' ? historical.level || null : null;
    return { programQuran, tahsinLevel, effectiveFrom: historical?.effectiveFrom || (override ? CURRENT_FROM : null) };
  }
  function applicable(studentName, selectedSubject, periodDate, assignments = {}, scoreRecord = null, context = {}) {
    const kind = subject(selectedSubject);
    if (!kind) return { applicable: true, kind: '', level: '' };
    const placement = getQuranProgramPlacement(studentName, periodDate, assignments, scoreRecord, context);
    const foundLevel = placement.tahsinLevel || '';
    const assignment = { program: placement.programQuran };
    const exactLevel = kind.startsWith('TAHSIN_LEVEL_') ? kind.slice(7) : '';
    const recordedLevel = scoreRecord && (level(scoreRecord.tahsinLevel) || (subject(scoreRecord).startsWith('TAHSIN_LEVEL_') ? subject(scoreRecord).slice(7) : ''));
    return {
      applicable: recordedLevel && recordedLevel !== foundLevel ? false
        : exactLevel ? assignment.program === 'TAHSIN' && foundLevel === exactLevel
        : kind === 'TAHFIZ' ? assignment?.program === 'TAHFIZ'
        : kind === 'TAHSIN_PRAKTEK' ? assignment?.program === 'TAHSIN' && ['LEVEL_1', 'LEVEL_3'].includes(foundLevel)
        : kind === 'TAHSIN_TEORI' ? assignment?.program === 'TAHSIN' && foundLevel === 'LEVEL_2'
        : false,
      kind, level: foundLevel
    };
  }
  function reportLabel(name, record, at, assignments = {}, context = {}) {
    if (!subject(record)) return record.mata_pelajaran || record.mapel || '';
    const placement = getQuranProgramPlacement(name, at, assignments, record, context);
    if (placement.programQuran === 'TAHFIZ') return 'Tahfiz';
    if (!placement.tahsinLevel) return '';
    return 'Tahsin Level ' + placement.tahsinLevel.slice(-1) + ' • Tahsin ' + (placement.tahsinLevel === 'LEVEL_2' ? 'Teori' : 'Praktek');
  }
  function periodDate(params = {}) {
    const explicit = date(params.selectedDate || params.periodDate);
    if (explicit) return explicit;
    const match = String(params.tahun || params.tahun_akademik || '').match(/(\d{4})\s*\/\s*(\d{4})/);
    if (!match) return date(params.tanggal || params.tanggal_ujian);
    const months = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
    const chosen = key(params.bulan || params.periode || '').replace(/[^a-z]/g, '');
    let month = months.indexOf(chosen) + 1;
    if (!month) {
      const quarter = String(params.periode || '').match(/(?:triwulan|quarter)\s*([1-4])/i);
      month = quarter ? [0, 9, 12, 3, 6][Number(quarter[1])] : /ganjil|semester\s*1/i.test(String(params.semester || params.periode || '')) ? 12 : 6;
    }
    const year = month >= 7 ? Number(match[1]) : Number(match[2]);
    const actual = date(params.tanggal || params.tanggal_ujian);
    if (actual && actual.startsWith(`${year}-${String(month).padStart(2, '0')}-`)) return actual;
    return `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
  }
  return { key, date, level, program, subject, assignmentFor, applicable, periodDate, CURRENT_FROM,
    identityKey, resolveStudent, assignmentKey, currentProgram, auditRoster, getQuranProgramPlacement, reportLabel,
    isExplicitClass: className => !!CURRENT[key(className)] };
});
