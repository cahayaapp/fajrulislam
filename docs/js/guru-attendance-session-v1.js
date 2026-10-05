(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CahayaGuruAttendanceSessionV1 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function compact(value) {
    return normalize(value).replace(/\s+/g, "");
  }

  function normalizeTime(value) {
    const text = String(value || "").trim();
    const match = text.match(/(?:^|\s)(\d{1,2})[:.]?(\d{2})(?:\s|$)/);
    if (!match) return "";
    return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
  }

  function unique(values) {
    return [...new Set(values.map(value => String(value || "").trim()).filter(Boolean))];
  }

  function assignmentIds(assignment) {
    return unique([assignment && assignment.id, assignment && assignment.sourceScheduleId]);
  }

  function recordIds(record) {
    return unique([record && record.jadwalIdPresensi, record && record.jadwalIdAsli, record && record.jadwalId]);
  }

  function sameClassAndSubject(record, assignment) {
    return normalize(record && (record.kelas || record.sub)) === normalize(assignment && assignment.className) &&
      normalize(record && record.mapel) === normalize(assignment && assignment.subject);
  }

  function sessionStart(item) {
    return normalizeTime(item && (item.jamMulaiJadwal || item.scheduleStart || item.jamMulai || item.waktuMulai || item.startTime));
  }

  function sessionLabel(item) {
    return compact(item && (item.sesiJadwal || item.sessionLabel || item.sesi || item.namaSesi));
  }

  function virtualGroup(item) {
    return compact(item && (item.kelompokBahasaArabJuzKode || item.virtualJuz));
  }

  function matches(record, assignment, assignmentsForDay) {
    if (!record || !assignment) return false;
    const expectedVirtualGroup = virtualGroup(assignment);
    const savedVirtualGroup = virtualGroup(record);
    if (expectedVirtualGroup && savedVirtualGroup !== expectedVirtualGroup) return false;
    if (!expectedVirtualGroup && savedVirtualGroup) return false;
    const expectedIds = assignmentIds(assignment);
    const savedIds = recordIds(record);
    if (expectedIds.length && savedIds.length) {
      if (expectedIds.some(id => savedIds.includes(id))) return true;
      if (!sameClassAndSubject(record, assignment)) return false;
      const savedStart = sessionStart(record);
      const expectedStart = sessionStart(assignment);
      if (savedStart && expectedStart) return savedStart === expectedStart;
      const savedSession = sessionLabel(record);
      const expectedSession = sessionLabel(assignment);
      return Boolean(savedSession && expectedSession && savedSession === expectedSession);
    }
    if (!sameClassAndSubject(record, assignment)) return false;
    const savedStart = sessionStart(record);
    const expectedStart = sessionStart(assignment);
    if (savedStart && expectedStart) return savedStart === expectedStart;
    const savedSession = sessionLabel(record);
    const expectedSession = sessionLabel(assignment);
    if (savedSession && expectedSession) return savedSession === expectedSession;
    const siblings = Array.isArray(assignmentsForDay) ? assignmentsForDay : [];
    return siblings.filter(item => sameClassAndSubject(record, item)).length === 1;
  }

  return Object.freeze({ matches, normalizeTime, assignmentIds, recordIds });
});
