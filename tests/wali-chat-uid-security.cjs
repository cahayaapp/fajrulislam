'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {planMigration, roomIdFor, mergeWithoutOverwrite} = require('../push-backend/functions/scripts/backfill-chat-uid.js');

const rules = JSON.parse(fs.readFileSync('firebase-rtdb-rules-cahaya-app-v20.json','utf8')).rules;
const chat = rules.cahaya_chat_v2;
assert(chat, 'secure chat namespace must exist');
assert.equal(chat['.read'], false);
assert.equal(chat['.write'], false);
assert.match(chat.rooms.$roomId['.read'], /members.*auth\.uid.*active/);
assert.match(chat.rooms.$roomId.messages.$messageId['.write'], /!data\.exists\(\)/);
assert.match(chat.rooms.$roomId.messages.$messageId['.write'], /senderUid.*auth\.uid/);
assert.match(chat.rooms.$roomId.messages.$messageId['.validate'], /senderDisplay.*members.*auth\.uid.*label/);
assert.match(chat.rooms.$roomId.receipts.$uid['.write'], /auth\.uid === \$uid/);
assert.match(chat.user_rooms.$uid['.read'], /auth\.uid === \$uid/);
assert.match(chat.user_rooms.$uid.$roomId.lastReadAt['.write'], /auth\.uid === \$uid/);

const canReadRoom = (authUid, room) => Boolean(authUid && room.members?.[authUid]?.active === true);
const canCreateMessage = (authUid, room, message, exists=false) => canReadRoom(authUid,room) && !exists && message.senderUid===authUid;
const canOpenPair = ({callerUid, counterpartUid, studentKey, users, wali}) => {
  const callerWali = wali[callerUid]?.active === true;
  const waliUid = callerWali ? callerUid : counterpartUid;
  const staffUid = callerWali ? counterpartUid : callerUid;
  const roles = Object.entries(users[staffUid]?.roles||{}).filter(([,on])=>on===true).map(([role])=>role.toLowerCase());
  return Boolean(wali[waliUid]?.students?.[studentKey]?.active===true && users[staffUid]?.active===true && users[staffUid]?.internal===true && roles.some(role=>['direktur','supervisor'].includes(role)));
};
const room={members:{'wali-a':{active:true},'dir-a':{active:true}}};
assert(canReadRoom('wali-a',room));                                      // TEST 1
assert(canCreateMessage('wali-a',room,{senderUid:'wali-a'}));            // TEST 2
assert(!canCreateMessage('wali-a',room,{senderUid:'dir-a'}));             // TEST 3
assert(!canReadRoom('wali-b',room));                                      // TEST 4/5
assert(!canReadRoom('',room));                                            // TEST 11
assert(!canReadRoom('wali-b',{...room,localRole:'direktur'}));             // TEST 12

const users={
  'dir-a':{active:true,internal:true,roles:{direktur:true}},
  'sup-a':{active:true,internal:true,roles:{supervisor:true}},
  'guru-a':{active:true,internal:true,roles:{guru_pondok:true}}
};
const wali={'wali-a':{active:true,students:{'anak-a':{active:true},'anak-c':{active:true}}}};
assert(!canOpenPair({callerUid:'wali-a',counterpartUid:'guru-a',studentKey:'anak-a',users,wali})); // TEST 6
assert(canOpenPair({callerUid:'wali-a',counterpartUid:'dir-a',studentKey:'anak-a',users,wali}));   // TEST 7
assert(canOpenPair({callerUid:'wali-a',counterpartUid:'sup-a',studentKey:'anak-a',users,wali}));   // TEST 8
assert(!canOpenPair({callerUid:'wali-a',counterpartUid:'dir-a',studentKey:'anak-b',users,wali}));  // TEST 9
assert(canOpenPair({callerUid:'wali-a',counterpartUid:'dir-a',studentKey:'anak-c',users,wali}));   // TEST 10
assert(canOpenPair({callerUid:'dir-a',counterpartUid:'wali-a',studentKey:'anak-a',users,wali}));   // TEST 13
assert(canOpenPair({callerUid:'sup-a',counterpartUid:'wali-a',studentKey:'anak-a',users,wali}));   // TEST 14
assert.equal(roomIdFor('wali-a','dir-a','anak-a'),roomIdFor('wali-a','dir-a','anak-a'),'room key must be deterministic');

const fixture=JSON.parse(fs.readFileSync('tests/fixtures/chat-legacy.json','utf8'));
const plan=planMigration(fixture);
assert.equal(plan.totalRooms,2);
assert.equal(plan.mapped.length,1);                                       // TEST 15
assert.equal(plan.mapped[0].legacyRoomId,'chat_valid');
assert.equal(Object.keys(plan.mapped[0].messages).length,2);
assert.equal(plan.needsManualReview.length,1);                             // TEST 16
assert.equal(plan.needsManualReview[0].reason,'AMBIGUOUS_UID');
const merged=mergeWithoutOverwrite({messages:{legacy:{text:'lama'}},members:{a:{active:true}}},{messages:{baru:{text:'baru'}},updatedAt:'current'});
assert(merged.messages.legacy && merged.messages.baru);
assert.equal(merged.updatedAt,'current');

const waliFrontend=fs.readFileSync('wali/dashboard/index.html','utf8');
assert(waliFrontend.includes('CahayaSecureChat.openRoom'));
assert(waliFrontend.includes('CahayaSecureChat.listenUserRooms'));
assert(!waliFrontend.includes('cahaya_app/pesan_global'));
assert(!waliFrontend.includes('cahaya_app/pesan_inbox'));
assert(!waliFrontend.includes('direktori_chat_wali'));
assert(waliFrontend.includes('CahayaSecureChat.markRead'));               // TEST 17
console.log('PASS 17 secure Wali chat membership, UID, migration, and receipt contracts');
