(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CahayaRoleSystemV2 = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const ROLE_IDS = Object.freeze([
    "GURU_PONDOK", "GURU_PKBM", "NAQIB", "NAQIBAH", "KONSELOR",
    "MENTOR_USRAH", "MANAJER", "SUPERVISOR", "DIREKTUR", "KESEHATAN",
    "LAYANAN_KEBERSIHAN", "DAPUR", "SARPRAS", "MEDIA", "WALI_SANTRI"
  ]);
  const ROLE_SET = new Set(ROLE_IDS);
  const UNIT_IDS = new Set(["PUTRA", "PUTRI", "ALL"]);
  const DOMAIN_IDS = new Set(["KEPONDOKAN", "PKBM"]);
  const BASE_MENUS = ["menu-home", "menu-profil", "menu-chat", "menu-panduan-kerja", "menu-kpi-role", "menu-jadwal-role"];

  const ROLE_DEFINITIONS = Object.freeze({
    GURU_PONDOK: { label: "Guru Pondok", home: "home-guru.html?v=201", legacyRole: "guru" },
    GURU_PKBM: { label: "Guru PKBM", home: "role-workspace.html?v=205", legacyRole: "guru" },
    NAQIB: { label: "Naqib", home: "home-naqib.html?v=210", legacyRole: "naqib" },
    NAQIBAH: { label: "Naqibah", home: "home-naqib.html?v=210", legacyRole: "naqib" },
    KONSELOR: { label: "Konselor", home: "home-konselor.html?v=220", legacyRole: "konselor" },
    MENTOR_USRAH: { label: "Mentor Usrah", home: "home-mentor-usrah.html?v=224", legacyRole: "mentor" },
    MANAJER: { label: "Manajer", home: "role-workspace.html?v=205", legacyRole: "manajer" },
    SUPERVISOR: { label: "Supervisor", home: "home-supervisor-v2.html?v=239", legacyRole: "supervisor" },
    DIREKTUR: { label: "Direktur", home: "home-direktur.html?v=240", legacyRole: "direktur" },
    KESEHATAN: { label: "Kesehatan", home: "role-workspace.html?v=205", legacyRole: "kesehatan" },
    LAYANAN_KEBERSIHAN: { label: "Layanan & Kebersihan", home: "role-workspace.html?v=205", legacyRole: "keamanan-kebersihan" },
    DAPUR: { label: "Dapur", home: "home-dapur.html?v=275", legacyRole: "tim-dapur" },
    SARPRAS: { label: "Sarana & Prasarana", home: "role-workspace.html?v=205", legacyRole: "sarpras" },
    MEDIA: { label: "Media", home: "home-media.html?v=226", legacyRole: "media-digital" },
    WALI_SANTRI: { label: "Wali Santri", home: "wali/dashboard/index.html?v=20260820-v70", legacyRole: "wali" }
  });

  const ROLE_PERMISSIONS = Object.freeze({
    GURU_PONDOK: [...BASE_MENUS, "menu-kalender-pendidikan", "menu-absen-guru", "menu-absen-kbm", "menu-guru-menulis", "menu-kalender-materi", "menu-tahfiz", "menu-laporan-murojaah", "menu-nilai", "menu-tindak-lanjut-guru", "menu-asesmen-guru", "menu-kpi-guru"],
    GURU_PKBM: [...BASE_MENUS, "menu-kalender-pendidikan"],
    NAQIB: [...BASE_MENUS, "menu-dashboard-operasional", "menu-absen-asrama", "menu-gamifikasi", "menu-skor-usrah", "menu-kpi-naqib", "menu-jadwal-piket", "menu-jurnal-piket", "menu-naqib-teladan", "menu-riwayat-laporan", "menu-riwayat-absensi", "menu-usrah", "menu-laporan-murojaah", "menu-asesmen-naqib", "menu-asesmen-santri"],
    NAQIBAH: [...BASE_MENUS, "menu-dashboard-operasional", "menu-absen-asrama", "menu-gamifikasi", "menu-skor-usrah", "menu-kpi-naqib", "menu-jadwal-piket", "menu-jurnal-piket", "menu-naqib-teladan", "menu-riwayat-laporan", "menu-riwayat-absensi", "menu-usrah", "menu-laporan-murojaah", "menu-asesmen-naqib", "menu-asesmen-santri"],
    KONSELOR: [...BASE_MENUS, "menu-kasus-masuk", "menu-kasus-aktif", "menu-konseling-konselor", "menu-eskalasi-konselor", "menu-riwayat-kasus", "menu-kpi-konselor", "menu-self-konselor"],
    MENTOR_USRAH: [...BASE_MENUS, "menu-mentoring-individu", "menu-mentoring-usrah"],
    SUPERVISOR: [...BASE_MENUS, "menu-supervisor-v2", "menu-supervisor-schedule", "menu-kpi-supervisor", "menu-arahan-kasus", "menu-dashboard-operasional", "menu-supervisi-terpadu", "menu-kpi-guru", "menu-review-pendidikan", "menu-kontrol-publikasi-rapor", "menu-review-pembinaan", "menu-kontrol-pendidikan", "menu-penempatan-tahsin", "menu-kontrol-pembinaan", "menu-observasi-pembelajaran", "menu-observer-pengasuhan", "menu-pantau-pendampingan", "menu-pantau-asesmen", "menu-monitoring-absen-guru", "menu-raport-sdm", "menu-tindak-lanjut-sdm", "menu-jurnal-kesehatan", "menu-pemeriksaan-kesehatan", "menu-stok-obat", "menu-jurnal-sarpras", "menu-checklist-sarpras", "menu-tindak-sarpras", "menu-jurnal-pkl", "menu-buku-izin", "menu-buku-tamu", "menu-penitipan-barang", "menu-media", "menu-dapur-menu", "menu-dapur-procurement-report"],
    DIREKTUR: [...BASE_MENUS, "menu-direktur-v2", "menu-kpi-direktur", "menu-jadwal-direktur", "menu-arahan-kasus", "menu-dashboard-operasional", "menu-supervisi-terpadu", "menu-keputusan-direktur", "menu-kpi-guru", "menu-kontrol-pendidikan", "menu-observasi-pembelajaran", "menu-absensi-ibadah-guru", "menu-review-pendidikan", "menu-dashboard-pendidikan", "menu-tindak-akademik", "menu-kontrol-pembinaan", "menu-review-pembinaan", "menu-dashboard-dua-divisi", "menu-pantau-pendampingan", "menu-pantau-asesmen", "menu-kalender-pendidikan", "menu-dashboard-pimpinan", "menu-perizinan-santri", "menu-rekap-kepala-sekolah", "menu-raport-bulanan", "menu-monitoring-absen-guru", "menu-raport-sdm", "menu-tindak-lanjut-sdm", "menu-buku-izin"],
    KESEHATAN: [...BASE_MENUS, "menu-dashboard-operasional", "menu-jurnal-kesehatan", "menu-pemeriksaan-kesehatan", "menu-perizinan-uks", "menu-stok-obat"],
    LAYANAN_KEBERSIHAN: [...BASE_MENUS, "menu-dashboard-operasional", "menu-jurnal-pkl", "menu-laporan-murojaah", "menu-buku-tamu", "menu-penitipan-barang"],
    DAPUR: [...BASE_MENUS, "menu-dashboard-operasional", "menu-dapur-stock", "menu-dapur-menu", "menu-dapur-shopping", "menu-dapur-received"],
    SARPRAS: [...BASE_MENUS, "menu-dashboard-operasional", "menu-jurnal-sarpras", "menu-checklist-sarpras", "menu-tindak-sarpras"],
    MEDIA: [...BASE_MENUS, "menu-dashboard-operasional", "menu-media", "menu-gallery-dokumentasi", "menu-manajemen-konten"],
    MANAJER: [...BASE_MENUS, "menu-dashboard-operasional", "menu-kontrol-pendidikan", "menu-materi-pembelajaran", "menu-nilai-manajer", "menu-guru-pondok", "menu-observasi-pembelajaran", "menu-riwayat-temuan", "menu-pembinaan-guru", "menu-absensi-ibadah-guru", "menu-tindak-akademik", "menu-kpi-manajer", "menu-penempatan-tahsin", "menu-kontrol-pembinaan", "menu-pantau-asesmen", "menu-jurnal-kesehatan", "menu-jurnal-sarpras", "menu-jurnal-pkl", "menu-media"],
    WALI_SANTRI: ["menu-home", "menu-panduan-kerja"]
  });

  const SUPERVISOR_DIVISION_MENUS = Object.freeze({
    PENDIDIKAN: new Set(["menu-dashboard-operasional", "menu-kpi-guru", "menu-kpi-manajer", "menu-review-pendidikan", "menu-kontrol-publikasi-rapor", "menu-kontrol-pendidikan", "menu-penempatan-tahsin", "menu-materi-pembelajaran", "menu-nilai-manajer", "menu-guru-pondok", "menu-observasi-pembelajaran", "menu-riwayat-temuan", "menu-pembinaan-guru", "menu-absensi-ibadah-guru", "menu-tindak-akademik", "menu-monitoring-absen-guru", "menu-raport-sdm", "menu-tindak-lanjut-sdm"]),
    PEMBINAAN_KARAKTER: new Set(["menu-arahan-kasus", "menu-dashboard-operasional", "menu-review-pembinaan", "menu-kontrol-pembinaan", "menu-kpi-manajer", "menu-observer-pengasuhan", "menu-pantau-pendampingan", "menu-pantau-asesmen", "menu-raport-sdm", "menu-tindak-lanjut-sdm"]),
    KESEHATAN: new Set(["menu-dashboard-operasional", "menu-jurnal-kesehatan", "menu-pemeriksaan-kesehatan", "menu-stok-obat"]),
    LAYANAN_KEBERSIHAN: new Set(["menu-dashboard-operasional", "menu-jurnal-pkl", "menu-buku-izin", "menu-buku-tamu", "menu-penitipan-barang"]),
    SARPRAS: new Set(["menu-dashboard-operasional", "menu-jurnal-sarpras", "menu-checklist-sarpras", "menu-tindak-sarpras"]),
    MEDIA: new Set(["menu-dashboard-operasional", "menu-media"]),
    DAPUR: new Set(["menu-dashboard-operasional", "menu-dapur-menu", "menu-dapur-procurement-report"])
  });

  // V2 migration suggestions and outbound aliases live here. The unmigrated
  // application's compatibility branch is retained until its consumers migrate.
  // Ambiguous values require explicit assignment and never activate V2.
  const LEGACY_ROLE_MAP = Object.freeze({
    "direktur": "DIREKTUR", "director": "DIREKTUR", "direktur pesantren": "DIREKTUR",
    "naqib": "NAQIB", "naqib operasional": "NAQIB", "naqib-operasional": "NAQIB",
    "naqibah": "NAQIBAH",
    "konselor": "KONSELOR", "konselor pemula": "KONSELOR", "konselor-pemula": "KONSELOR", "konselor muda": "KONSELOR", "konselor-muda": "KONSELOR", "konselor madya": "KONSELOR", "konselor-madya": "KONSELOR", "konselor utama": "KONSELOR", "konselor-utama": "KONSELOR",
    "mentor usrah": "MENTOR_USRAH", "mentor-usrah": "MENTOR_USRAH",
    "supervisor": "SUPERVISOR", "supervisor pendidikan": "SUPERVISOR", "supervisor-pendidikan": "SUPERVISOR", "supervisor pembinaan": "SUPERVISOR", "supervisor-pembinaan": "SUPERVISOR", "supervisor pendidikan dan pengasuhan": "SUPERVISOR", "supervisor-pendidikan-pengasuhan": "SUPERVISOR",
    "manajer": "MANAJER", "manager": "MANAJER", "manajer-pendidikan": "MANAJER", "manajer-pengasuhan": "MANAJER", "manajer-pembinaan": "MANAJER",
    "kesehatan": "KESEHATAN", "tim kesehatan": "KESEHATAN", "petugas kesehatan": "KESEHATAN",
    "keamanan kebersihan": "LAYANAN_KEBERSIHAN", "keamanan-kebersihan": "LAYANAN_KEBERSIHAN", "keamanan dan kebersihan": "LAYANAN_KEBERSIHAN",
    "tim dapur": "DAPUR", "tim-dapur": "DAPUR", "petugas dapur": "DAPUR", "dapur": "DAPUR",
    "sarpras": "SARPRAS", "kepala sarpras": "SARPRAS",
    "media": "MEDIA", "media digital": "MEDIA", "media-digital": "MEDIA", "tim media": "MEDIA",
    "wali": "WALI_SANTRI", "wali santri": "WALI_SANTRI", "wali-santri": "WALI_SANTRI",
    "guru pondok": "GURU_PONDOK", "guru-pondok": "GURU_PONDOK", "muallim": "GURU_PONDOK", "mu'allim": "GURU_PONDOK", "muallimah": "GURU_PONDOK", "mu'allimah": "GURU_PONDOK",
    "guru pkbm": "GURU_PKBM", "guru-pkbm": "GURU_PKBM"
  });
  const AMBIGUOUS_LEGACY_ROLES = new Set(["admin", "administrator", "guru", "mentor", "mentor-quran", "manajer", "manager", "operasional", "observer", "staf-muda", "staf-mula", "layanan", "keuangan", "kasir", "wakil", "yayasan", "kepala-sekolah", "cla", "asisten-naqib", "naqib-pendamping", "manajer-pendidikan", "manajer-pengasuhan", "manajer-pembinaan"]);

  function exactRole(value) {
    const role = String(value || "");
    return ROLE_SET.has(role) ? role : "";
  }
  function legacyKey(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ");
  }
  function list(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value && typeof value === "object") return Object.keys(value).filter(key => value[key]);
    return value ? [value] : [];
  }
  function enumUnit(value) {
    const v = String(value || "").trim().toUpperCase();
    if (v === "SEMUA" || v === "PUTRA & PUTRI" || v === "ALL") return "ALL";
    return UNIT_IDS.has(v) ? v : "";
  }
  function enumDomain(value) {
    const v = String(value || "").trim().toUpperCase();
    if (v === "PONDOK" || v === "PESANTREN") return "KEPONDOKAN";
    return DOMAIN_IDS.has(v) ? v : "";
  }
  function ids(value) { return [...new Set(list(value).map(v => String(v || "").trim()).filter(Boolean))]; }
  // Read-only adapter over the existing users/{username} link. Never create a
  // studentIds mapping or infer a child from the parent's label/username/cache.
  // This priority matches wali/dashboard/script.js:studentNameFrom().
  function existingWaliChildLink(profile) {
    for (const field of ["namaAnak", "namaSantri", "namaAnanda", "studentName", "anak"]) {
      if (typeof profile?.[field] === "string" && profile[field].trim()) return {[field]:profile[field]};
    }
    return {};
  }
  function waliChildName(profile) { return Object.values(existingWaliChildLink(profile))[0] || ""; }
  function waliNamesMatch(a,b) {
    // When inside Portal Wali, reuse its authoritative name matcher unchanged.
    if (typeof root?.CahayaWaliSession?.namesMatch === "function") return root.CahayaWaliSession.namesMatch(a,b);
    // Outside that portal only exact names are accepted; no fuzzy child grants.
    return Boolean(a && b && String(a).trim().toUpperCase() === String(b).trim().toUpperCase());
  }
  function normalizeScope(scope) {
    scope = scope && typeof scope === "object" ? scope : {};
    const managedRoles = ids(scope.managedRoles).filter(exactRole);
    const programDomain = enumDomain(scope.programDomain || scope.domain);
    const explicitArea = String(scope.area || "").trim().toUpperCase().replace(/[ &/-]+/g, "_");
    // Compatibility for Manager profiles saved by Manajemen User V2 before
    // it persisted `area`. This exact Pondok combination is unambiguous and
    // does not infer an area from a person's name or a legacy role string.
    const area = explicitArea || (programDomain === "KEPONDOKAN" && managedRoles.includes("GURU_PONDOK") ? "PENDIDIKAN" : "");
    return Object.freeze({
      unit: enumUnit(scope.unit),
      area,
      divisionIds: [...new Set(ids(scope.divisionIds || scope.divisions || scope.scopeDivisions).map(id=>['LAYANAN','PELAYANAN'].includes(id.toUpperCase())?'LAYANAN_KEBERSIHAN':id))],
      usrahIds: ids(scope.usrahIds),
      studentIds: ids(scope.studentIds),
      programDomain,
      supervisedRoles: ids(scope.supervisedRoles).filter(exactRole),
      managedRoles,
      level: (()=>{const value=String(scope.level||"").trim().toUpperCase();return value==="MUDA"?"MADYA":["PEMULA","MADYA"].includes(value)?value:""})(),
      ...existingWaliChildLink(scope)
    });
  }
  function scopeFromAssignment(assignment) {
    const division = String(assignment?.divisionId || assignment?.division || "").trim().toUpperCase().replace(/[ &/-]+/g, "_");
    return normalizeScope({
      unit: assignment?.unit,
      divisionIds: assignment?.divisionIds || assignment?.scopeDivisions || (division ? [division] : []),
      usrahIds: assignment?.usrahIds,
      studentIds: assignment?.studentIds,
      programDomain: assignment?.programDomain || assignment?.domain
    });
  }
  function mergeScopes(a, b) {
    a = normalizeScope(a); b = normalizeScope(b);
    return normalizeScope({
      unit: a.unit === b.unit ? a.unit : (a.unit && b.unit ? "ALL" : a.unit || b.unit),
      area: a.area || b.area,
      divisionIds: [...a.divisionIds, ...b.divisionIds], usrahIds: [...a.usrahIds, ...b.usrahIds],
      studentIds: [...a.studentIds, ...b.studentIds], programDomain: a.programDomain || b.programDomain
    });
  }
  function canonicalEntries(user) {
    if (Number(user?.roleSystemVersion || 0) !== 2) return [];
    const raw = Array.isArray(user.roles) ? user.roles : (Array.isArray(user.rolesV2) ? user.rolesV2 : []);
    return raw.map(item => {
      const roleId = exactRole(typeof item === "string" ? item : item?.roleId);
      // Child relationship belongs to the production profile, not a duplicated
      // assignments.WALI_SANTRI mapping. Conflicting assignment fields cannot override it.
      const scope = roleId === "WALI_SANTRI" ? existingWaliChildLink(user)
        : user.assignments?.[roleId] || (typeof item === "object" ? item?.scope : {}) || {};
      return { roleId, raw: item, scope };
    });
  }
  function legacySources(user) {
    const result = [];
    const add = (value, source, assignment) => list(value).forEach(role => result.push({ role: String(role || ""), source, assignment }));
    add(user?.workspaceRoles, "workspaceRoles"); add(user?.akses, "akses"); add(user?.jabatan, "jabatan"); add(user?.role, "role"); add(user?.peran, "peran");
    list(user?.workspaceAssignments).forEach(a => add(a?.role, "workspaceAssignments", a));
    list(user?.operationalAssignments).forEach(a => add(a?.functionKey || a?.role, "operationalAssignments", a));
    return result;
  }
  function mapLegacyEntry(item) {
    const key = legacyKey(item.role);
    let roleId = LEGACY_ROLE_MAP[key] || "";
    const scope = normalizeScope({...scopeFromAssignment(item.assignment || {}),level: ["konselor pemula","konselor-pemula"].includes(key) ? "PEMULA" : ["konselor muda","konselor-muda","konselor madya","konselor-madya"].includes(key) ? "MADYA" : item.assignment?.level});
    if (key === "guru" && scope.programDomain === "KEPONDOKAN") roleId = "GURU_PONDOK";
    if (key === "guru" && scope.programDomain === "PKBM") roleId = "GURU_PKBM";
    if ((key === "naqib" || key === "naqib operasional" || key === "naqib-operasional") && scope.unit === "PUTRI") roleId = "NAQIBAH";
    if (!roleId) return { unresolved: true, value: item.role, source: item.source, reason: AMBIGUOUS_LEGACY_ROLES.has(key) ? "AMBIGUOUS_ROLE" : "UNMAPPED_ROLE" };
    return { roleId, scope, legacyValue: item.role, source: item.source };
  }
  function adaptUser(user) {
    user = user && typeof user === "object" ? user : {};
    const explicit = canonicalEntries(user);
    const canonical = Number(user.roleSystemVersion) === 2;
    const mapped = canonical ? explicit : legacySources(user).map(mapLegacyEntry);
    const byRole = new Map(), unresolved = [];
    mapped.forEach(item => {
      if (!item.roleId) { unresolved.push(item.unresolved ? item : {value:item.raw,reason:"INVALID_CANONICAL_ROLE"}); return; }
      const previous = byRole.get(item.roleId);
      if (canonical && previous) { unresolved.push({value:item.roleId,reason:"DUPLICATE_ROLE"}); return; }
      const scope = item.roleId === "WALI_SANTRI" ? assignmentFor(item.roleId,existingWaliChildLink(user))
        : canonical ? assignmentFor(item.roleId, item.scope) : (previous ? mergeScopes(previous.scope, item.scope) : normalizeScope(item.scope));
      byRole.set(item.roleId, { roleId: item.roleId, scope, sources: [...(previous?.sources || []), item.source || "roles"] });
    });
    const roles = [...byRole.keys()];
    let defaultRole = exactRole(user.defaultRole || user.defaultRoleV2 || "");
    if (!roles.includes(defaultRole)) defaultRole = roles[0] || "";
    const assignments = Object.fromEntries([...byRole].map(([role, item]) => [role, item.scope]));
    const assignmentErrors = Object.fromEntries(roles.map(role => [role, validateAssignment(role, assignments[role])]));
    return deepFreeze({
      mode: canonical ? "canonical" : "compatibility",
      roleSystemVersion: 2, roles: Object.freeze(roles), defaultRole,
      assignments, scopes: assignments, assignmentErrors,
      unresolved, userKey: String(user.uid || user.username || "")
    });
  }
  function storageGet(storage, key) { try { return storage?.getItem(key) || ""; } catch (_) { return ""; } }
  function storageSet(storage, key, value) { try { storage?.setItem(key, value); } catch (_) {} }
  function resolveSession(user, storage) {
    const adapted = adaptUser(user);
    const sameUser = storageGet(storage, "cahayaRoleUserV2") === adapted.userKey;
    let activeRole = exactRole((sameUser && storageGet(storage, "cahayaActiveRoleV2")) || user?.activeRoleV2 || adapted.defaultRole);
    if (!adapted.roles.includes(activeRole)) activeRole = adapted.defaultRole;
    const assignment = adapted.assignments[activeRole] || normalizeScope({});
    return deepFreeze({ ...adapted, activeRole, activeAssignment: assignment, activeScope: assignment });
  }
  function switchRole(session, roleId, storage) {
    roleId = exactRole(roleId);
    if (!roleId || !session?.roles?.includes(roleId)) return { ok: false, reason: "ROLE_NOT_ASSIGNED", session };
    storageSet(storage, "cahayaActiveRoleV2", roleId);
    storageSet(storage, "cahayaRoleUserV2", session.userKey);
    const legacy = legacyRoleFor(roleId);
    storageSet(storage, "cahayaActiveRole", legacy);
    storageSet(storage, "cahayaCurrentRole", legacy);
    const assignment = session.assignments[roleId] || normalizeScope({});
    const next = deepFreeze({ ...session, activeRole: roleId, activeAssignment: assignment, activeScope: assignment });
    return { ok: true, session: next, legacyRole: legacy };
  }
  function labelFor(roleId) { return ROLE_DEFINITIONS[exactRole(roleId)]?.label || String(roleId || ""); }
  function displayLabelFor(roleId, assignment) {
    roleId = exactRole(roleId);
    const scope = normalizeScope(assignment);
    if (roleId === "KONSELOR") return scope.level === "PEMULA" ? "Konselor Pemula" : scope.level === "MADYA" ? "Konselor Madya" : "Konselor";
    if (roleId === "MANAJER") return scope.area === "PENDIDIKAN" ? "Manajer Pendidikan" : scope.area === "PEMBINAAN_KARAKTER" ? "Manajer Pembinaan Karakter" : "Manajer";
    if (roleId === "SUPERVISOR") {
      const area = scope.area || (scope.divisionIds.length === 1 ? scope.divisionIds[0] : "");
      return area === "PENDIDIKAN" ? "Supervisor Pendidikan" : area === "PEMBINAAN_KARAKTER" ? "Supervisor Pembinaan Karakter" : "Supervisor";
    }
    return labelFor(roleId);
  }
  function isCharacterManager(scope) {
    const a = assignmentFor("MANAJER", scope || {});
    return a.area === "PEMBINAAN_KARAKTER" && ["PUTRA","PUTRI"].includes(a.unit) &&
      a.managedRoles.some(role => ["NAQIB","NAQIBAH"].includes(role)) && a.managedRoles.includes("KONSELOR");
  }
  function isEducationManager(scope) {
    const a = assignmentFor("MANAJER", scope || {});
    return a.area === "PENDIDIKAN" && a.programDomain === "KEPONDOKAN" && a.managedRoles.includes("GURU_PONDOK");
  }
  function canManageTahsinLevels(role, scope) {
    const a = assignmentFor(role, scope || {});
    if (validateAssignment(role, a).length) return false;
    if (role === 'MANAJER') return isEducationManager(a) && ['PUTRA','PUTRI'].includes(a.unit);
    return role === 'SUPERVISOR' && ['PUTRA','PUTRI','ALL'].includes(a.unit) &&
      a.supervisedRoles.includes('GURU_PONDOK') && (!a.programDomain || a.programDomain === 'KEPONDOKAN') &&
      (!a.divisionIds.length || a.divisionIds.some(id => id.toUpperCase() === 'PENDIDIKAN'));
  }
  const MANAGER_HOME_BY_AREA = Object.freeze({
    PENDIDIKAN: "home-manajer-pendidikan.html?v=232",
    PEMBINAAN_KARAKTER: "home-manajer-pembinaan-karakter.html?v=238"
  });
  function managerHomeFor(scope) {
    const area = String(scope?.area || "").trim().toUpperCase();
    return MANAGER_HOME_BY_AREA[area] || "";
  }
  function homeFor(roleId, scope) {
    roleId = exactRole(roleId);
    if (roleId === "MANAJER") return managerHomeFor(scope) || ROLE_DEFINITIONS.MANAJER.home;
    return ROLE_DEFINITIONS[roleId]?.home || "home.html?v=193";
  }
  function legacyRoleFor(roleId) { return ROLE_DEFINITIONS[exactRole(roleId)]?.legacyRole || ""; }
  const ROLE_DIVISIONS = Object.freeze({GURU_PONDOK:"PENDIDIKAN",GURU_PKBM:"PKBM",NAQIB:"PEMBINAAN_KARAKTER",NAQIBAH:"PEMBINAAN_KARAKTER",KONSELOR:"PEMBINAAN_KARAKTER",MENTOR_USRAH:"PEMBINAAN_KARAKTER",DAPUR:"DAPUR",SARPRAS:"SARPRAS",KESEHATAN:"KESEHATAN",LAYANAN_KEBERSIHAN:"LAYANAN_KEBERSIHAN",MEDIA:"MEDIA"});
  function deepFreeze(value) {
    if (value && typeof value === "object") {
      Object.values(value).forEach(deepFreeze); Object.freeze(value);
    }
    return value;
  }
  function assignmentFor(role, input) {
    const a = normalizeScope(input);
    // Defaults intrinsic to a role are safe; never infer a person's assignment.
    return normalizeScope({...a,
      unit: a.unit || (role === "NAQIB" ? "PUTRA" : role === "NAQIBAH" ? "PUTRI" : role === "DIREKTUR" ? "ALL" : ""),
      programDomain: a.programDomain || (role === "GURU_PONDOK" ? "KEPONDOKAN" : role === "GURU_PKBM" ? "PKBM" : "")
    });
  }
  function validateAssignment(role, a) {
    const errors = [];
    if ((role === "NAQIB" && a.unit !== "PUTRA") || (role === "NAQIBAH" && a.unit !== "PUTRI")) errors.push("ROLE_UNIT_CONFLICT");
    if ((role === "GURU_PONDOK" && a.programDomain !== "KEPONDOKAN") || (role === "GURU_PKBM" && a.programDomain !== "PKBM")) errors.push("ROLE_DOMAIN_CONFLICT");
    if (["MANAJER","SUPERVISOR","KONSELOR"].includes(role) && !a.unit) errors.push("UNIT_REQUIRED");
    if (role === "KONSELOR" && (!["PUTRA","PUTRI"].includes(a.unit) || !a.level)) errors.push("COUNSELOR_LEVEL_AND_UNIT_REQUIRED");
    if (role === "MENTOR_USRAH" && !a.usrahIds.length) errors.push("USRAH_IDS_REQUIRED");
    if (role === "WALI_SANTRI" && !waliChildName(a)) errors.push("EXISTING_CHILD_LINK_REQUIRED");
    const assigned = role === "MANAJER" ? a.managedRoles : role === "SUPERVISOR" ? a.supervisedRoles : null;
    if (assigned && !assigned.length) errors.push("ASSIGNED_ROLES_REQUIRED");
    if (assigned?.some(r => !ROLE_DIVISIONS[r])) errors.push("UNSUPPORTED_MANAGED_AREA");
    if (role === "MANAJER" && a.managedRoles.includes("GURU_PONDOK") && a.programDomain !== "KEPONDOKAN") errors.push("KEPONDOKAN_DOMAIN_REQUIRED");
    if (role === "MANAJER" && a.managedRoles.includes("GURU_PKBM") && a.programDomain !== "PKBM") errors.push("PKBM_DOMAIN_REQUIRED");
    return errors;
  }
  function assignedAreaMenus(role, assignment) {
    const a = assignmentFor(role, assignment);
    if (validateAssignment(role, a).length) return BASE_MENUS;
    const assigned = role === "MANAJER" ? a.managedRoles : a.supervisedRoles;
    const allowed = new Set(role === "SUPERVISOR" ? [...BASE_MENUS, "menu-supervisor-v2", "menu-supervisor-schedule", "menu-kpi-supervisor"] : BASE_MENUS);
    assigned.forEach(r => (SUPERVISOR_DIVISION_MENUS[ROLE_DIVISIONS[r]] || new Set()).forEach(menu => allowed.add(menu)));
    // Broad legacy command centers are not granted just because two areas exist.
    return [...allowed].filter(menu => ROLE_PERMISSIONS[role].includes(menu));
  }
  function menusFor(roleId, scope) {
    roleId = exactRole(roleId);
    if (!roleId) return [];
    const a = assignmentFor(roleId, scope);
    if (validateAssignment(roleId,a).length) return [...BASE_MENUS].filter(m=>ROLE_PERMISSIONS[roleId].includes(m));
    // Navigation permissions follow the active V2 workspace, never the union
    // of legacy division menus. Business-action permissions remain separate.
    if (roleId === 'DIREKTUR') return [...BASE_MENUS,'menu-direktur-v2','menu-jadwal-direktur','menu-kpi-direktur','menu-arahan-kasus'];
    if (roleId === 'SUPERVISOR') return [...BASE_MENUS,'menu-supervisor-v2','menu-supervisor-schedule','menu-kpi-supervisor',...(a.supervisedRoles.includes('KONSELOR')?['menu-arahan-kasus']:[]),...(a.supervisedRoles.includes('DAPUR')?['menu-dapur-menu','menu-dapur-procurement-report']:[]),...(canManageTahsinLevels(roleId,a)?['menu-penempatan-tahsin','menu-review-pendidikan','menu-kontrol-publikasi-rapor']:[])];
    if (roleId === 'MANAJER') {
      if (isEducationManager(a)) return [...BASE_MENUS,'menu-kontrol-pendidikan','menu-materi-pembelajaran','menu-tindak-akademik','menu-absensi-ibadah-guru','menu-guru-pondok','menu-nilai-manajer','menu-observasi-pembelajaran','menu-riwayat-temuan','menu-pembinaan-guru','menu-kpi-manajer','menu-penempatan-tahsin'];
      if (isCharacterManager(a)) return [...BASE_MENUS,'menu-kontrol-pembinaan','menu-kpi-manajer'];
      return [...BASE_MENUS];
    }
    if (['NAQIB','NAQIBAH'].includes(roleId)) return ROLE_PERMISSIONS[roleId].filter(p=>p.startsWith('menu-')&&!['menu-usrah','menu-jadwal-piket','menu-riwayat-absensi'].includes(p));
    return [...new Set(["MANAJER","SUPERVISOR"].includes(roleId) ? assignedAreaMenus(roleId,a) : (ROLE_PERMISSIONS[roleId] || []).filter(p=>p.startsWith("menu-")))].filter(menu=>menu!=="menu-kpi-manajer"||roleId==="MANAJER"&&(isEducationManager(a)||isCharacterManager(a))&&["PUTRA","PUTRI"].includes(a.unit));
  }
  const ACTIONS = {
    GURU_PONDOK:["education.read","attendance.record","violation.report"],GURU_PKBM:["education.read","attendance.record","violation.report"],
    NAQIB:["program.read","attendance.record","initiative.record","cahaya.assess","violation.report"],
    NAQIBAH:["program.read","attendance.record","initiative.record","cahaya.assess","violation.report"],
    KONSELOR:["case.read","case.handle","case.escalate","case.complete","message.broadcast"],MENTOR_USRAH:["mentoring.read","mentoring.record"],
    MANAJER:["operations.read","operations.manage"],SUPERVISOR:["operations.read","operations.verify"],
    DIREKTUR:["operations.read","operations.decide","message.broadcast"],KESEHATAN:["health.record"],LAYANAN_KEBERSIHAN:["cleanliness.record"],
    DAPUR:["kitchen.record"],SARPRAS:["facilities.record"],MEDIA:["media.record"],WALI_SANTRI:["student.read"]
  };
  ROLE_IDS.forEach(role=>{ ROLE_PERMISSIONS[role].push("guide.read",...ACTIONS[role]); deepFreeze(ROLE_PERMISSIONS[role]); deepFreeze(ROLE_DEFINITIONS[role]); });
  function can(roleId, permission, scope) {
    if (!exactRole(roleId)) return false;
    if (permission === "menu-kpi-manajer") return roleId === "MANAJER" && (isEducationManager(scope)||isCharacterManager(scope)) && ["PUTRA","PUTRI"].includes(assignmentFor(roleId,scope).unit);
    if (String(permission).startsWith("menu-")) return menusFor(roleId,scope).includes(permission);
    if (permission === "guide.read") return true;
    return !validateAssignment(roleId,assignmentFor(roleId,scope)).length && ROLE_PERMISSIONS[roleId].includes(permission);
  }
  function scopeAllows(scope, resource) {
    scope = normalizeScope(scope); resource = resource && typeof resource === "object" ? resource : {};
    const unit = enumUnit(resource.unit), domain = enumDomain(resource.programDomain || resource.domain);
    if (scope.unit && scope.unit !== "ALL" && scope.unit !== unit) return false;
    if (scope.programDomain && scope.programDomain !== domain) return false;
    const divisionId = String(resource.divisionId || "").trim();
    if (scope.divisionIds.length && !scope.divisionIds.includes(divisionId)) return false;
    const usrahId = String(resource.usrahId || "").trim();
    if (scope.usrahIds.length && !scope.usrahIds.includes(usrahId)) return false;
    const studentId = String(resource.studentId || "").trim();
    if (scope.studentIds.length && !scope.studentIds.includes(studentId)) return false;
    return true;
  }
  function authorize(session, permission, resource) {
    if (session?.mode !== "canonical" || !can(session.activeRole, permission, session.activeAssignment)) return false;
    if (permission === "guide.read") return true;
    if (!resource || typeof resource !== "object") return false;
    const a = session.activeAssignment, role = session.activeRole;
    if (role === "WALI_SANTRI") {
      return waliNamesMatch(waliChildName(a), waliChildName(resource) || resource.nama_santri || resource.nama || "");
    }
    if (["MANAJER","SUPERVISOR"].includes(role)) {
      const areas = role === "MANAJER" ? a.managedRoles : a.supervisedRoles;
      if (!exactRole(resource.roleId) || !areas.includes(resource.roleId)) return false;
      const expected = resource.roleId === "GURU_PONDOK" ? "KEPONDOKAN" : resource.roleId === "GURU_PKBM" ? "PKBM" : "";
      if (expected && resource.programDomain !== expected) return false;
    }
    return scopeAllows(a, resource);
  }
  function filterResources(session, permission, records, describe) {
    if (typeof describe !== "function") throw new TypeError("A resource descriptor is required; missing metadata cannot grant scope.");
    return records.filter(record=>authorize(session,permission,describe(record)));
  }
  function projectLegacyProfile(user, session) {
    if (!session || session.mode !== "canonical") return { ...(user || {}), roleV2Compatibility: false };
    const legacyActive = legacyRoleFor(session.activeRole);
    // Child pages receive only the active role/assignment, never a union of grants.
    return { ...(user || {}), roleSystemVersion: 2, roles: [...session.roles], assignments: session.assignments,
      defaultRole: session.defaultRole, activeRoleV2: session.activeRole, activeAssignment: session.activeAssignment,
      workspaceRoles: [legacyActive], allRoles: [legacyActive], activeWorkspaceRoles:[legacyActive], akses: [legacyActive], jabatan:[legacyActive], role: legacyActive, activeRole: legacyActive,
      workspaceAssignments:[], operationalAssignments:[], roleAssignmentsV2:[], allowedMenus:menusFor(session.activeRole,session.activeAssignment), roleV2Compatibility: true };
  }

  return Object.freeze({
    VERSION: 2, ROLE_IDS, ROLE_DEFINITIONS, ROLE_PERMISSIONS, LEGACY_ROLE_MAP,
    normalizeScope, exactRole, adaptUser, resolveSession, switchRole, labelFor, displayLabelFor,
    homeFor, managerHomeFor, isEducationManager, isCharacterManager, canManageTahsinLevels, legacyRoleFor, menusFor, can, scopeAllows, authorize, projectLegacyProfile,
    assignmentFor, validateAssignment, filterResources, ROLE_DIVISIONS, existingWaliChildLink
  });
});
