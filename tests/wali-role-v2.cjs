'use strict';
// Sanitized real profile linkage read from users/akbar308 on 2026-09-17.
// All authentication / Firestore operations below are mocked. No live sign-in.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const legacy={username:'akbar308',akses:['wali'],namaAnak:'AKBAR PRAYOGA'};
const canonical={...legacy,roleSystemVersion:2,roles:['WALI_SANTRI'],defaultRole:'WALI_SANTRI',assignments:{WALI_SANTRI:{}}};
const coreSource=fs.readFileSync('wali/dashboard/script.js','utf8');
const rolesSource=fs.readFileSync('js/role-system-v2.js','utf8');
function create(profile) {
  const map=new Map([['cahayaCurrentUser',JSON.stringify(profile)],
    ['cahayaWaliAccount',JSON.stringify({username:'previous',akses:['wali'],namaAnak:'UNRELATED CHILD'})],
    ['cahayaWaliStudentProfile',JSON.stringify({waliUsername:'previous',namaAnak:'UNRELATED CHILD'})]]);
  const reads=[];
  const context={console,localStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},addEventListener(){},dispatchEvent(){},CustomEvent:class{},setTimeout,clearTimeout};
  context.window=context; context.parent=context;
  vm.createContext(context);vm.runInContext(coreSource,context);vm.runInContext(rolesSource,context);
  const firestore={collection:collection=>({doc:id=>({get:async()=>{reads.push(`${collection}/${id}`);return {exists:true,data:()=>({...profile})}}})})};
  return {context,firestore,reads,map};
}
(async()=>{
  let previous;
  for (const profile of [legacy,canonical]) {
    const before=JSON.stringify(profile),{context,firestore,reads}=create(profile);
    const portal=await context.CahayaWaliSession.ready({firestore});
    assert(portal.valid);
    assert.equal(portal.account.username,'akbar308');
    assert.equal(portal.student.namaAnak,'AKBAR PRAYOGA');
    assert.equal(portal.student.waliUsername,'akbar308');
    assert.deepEqual(reads,['users/akbar308']);
    assert.equal(JSON.stringify(profile),before,'no mutation of production-shaped input');
    assert(!Object.hasOwn(portal.account,'studentIds'));
    const R=context.CahayaRoleSystemV2,session=R.resolveSession(profile);
    assert.equal(session.activeAssignment.namaAnak,'AKBAR PRAYOGA');
    assert.equal(session.assignmentErrors.WALI_SANTRI.length,0);
    const records=[{namaSantri:'AKBAR PRAYOGA',nilai:85},{namaSantri:'UNRELATED CHILD',nilai:99}];
    const visible=records.filter(r=>context.CahayaWaliSession.namesMatch(r.namaSantri,portal.student.namaAnak));
    assert.deepEqual(visible,[records[0]]);
    if (profile.roleSystemVersion===2) {
      assert(R.authorize(session,'student.read',records[0]));
      assert(!R.authorize(session,'student.read',records[1]));
      assert(!R.authorize(session,'student.read',{}));
      assert.equal(portal.student.namaAnak,previous,'same child after additive canonical fields');
      let calls=0;const original=context.CahayaWaliSession.namesMatch;
      context.CahayaWaliSession.namesMatch=(a,b)=>{calls++;return original(a,b)};
      R.authorize(session,'student.read',records[0]); assert.equal(calls,1,'reuse existing portal matcher');
    }
    previous=portal.student.namaAnak;
  }
  const {context}=create(canonical),R=context.CahayaRoleSystemV2;
  const poisoned={...canonical,assignments:{WALI_SANTRI:{namaAnak:'UNRELATED CHILD',studentIds:['other']}}};
  assert.equal(R.resolveSession(poisoned).activeAssignment.namaAnak,canonical.namaAnak);
  assert.equal(R.resolveSession({...canonical,namaAnak:''}).assignmentErrors.WALI_SANTRI[0],'EXISTING_CHILD_LINK_REQUIRED');
  console.log('PASS existing users/akbar308 -> namaAnak -> same portal child; unrelated child denied; stale previous-account child ignored; no studentIds remapping; original matcher reused; zero writes.');
})().catch(error=>{console.error(error);process.exitCode=1});
