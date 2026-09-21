(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CahayaEducationFindingsV2 = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const labels = Object.freeze({
    BARU:'Baru', DIPROSES:'Diproses', MENUNGGU_PERBAIKAN:'Menunggu Perbaikan',
    PERLU_EVALUASI:'Perlu Evaluasi', SELESAI:'Selesai',
    DIESKALASI_KE_SUPERVISOR:'Dieskalasi ke Supervisor'
  });
  const clean = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  function status(value) {
    const key = clean(value);
    return labels[key] ? key : 'BARU';
  }
  function jakartaDate(value) {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const number = typeof value === 'number' ? value : /^\d{10,13}$/.test(String(value)) ? Number(value) : NaN;
    const date = Number.isFinite(number) ? new Date(number < 1e12 ? number * 1000 : number) : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const get = key => parts.find(part => part.type === key)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function normalizeEducationFinding(record, key) {
    const r = record && typeof record === 'object' ? record : {};
    const tanggal = jakartaDate(r.tanggal || r.date || r.createdAt || r.timestamp || r.updatedAt || (String(key || '').match(/\d{4}-\d{2}-\d{2}/) || [])[0]);
    const canonicalStatus = status(r.status || r.statusTemuan || r.state);
    return {...r, id:String(key || r.id || ''), tanggal, status:canonicalStatus, statusLabel:labels[canonicalStatus],
      area:clean(r.area || r.divisi || ''), unit:clean(r.unit || r.unitPendidikan || ''),
      programDomain:clean(r.programDomain || r.domain || ''),
      sourceType:String(r.sourceType || r.sumberTemuan || ''), sourceId:String(r.sourceId || r.sumberId || ''),
      personil:String(r.personil || r.guru || r.pic || ''), temuan:String(r.temuan || r.masalah || r.finding || '')};
  }
  function inManagerScope(finding, assignment, schedule = []) {
    const f = normalizeEducationFinding(finding, finding?.id);
    if (f.area && f.area !== 'PENDIDIKAN') return false;
    if (f.programDomain && f.programDomain !== 'KEPONDOKAN') return false;
    if (f.unit) return f.unit === assignment?.unit;
    // Legacy records without a unit are admitted only with a matching scoped
    // schedule source or teacher. Unknown-unit records remain hidden.
    const same = schedule.some(item =>
      (f.sourceId && String(item.id || '') === f.sourceId) ||
      (f.personil && [item.guruKode,item.guruNama,item.guru].some(name=>name&&clean(name)===clean(f.personil)))
    );
    return same;
  }
  function inDateRange(finding, start, end) {
    const date = normalizeEducationFinding(finding, finding?.id).tanggal;
    return Boolean(date && date >= start && date <= end);
  }
  return Object.freeze({status, statusLabel:value=>labels[status(value)], jakartaDate,
    normalizeEducationFinding, inManagerScope, inDateRange});
});
