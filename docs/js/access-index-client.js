/* Trusted access index written only from the Admin user editor. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CahayaAccessIndexClient = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  const normalizeRole = value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  function rolesOf(profile) {
    const raw = Number(profile?.roleSystemVersion) === 2 ? profile.roles :
      (profile?.roles || profile?.akses || profile?.role || profile?.jabatan);
    const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ?
      Object.keys(raw).filter(key => raw[key] === true) : [raw];
    return [...new Set(list.map(normalizeRole).filter(Boolean))];
  }
  function entriesFor(profile, username) {
    const roles = rolesOf(profile);
    const active = profile?.active !== false && profile?.disabled !== true;
    const isWali = roles.includes('wali') || roles.includes('wali_santri');
    const internal = roles.some(role => !['wali', 'wali_santri', 'santri', 'siswa', 'student'].includes(role));
    const user = {active, internal, username:String(username || '').trim().toLowerCase(),
      label:String(profile?.label || profile?.namaTampilan || profile?.nama || username || '').trim(),
      roles:Object.fromEntries(roles.map(role => [role, true])), updatedAt:new Date().toISOString()};
    const students = {};
    if (isWali) for (const item of profile?.students || []) {
      const key = String(item?.studentKey || item?.santriId || '').trim();
      if (!key || /[.#$\[\]\/]/.test(key)) continue;
      students[key] = {active:item.active !== false, studentKey:key,
        namaSantri:String(item.namaSantri || item.namaAnak || '').trim()};
    }
    return {user, wali:isWali ? {active:active && Object.values(students).some(item => item.active),
      students, updatedAt:user.updatedAt} : null};
  }
  return {rolesOf, entriesFor};
});
