const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const R=require('../js/role-system-v2.js');
const N=require('../js/role-navigation-v2.js');
const profile={
  uid:'uid-dandi',username:'dandi',nama:'Dandi',roleSystemVersion:2,
  roles:['NAQIB','MENTOR_USRAH'], defaultRole:'MENTOR_USRAH',
  assignments:{NAQIB:{unit:'PUTRA'},MENTOR_USRAH:{usrahIds:['USRAH_3']}}
};
const store=new Map([['cahayaRoleUserV2','uid-dandi'],['cahayaActiveRoleV2','NAQIB']]);
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};

test('Multi-role Naqib selection resolves the Naqib home and rejects mentor home',()=>{
  const session=R.resolveSession(profile,storage);
  assert.equal(session.activeRole,'NAQIB');
  assert.equal(R.homeFor(session.activeRole,session.activeAssignment).split('?')[0],'home-naqib.html');
  assert.equal(N.canAccessRoute(session,R.homeFor(session.activeRole,session.activeAssignment)).ok,true);
  assert.equal(N.canAccessRoute(session,'home-mentor-usrah.html').reason,'ROLE_HOME_MISMATCH');
  const switched=R.switchRole(session,'MENTOR_USRAH',storage);
  assert(switched.ok);
  assert.equal(N.canAccessRoute(switched.session,'home-naqib.html').reason,'ROLE_HOME_MISMATCH');
  assert.equal(N.canAccessRoute(switched.session,'home-mentor-usrah.html').ok,true);
});

test('Shell and Naqib Home use matching role modules with fresh query versions',()=>{
  const main=fs.readFileSync(path.join(dir,'main-dashboard.html'),'utf8');
  const naqib=fs.readFileSync(path.join(dir,'home-naqib.html'),'utf8');
  const regex=/js\/(role-(?:system|route-registry|navigation|scope|entry)-v2\.js)\?v=([^"\s]+)/g;
  const mainScripts=Object.fromEntries([...main.matchAll(regex)].map(m=>[m[1],m[2]]));
  const naqibScripts=Object.fromEntries([...naqib.matchAll(regex)].map(m=>[m[1],m[2]]));
  assert.equal(Object.keys(mainScripts).length,5);
  assert.deepEqual(mainScripts,naqibScripts);
  assert(Object.values(mainScripts).every(v=>v.includes('20261031-role-fix-r1')));
  assert(main.indexOf('if (authUser?.uid) data.uid = authUser.uid;')<main.indexOf('const incomingV2 = roleSystemV2?.resolveSession(data,localStorage);'));
  assert(main.includes("localStorage.setItem('cahayaRoleUserV2', roleV2Session.userKey)"));
  assert(main.includes('requestSerial !== roleUIRefreshSerial'));
});

test('Service worker refreshes security-sensitive JS instead of serving stale code',()=>{
  const sw=fs.readFileSync(path.join(dir,'firebase-messaging-sw.js'),'utf8');
  const main=fs.readFileSync(path.join(dir,'main-dashboard.html'),'utf8');
  const index=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  assert(sw.includes("const STATIC_CACHE='cahaya-static-v169'"));
  assert(sw.includes('if(roleRuntime){event.respondWith(networkFirst(req));return;}'));
  assert(main.includes('firebase-messaging-sw.js?v=169'));
  assert(index.includes('firebase-messaging-sw.js?v=169'));
});

test('Production and docs mirrors are identical',()=>{
  for(const n of ['main-dashboard.html','home-naqib.html','index.html','firebase-messaging-sw.js']){
    assert.equal(fs.readFileSync(path.join(dir,n),'utf8'),fs.readFileSync(path.join(dir,'docs',n),'utf8'),n);
  }
});
