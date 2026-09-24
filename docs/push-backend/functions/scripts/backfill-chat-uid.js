#!/usr/bin/env node
'use strict';

/* Non-destructive legacy chat migration. Default: DRY RUN.
 * Production writes require --apply. Ambiguous identity/student mappings are
 * reported and never guessed from display names. */
const fs = require('node:fs');
const {createHash} = require('node:crypto');

const clean = value => String(value || '').trim().toLowerCase();
const safeKey = value => clean(value).replace(/[.#$\[\]\/\s]+/g, '_');
const stableStudentKey = value => String(value || '').trim().replace(/[.#$\[\]\/]/g, '');
const normalizeRole = value => clean(value).replace(/[\s-]+/g, '_');
const rolesOf = profile => {
  const raw = profile?.roles || profile?.akses || profile?.role || [];
  if (Array.isArray(raw)) return raw.map(normalizeRole).filter(Boolean);
  if (raw && typeof raw === 'object') return Object.entries(raw).filter(([,on])=>on===true).map(([role])=>normalizeRole(role));
  return [normalizeRole(raw)].filter(Boolean);
};
const roomIdFor = (waliUid, staffUid, studentKey) => `wali_${createHash('sha256').update(['wali',waliUid,staffUid,studentKey].join('|')).digest('hex').slice(0,32)}`;
const mergeWithoutOverwrite = (planned, current) => {
  if (!current || typeof current !== 'object' || Array.isArray(current)) return current ?? planned;
  const out = {...planned};
  Object.entries(current).forEach(([key,value]) => {
    out[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? mergeWithoutOverwrite(planned?.[key] || {}, value)
      : value;
  });
  return out;
};

function identityIndex(users = {}) {
  const out = new Map();
  Object.entries(users).forEach(([uid, profile]) => {
    [profile?.username, profile?.email, profile?.authUid ? null : profile?.uid].filter(Boolean).forEach(raw => {
      const key = clean(String(raw).split('@')[0]);
      if (!key) return;
      const list = out.get(key) || [];
      list.push({uid:profile.authUid || profile.uid || uid, profile});
      out.set(key, list);
    });
  });
  return out;
}

function participantUsernames(meta = {}, messages = {}) {
  const names = new Set();
  Object.values(meta.participants || {}).forEach(person => {
    if (person?.username) names.add(clean(person.username));
  });
  Object.values(messages || {}).forEach(message => {
    if (message?.senderUsername) names.add(clean(message.senderUsername));
    if (message?.recipientUsername) names.add(clean(message.recipientUsername));
  });
  return [...names].filter(Boolean);
}

function resolveLegacyRoom(roomId, meta = {}, messages = {}, users = {}, waliAccess = {}) {
  const index = identityIndex(users);
  const usernames = participantUsernames(meta, messages);
  const resolved = [];
  const missing = [];
  const ambiguous = [];
  usernames.forEach(username => {
    const matches = index.get(username) || [];
    if (matches.length === 1) resolved.push({...matches[0], username});
    else if (matches.length > 1) ambiguous.push(username);
    else missing.push(username);
  });
  if (ambiguous.length || missing.length || resolved.length !== 2) {
    return {ok:false, roomId, reason:ambiguous.length?'AMBIGUOUS_UID':'UID_NOT_FOUND', ambiguous, missing, usernames};
  }
  const wali = resolved.find(item => waliAccess[item.uid]?.active === true);
  const staff = resolved.find(item => item.uid !== wali?.uid && rolesOf(item.profile).some(role => ['direktur','supervisor'].includes(role)));
  if (!wali || !staff) return {ok:false, roomId, reason:'PAIR_NOT_WALI_DIRECTOR_SUPERVISOR', usernames};
  const explicitKey = stableStudentKey(meta.studentKey || meta.wali?.studentKey || meta.wali?.santriId || '');
  const activeKeys = Object.entries(waliAccess[wali.uid]?.students || {}).filter(([,v])=>v===true||v?.active===true).map(([key,v])=>stableStudentKey(v?.studentKey||key));
  const studentKey = explicitKey || (activeKeys.length === 1 ? activeKeys[0] : '');
  if (!studentKey || !activeKeys.includes(studentKey)) return {ok:false, roomId, reason:studentKey?'STUDENT_NOT_AUTHORIZED':'STUDENT_KEY_REQUIRED', activeKeys};
  const mappedMessages = {};
  for (const [messageId, message] of Object.entries(messages || {})) {
    const sender = resolved.find(item => clean(item.username) === clean(message?.senderUsername));
    if (!sender) return {ok:false, roomId, reason:'MESSAGE_SENDER_UID_UNRESOLVED', messageId};
    mappedMessages[messageId] = {
      text:String(message.teks || message.text || '').trim(),
      senderUid:sender.uid,
      senderDisplay:String(message.senderDisplay || message.pengirim || sender.profile?.label || sender.username),
      createdAt:Number(message.createdAt || Date.parse(message.waktu || '')) || Date.now(),
      legacy:{roomId, messageId}
    };
  }
  return {ok:true, legacyRoomId:roomId, roomId:roomIdFor(wali.uid, staff.uid, studentKey), wali, staff, studentKey, messages:mappedMessages};
}

function planMigration(data = {}) {
  const rooms = data.pesan_global || {};
  const meta = data.pesan_meta || {};
  const users = data.users || {};
  const waliAccess = data.waliAccess || {};
  const mapped = [], needsManualReview = [];
  Object.entries(rooms).forEach(([roomId, messages]) => {
    if (roomId.startsWith('room_broadcast_')) return;
    const result = resolveLegacyRoom(roomId, meta[roomId] || {}, messages || {}, users, waliAccess);
    (result.ok ? mapped : needsManualReview).push(result);
  });
  return {
    totalRooms:Object.keys(rooms).filter(id=>!id.startsWith('room_broadcast_')).length,
    mapped,
    needsManualReview,
    roomsWithoutUid:needsManualReview.filter(item=>item.reason==='UID_NOT_FOUND').length,
    ambiguousRooms:needsManualReview.filter(item=>item.reason==='AMBIGUOUS_UID').length,
    roomsWithValidStudentKey:mapped.length,
    roomsWithoutStudentKey:needsManualReview.filter(item=>/STUDENT/.test(item.reason)).length,
    messagesCopied:mapped.reduce((sum,item)=>sum+Object.keys(item.messages).length,0),
    messagesUnchanged:Object.values(rooms).reduce((sum,value)=>sum+Object.keys(value||{}).length,0)
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const fixtureAt = process.argv.indexOf('--fixture');
  let data, db;
  if (fixtureAt >= 0) {
    data = JSON.parse(fs.readFileSync(process.argv[fixtureAt + 1], 'utf8'));
  } else {
    const {initializeApp, applicationDefault} = require('firebase-admin/app');
    const {getDatabase} = require('firebase-admin/database');
    initializeApp({credential:applicationDefault(), databaseURL:process.env.FIREBASE_DATABASE_URL || 'https://absensi-santri-fajrul-islam-default-rtdb.asia-southeast1.firebasedatabase.app'});
    db = getDatabase();
    const [globalSnap, metaSnap, usersSnap, waliSnap, inboxSnap, readSnap] = await Promise.all([
      db.ref('/cahaya_app/pesan_global').get(), db.ref('/cahaya_app/pesan_meta').get(),
      db.ref('/cahaya_access/users').get(), db.ref('/cahaya_access/wali').get(),
      db.ref('/cahaya_app/pesan_inbox').get(), db.ref('/cahaya_app/pesan_dibaca').get()
    ]);
    data = {pesan_global:globalSnap.val()||{}, pesan_meta:metaSnap.val()||{}, users:usersSnap.val()||{}, waliAccess:waliSnap.val()||{}, pesan_inbox:inboxSnap.val()||{}, pesan_dibaca:readSnap.val()||{}};
  }
  const plan = planMigration(data);
  const updates = {};
  plan.mapped.forEach(item => {
    const child = data.waliAccess[item.wali.uid].students[item.studentKey] || {};
    const now = new Date().toISOString();
    const values = Object.entries(item.messages).sort(([,a],[,b])=>a.createdAt-b.createdAt);
    const latestEntry = values[values.length-1];
    const lastMessage = latestEntry ? {id:latestEntry[0],text:latestEntry[1].text,senderUid:latestEntry[1].senderUid,senderDisplay:latestEntry[1].senderDisplay,createdAt:latestEntry[1].createdAt} : null;
    const receipts = {};
    const peers = [[item.wali,item.staff],[item.staff,item.wali]];
    peers.forEach(([owner,peer]) => {
      const legacyRead = data.pesan_dibaca?.[safeKey(owner.username)]?.[item.legacyRoomId];
      const readValue = legacyRead?.waktu || legacyRead || '';
      const lastReadAt = Number(readValue) || Date.parse(readValue) || 0;
      updates[`/cahaya_chat_v2/user_rooms/${owner.uid}/${item.roomId}`] = {
        roomId:item.roomId,studentKey:item.studentKey,studentName:String(child.namaSantri||child.namaAnak||child.label||'Santri'),
        peerUid:peer.uid,peerLabel:String(peer.profile.label||peer.username),peerUsername:peer.username,peerRoles:rolesOf(peer.profile),
        updatedAt:latestEntry?new Date(latestEntry[1].createdAt).toISOString():now,lastMessage,...(lastReadAt?{lastReadAt}:{})
      };
      if (lastReadAt) receipts[owner.uid] = {lastReadAt};
    });
    updates[`/cahaya_chat_v2/rooms/${item.roomId}`] = {
      id:item.roomId,type:'wali_staff',studentKey:item.studentKey,studentName:String(child.namaSantri||child.namaAnak||child.label||'Santri'),
      members:{
        [item.wali.uid]:{active:true,kind:'wali',label:String(item.wali.profile.label||item.wali.username),username:item.wali.username},
        [item.staff.uid]:{active:true,kind:'internal',label:String(item.staff.profile.label||item.staff.username),username:item.staff.username,roles:rolesOf(item.staff.profile)}
      },
      messages:item.messages,lastMessage,receipts,legacyRoomId:item.legacyRoomId,createdAt:now,updatedAt:latestEntry?new Date(latestEntry[1].createdAt).toISOString():now
    };
  });
  if (apply) {
    if (!db) throw new Error('--apply tidak dapat digunakan bersama --fixture');
    for (const [path, plannedValue] of Object.entries(updates)) {
      await db.ref(path).transaction(current => mergeWithoutOverwrite(plannedValue, current), undefined, false);
    }
  }
  console.log(JSON.stringify({mode:apply?'APPLY':'DRY_RUN', totalRooms:plan.totalRooms, mappedRooms:plan.mapped.length,
    roomsWithoutUid:plan.roomsWithoutUid, ambiguousRooms:plan.ambiguousRooms, roomsWithValidStudentKey:plan.roomsWithValidStudentKey,
    roomsWithoutStudentKey:plan.roomsWithoutStudentKey, changesPlanned:Object.keys(updates).length,
    messagesCopied:plan.messagesCopied, messagesUnchanged:plan.messagesUnchanged,
    needsManualReview:plan.needsManualReview}, null, 2));
}

module.exports = {identityIndex, participantUsernames, resolveLegacyRoom, planMigration, roomIdFor, mergeWithoutOverwrite};
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
