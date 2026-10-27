'use strict';

const waliRoles = new Set(['wali', 'wali_santri']);
const nonStaffRoles = new Set([...waliRoles, 'santri', 'siswa', 'student']);

function rolesOf(profile = {}) {
  const raw = Number(profile.roleSystemVersion) === 2
    ? profile.roles
    : (profile.roles || profile.akses || profile.role || profile.jabatan);
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object'
    ? Object.keys(raw).filter(role => raw[role] === true) : [raw];
  return [...new Set(list.map(role => String(role || '').trim().toLowerCase()
    .replace(/[\s-]+/g, '_')).filter(Boolean))];
}

function accessFor(profile = {}, username = '') {
  const roles = rolesOf(profile);
  return {
    active: profile.disabled !== true && profile.active !== false,
    internal: roles.some(role => !nonStaffRoles.has(role)),
    isWali: roles.some(role => waliRoles.has(role)),
    username: String(username).trim().toLowerCase(),
    label: String(profile.label || profile.namaTampilan || profile.nama || username).trim(),
    roles: Object.fromEntries(roles.map(role => [role, true]))
  };
}

function explicitWaliStudents(profile = {}) {
  const raw = [
    ...(Array.isArray(profile.students) ? profile.students : []),
    ...(Array.isArray(profile.studentKeys) ? profile.studentKeys : []),
    ...(Array.isArray(profile.assignments?.WALI_SANTRI?.studentKeys)
      ? profile.assignments.WALI_SANTRI.studentKeys : [])
  ];
  const students = {};
  raw.forEach(item => {
    const key = String(item && typeof item === 'object'
      ? (item.studentKey || item.santriId || item.id || '') : (item || '')).trim();
    if (!key || /[.#$\[\]\/]/.test(key)) return;
    students[key] = {active: item?.active !== false, studentKey:key,
      namaSantri:String(item?.namaSantri || item?.namaAnak || '').trim()};
  });
  return students;
}

module.exports = {rolesOf, accessFor, explicitWaliStudents};
