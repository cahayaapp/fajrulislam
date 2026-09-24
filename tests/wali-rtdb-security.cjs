'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const rules = JSON.parse(fs.readFileSync('firebase-rtdb-rules-cahaya-app-v20.json', 'utf8')).rules;
assert.equal(rules['.read'], false, 'root read must be closed');
assert.equal(rules['.write'], false, 'root write must be closed');
assert.equal(rules.cahaya_access['.write'], false, 'client cannot provision access index');
assert.match(rules.cahaya_access.wali.$uid['.read'], /auth\.uid === \$uid/);
assert.match(rules.cahaya_app.wali_index.$santriKey['.read'], /auth\.uid/);
assert.match(rules.cahaya_app.wali_index.$santriKey['.read'], /students.*\$santriKey/);
assert.equal(rules.cahaya_app.wali_index.$santriKey['.write'], false);
assert(!rules.cahaya_app.nilai_ujian?.['.read'], 'Wali must not receive a direct academic collection grant');
assert(!rules.cahaya_app.nilai_ujian_bulanan?.['.read'], 'Wali must not receive a direct monthly collection grant');

const canReadWaliIndex = ({uid, active=true, mapped=[]}, studentKey) => Boolean(uid && active && mapped.includes(studentKey));
const canWriteOfficialAcademic = () => false;
const canWriteOwnMapping = () => false;
const canUseInternalGrant = ({uid, trustedInternal=false}) => Boolean(uid && trustedInternal);

assert(canReadWaliIndex({uid:'wali-a', mapped:['anak-a']}, 'anak-a'));                       // TEST 1
assert(!canReadWaliIndex({uid:'wali-a', mapped:['anak-a']}, 'anak-b'));                      // TEST 2
assert.equal(rules.cahaya_app['.read'].includes("internal').val() === true"), true);          // TEST 3
assert(!canWriteOfficialAcademic());                                                         // TEST 4
assert(!canWriteOwnMapping());                                                               // TEST 5
assert(canReadWaliIndex({uid:'wali-a', mapped:['anak-a','anak-c']}, 'anak-c'));               // TEST 6
assert(!canReadWaliIndex({uid:'wali-x', mapped:[]}, 'anak-a'));                               // TEST 7
assert(!canReadWaliIndex({uid:'', mapped:['anak-a']}, 'anak-a'));                             // TEST 8
assert(canUseInternalGrant({uid:'guru-1', trustedInternal:true}));                            // TEST 9
assert(!canUseInternalGrant({uid:'wali-a', trustedInternal:false, localRole:'DIREKTUR'}));     // TEST 10
assert(!canReadWaliIndex({uid:'wali-a', mapped:['anak-a'], clientStudentKey:'anak-b'}, 'anak-b')); // TEST 11

const source = fs.readFileSync('wali/dashboard/script.js', 'utf8');
const map = new Map([
  ['cahayaCurrentUser', JSON.stringify({username:'wali-a', roles:['WALI_SANTRI']})],
  ['cahayaWaliStudentProfile', JSON.stringify({studentKey:'anak-b', namaAnak:'ANAK B'})]
]);
const context = {
  console,
  localStorage:{getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)},
  addEventListener(){}, dispatchEvent(){}, CustomEvent:class {}, setTimeout, clearTimeout
};
context.window=context; context.parent=context;
vm.createContext(context); vm.runInContext(source, context);
const firestore={collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>({username:'wali-a',roles:['WALI_SANTRI'],roleSystemVersion:2})})})})};
const database={ref:path=>({once:async()=>({val:()=>path==='cahaya_access/wali/uid-a/students'?{'anak-a':{active:true,studentKey:'anak-a',namaSantri:'ANAK A'},'anak-c':{active:true,studentKey:'anak-c',namaSantri:'ANAK C'}}:null})})};
(async()=>{
  const portal=await context.CahayaWaliSession.ready({firestore,database,auth:{currentUser:{uid:'uid-a'}},requireAuthAccess:true});
  assert(portal.valid);                                                                       // TEST 12
  assert.equal(context.CahayaWaliSession.studentKey(),'anak-a');
  assert.equal(context.CahayaWaliSession.authorizedStudentKeys().includes('anak-b'),false);
  assert.equal(context.CahayaWaliSession.selectAuthorizedStudent('anak-b'),false);
  assert.equal(context.CahayaWaliSession.selectAuthorizedStudent('anak-c'),true);
  assert.equal(context.CahayaWaliSession.studentKey(),'anak-c');
  console.log('PASS 12 Wali RTDB security contracts and strict Auth session selection');
})().catch(error=>{console.error(error);process.exitCode=1});
