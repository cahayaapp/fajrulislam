#!/usr/bin/env node
'use strict';

/*
 * Administrative, non-destructive backfill for the trusted RTDB access index.
 * Default mode is dry-run. Use --apply only after reviewing every unresolved
 * Wali profile printed by this script.
 */
const {initializeApp, applicationDefault} = require('firebase-admin/app');
const {getAuth} = require('firebase-admin/auth');
const {getFirestore} = require('firebase-admin/firestore');
const {getDatabase} = require('firebase-admin/database');
const AccessIndex = require('../access-index-core');

const apply = process.argv.includes('--apply');
initializeApp({
  credential: applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://absensi-santri-fajrul-islam-default-rtdb.firebaseio.com'
});

const cleanKey = value => String(value || '').trim().replace(/[.#$\[\]\/]/g, '');
const normalizeName = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const rolesOf = AccessIndex.rolesOf;
const legacyStudentNamesOf = profile => [
  profile.namaAnak,
  profile.namaSantri,
  profile.namaAnanda,
  profile.studentName,
  profile.anak
].map(value => String(value || '').trim()).filter(Boolean);

const studentsOf = (profile, studentCatalog = new Map()) => {
  const assignment = profile.assignments?.WALI_SANTRI || profile.assignments?.wali_santri || {};
  const raw = [
    ...(Array.isArray(profile.studentKeys) ? profile.studentKeys : []),
    ...(Array.isArray(profile.santriIds) ? profile.santriIds : []),
    ...(Array.isArray(profile.students) ? profile.students : []),
    ...(Array.isArray(assignment.studentKeys) ? assignment.studentKeys : []),
    profile.studentKey,
    profile.santriId
  ].filter(Boolean);
  const out = {};
  raw.forEach(rawItem => {
    const item = rawItem && typeof rawItem === 'object' ? rawItem : {studentKey:rawItem};
    const studentKey = cleanKey(item.studentKey || item.santriId || item.id);
    if (!studentKey) return;
    out[studentKey] = {
      active: item.active !== false,
      studentKey,
      namaSantri: String(item.namaSantri || item.namaAnak || item.label || '').trim(),
      kelas: String(item.kelas || item.kelasSantri || '').trim(),
      usrah: String(item.usrah || item.namaUsrah || '').trim()
    };
  });
  if (!Object.keys(out).length) {
    legacyStudentNamesOf(profile).forEach(namaSantri => {
      const normalized = normalizeName(namaSantri);
      const candidates = studentCatalog.get(normalized) || [];
      if (candidates.length !== 1) return;
      const candidate = candidates[0];
      out[candidate.studentKey] = {
        active: true,
        studentKey: candidate.studentKey,
        namaSantri: candidate.namaSantri || namaSantri,
        kelas: candidate.kelas || '',
        usrah: candidate.usrah || '',
        source: 'LEGACY_NAME_UNIQUE_MATCH'
      };
    });
  }
  return out;
};

function addCatalogStudent(catalog, value = {}, fallbackKey = '', fallbackClass = '') {
  const row = typeof value === 'string' ? {namaSantri:value} : (value || {});
  const namaSantri = String(row.namaSantri || row.nama || row.namaAnak || row.label || '').trim();
  const studentKey = cleanKey(row.studentKey || row.santriId || row.studentId || fallbackKey || normalizeName(namaSantri));
  const normalized = normalizeName(namaSantri || studentKey);
  if (!studentKey || !normalized) return;
  const list = catalog.get(normalized) || [];
  if (!list.some(item => item.studentKey === studentKey)) list.push({
    studentKey,
    namaSantri,
    kelas:String(row.kelas || row.namaKelas || fallbackClass || '').trim(),
    usrah:String(row.usrah || row.namaUsrah || row.kelompok || '').trim()
  });
  catalog.set(normalized, list);
}

async function buildStudentCatalog(database) {
  const catalog = new Map();
  const [classSnapshot, indexSnapshot] = await Promise.all([
    database.ref('cahaya_app/master_akademik/kelas').get(),
    database.ref('cahaya_app/wali_index').get()
  ]);
  Object.entries(indexSnapshot.val() || {}).forEach(([studentKey, value]) => {
    addCatalogStudent(catalog, value, studentKey, value?.kelas || '');
    addCatalogStudent(catalog, {namaSantri:studentKey}, studentKey, value?.kelas || '');
    Object.values(value || {}).forEach(events => {
      Object.values(events || {}).forEach(event => {
        if (event && typeof event === 'object') addCatalogStudent(catalog, {
          namaSantri:event.namaSantri || event.nama_santri || event.namaAnak || event.studentName
        }, studentKey, value?.kelas || '');
      });
    });
  });
  const indexedNames = new Set(catalog.keys());
  const classes = classSnapshot.val() || {};
  Object.entries(classes).forEach(([kelas, value]) => {
    const members = Array.isArray(value) ? value : (value?.santri || value?.peserta || value?.students || value?.anggota || value);
    Object.entries(members || {}).forEach(([key, student]) => {
      if (/^\d+$/.test(key) && !(student?.studentKey || student?.santriId || student?.studentId)) return;
      const name = typeof student === 'string' ? student : (student?.namaSantri || student?.nama || student?.namaAnak || '');
      if (indexedNames.has(normalizeName(name))) return;
      addCatalogStudent(catalog, student, key, kelas);
    });
  });
  return catalog;
}

async function resolveUid(profile, username) {
  const expectedEmail = `${String(profile.username || username).toLowerCase()}@cahayaapp.id`;
  try {
    const user = profile.authUid || profile.uid
      ? await getAuth().getUser(String(profile.authUid || profile.uid))
      : await getAuth().getUserByEmail(expectedEmail);
    return String(user.email || '').toLowerCase() === expectedEmail ? user.uid : '';
  } catch (error) {
    return '';
  }
}

(async () => {
  const database = getDatabase();
  const studentCatalog = await buildStudentCatalog(database);
  const [snapshot, liveUsersSnapshot, liveWaliSnapshot] = await Promise.all([
    getFirestore().collection('users').get(),
    database.ref('cahaya_access/users').get(),
    database.ref('cahaya_access/wali').get()
  ]);
  const liveUsers = liveUsersSnapshot.val() || {}, liveWali = liveWaliSnapshot.val() || {};
  const updates = {};
  const unresolved = [];
  const accessMismatch = [];
  let indexed = 0;
  for (const doc of snapshot.docs) {
    const profile = doc.data() || {};
    const roles = rolesOf(profile);
    const isWali = roles.includes('wali') || roles.includes('wali_santri');
    const uid = await resolveUid(profile, doc.id);
    if (!uid) {
      unresolved.push({username:doc.id, reason:'AUTH_UID_NOT_FOUND'});
      continue;
    }
    const {isWali: _isWali, ...access} = AccessIndex.accessFor(profile, profile.username || doc.id);
    updates[`cahaya_access/users/${uid}`] = {...access, updatedAt:new Date().toISOString()};
    if (liveUsers[uid]?.active !== access.active || liveUsers[uid]?.internal !== access.internal)
      accessMismatch.push({username:doc.id, uid, kind:'INTERNAL_ACCESS_INDEX'});
    if (!isWali) updates[`cahaya_access/wali/${uid}`] = null;
    if (isWali) {
      const students = studentsOf(profile, studentCatalog);
      if (!Object.keys(students).length) {
        unresolved.push({username:doc.id, uid, reason:'EXPLICIT_STUDENT_KEY_REQUIRED'});
        continue;
      }
      const expectedKeys = Object.keys(students).sort().join('|');
      const actualKeys = Object.keys(liveWali[uid]?.students || {}).sort().join('|');
      if (liveWali[uid]?.active !== access.active || expectedKeys !== actualKeys ||
          Object.keys(students).some(key => liveWali[uid]?.students?.[key]?.active !== students[key].active))
        accessMismatch.push({username:doc.id, uid, kind:'WALI_STUDENT_SCOPE'});
      updates[`cahaya_access/wali/${uid}`] = {active:profile.disabled !== true && profile.active !== false, students, updatedAt:new Date().toISOString()};
    }
    indexed += 1;
  }
  if (apply && Object.keys(updates).length) await database.ref().update(updates);
  console.log(JSON.stringify({mode:apply?'APPLY':'DRY_RUN', indexed, updateCount:Object.keys(updates).length, catalogNames:studentCatalog.size, accessMismatch, unresolved}, null, 2));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
