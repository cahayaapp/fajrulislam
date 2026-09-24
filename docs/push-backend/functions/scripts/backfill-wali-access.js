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

const apply = process.argv.includes('--apply');
initializeApp({
  credential: applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://absensi-santri-fajrul-islam-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const cleanKey = value => String(value || '').trim().replace(/[.#$\[\]\/]/g, '');
const rolesOf = profile => {
  let roles = Number(profile.roleSystemVersion) === 2
    ? (profile.roles || [])
    : (profile.roles || profile.akses || profile.role || profile.jabatan || []);
  if (!Array.isArray(roles)) roles = [roles];
  return [...new Set(roles.map(value => String(value || '').trim().toLowerCase()).filter(Boolean))];
};
const studentsOf = profile => {
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
  return out;
};

async function resolveUid(profile, username) {
  if (profile.authUid || profile.uid) return String(profile.authUid || profile.uid);
  try {
    return (await getAuth().getUserByEmail(`${String(profile.username || username).toLowerCase()}@cahayaapp.id`)).uid;
  } catch (error) {
    return '';
  }
}

(async () => {
  const snapshot = await getFirestore().collection('users').get();
  const updates = {};
  const unresolved = [];
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
    const internal = roles.some(role => !['wali', 'wali_santri'].includes(role));
    updates[`cahaya_access/users/${uid}`] = {
      active: profile.disabled !== true,
      internal,
      username: String(profile.username || doc.id).trim().toLowerCase(),
      label: String(profile.label || profile.namaTampilan || profile.nama || profile.username || doc.id).trim(),
      roles: Object.fromEntries(roles.map(role => [role, true])),
      updatedAt: new Date().toISOString()
    };
    updates[`cahaya_access/wali/${uid}`] = null;
    if (isWali) {
      const students = studentsOf(profile);
      if (!Object.keys(students).length) {
        unresolved.push({username:doc.id, uid, reason:'EXPLICIT_STUDENT_KEY_REQUIRED'});
        continue;
      }
      updates[`cahaya_access/wali/${uid}`] = {active:profile.disabled !== true, students, updatedAt:new Date().toISOString()};
    }
    indexed += 1;
  }
  if (apply && Object.keys(updates).length) await getDatabase().ref().update(updates);
  console.log(JSON.stringify({mode:apply?'APPLY':'DRY_RUN', indexed, updateCount:Object.keys(updates).length, unresolved}, null, 2));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
