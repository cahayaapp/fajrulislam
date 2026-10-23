#!/usr/bin/env node
'use strict';

/* Non-destructive mentoring read-index backfill.
 * Default: DRY RUN. Use --apply after reviewing the exact-name mapping report.
 * Use --student="MEDIKA PRATAMA" for one child or explicit --all for all. */
const fs = require('node:fs');

const cleanName = value => String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
const studentKey = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const recordName = value => cleanName(value?.namaSantri || value?.santri || value?.studentName);

function planBackfill(records = {}, options = {}) {
  const requested = cleanName(options.student || '');
  const updates = {}, matched = [], skipped = [], unresolved = [];
  for (const [id, value] of Object.entries(records || {})) {
    if (!value || typeof value !== 'object') { skipped.push({id, reason:'INVALID_RECORD'}); continue; }
    const name = recordName(value);
    if (requested && name !== requested) continue;
    if (!name) { unresolved.push({id, reason:'STUDENT_NAME_MISSING'}); continue; }
    const key = studentKey(value.studentKey || value.santriId || value.studentId || name);
    if (!key) { unresolved.push({id, name, reason:'STUDENT_KEY_UNRESOLVED'}); continue; }
    const payload = {...value, studentKey:key};
    if (!value.studentKey) updates[`/cahaya_app/log_mentoring_naqib/${id}/studentKey`] = key;
    updates[`/cahaya_app/wali_index/${key}/mentoring/${id}`] = payload;
    matched.push({id, name, studentKey:key, date:String(value.tanggal || value.mentoringDate || value.timestamp || '').slice(0,10)});
  }
  return {updates, report:{examined:Object.keys(records || {}).length, matched, skipped, unresolved, updateCount:Object.keys(updates).length}};
}

async function main() {
  const apply = process.argv.includes('--apply');
  const all = process.argv.includes('--all');
  const fixtureAt = process.argv.indexOf('--fixture');
  const studentArg = process.argv.find(arg => arg.startsWith('--student='));
  const student = studentArg ? studentArg.slice('--student='.length) : '';
  let records, db;
  if (fixtureAt >= 0) {
    records = JSON.parse(fs.readFileSync(process.argv[fixtureAt + 1], 'utf8'));
  } else {
    const {initializeApp, applicationDefault} = require('firebase-admin/app');
    const {getDatabase} = require('firebase-admin/database');
    initializeApp({credential:applicationDefault(), databaseURL:process.env.FIREBASE_DATABASE_URL || 'https://absensi-santri-fajrul-islam-default-rtdb.asia-southeast1.firebasedatabase.app'});
    db = getDatabase();
    records = (await db.ref('/cahaya_app/log_mentoring_naqib').get()).val() || {};
  }
  const plan = planBackfill(records, {student});
  if (apply) {
    if (!db) throw new Error('--apply tidak dapat digunakan bersama --fixture');
    if (!student && !all) throw new Error('--apply wajib menyertakan --student="NAMA SANTRI" atau flag eksplisit --all');
    if (!plan.report.matched.length) throw new Error('Tidak ada record dengan nama yang cocok persis');
    await db.ref().update(plan.updates);
  }
  console.log(JSON.stringify({mode:apply?'APPLY':'DRY_RUN', scope:student || (all?'ALL_EXPLICIT':'ALL_DRY_RUN'), ...plan.report}, null, 2));
}

module.exports = {cleanName, studentKey, recordName, planBackfill};
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
