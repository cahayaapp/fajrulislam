// Readiness diagnostic, NOT a migration or a claim that production is secure.
// Isolated browser: external traffic blocked, Firebase reads instrumented,
// Firebase writes forbidden. Exits nonzero while the activation gate fails.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const R = require('../js/role-system-v2.js');
const N = require('../js/role-navigation-v2.js');
const plan = require('../tools/role-v2-confirmed-plan.json');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    res.setHeader('Content-Type', {'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch {res.writeHead(404).end();}
});
(async function () {
  for (const item of plan.profiles) {
    assert.deepEqual(Object.keys(item.patch).sort(), ['assignments','defaultRole','roleSystemVersion','roles']);
    const session = R.resolveSession({...item.patch,username:item.documentId});
    assert.equal(session.activeRole,item.patch.defaultRole);
    assert(Object.values(session.assignmentErrors).every(errors=>!errors.length));
    assert.equal(session.unresolved.length,0);
  }
  const naqib = R.resolveSession(plan.profiles.find(p=>p.documentId==='favian').patch);
  const featureDecision = N.decision(naqib,'menu-absen-asrama','naqib/absensi.html','naqib/absensi.html');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try {
    const context = await browser.newContext({serviceWorkers:'block'});
    await context.route('**/*',route=>route.request().url().startsWith(origin) ? route.continue() : route.fulfill({body:'',contentType:'text/javascript'}));
    await context.addInitScript(() => {
      const profile = {username:'fixture',roleSystemVersion:2,roles:['GURU_PONDOK'],defaultRole:'GURU_PONDOK',assignments:{GURU_PONDOK:{programDomain:'KEPONDOKAN'}},akses:['guru']};
      localStorage.setItem('cahayaCurrentUser',JSON.stringify(profile));
      window.__reads=[]; window.__writes=[];
      const denyWrite=()=>{window.__writes.push('ATTEMPT');throw new Error('Mock forbids all writes')};
      const db = {collection:p=>({get:async()=>{window.__reads.push('FS:'+p);return {forEach(){},docs:[]}},doc:()=>({set:denyWrite,update:denyWrite,delete:denyWrite})})};
      window.firebase={apps:[{}],app:()=>({}),initializeApp:()=>({}),firestore:()=>db,auth:()=>({currentUser:{uid:'fixture'},onAuthStateChanged:fn=>fn({uid:'fixture'})})};
    });
    const page = await context.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/admin/users.html');
    await page.waitForLoadState('load');
    const direct = await page.evaluate(()=>({url:location.pathname,reads:window.__reads,writes:window.__writes}));
    assert.deepEqual(direct.writes,[]);
    assert.deepEqual(direct.reads,[],'denied route must initiate ZERO reads');
    assert.equal(await page.locator('#roleAccessDenied').count(),1);
    const payloadReadiness=plan.profiles.map(item=>{
      return {account:item.documentId,roles:item.patch.roles.map(role=>{
        const s=R.switchRole(R.resolveSession({...item.patch,username:item.documentId}),role).session;
        const reachable=[],pending=[];
        for(const [url,entry] of Object.entries(N.routes)){
          if(!entry.menus.some(m=>R.can(role,m,s.activeAssignment)))continue;
          const target=entry.policy==='division'?url+'?division=pendidikan':url;
          const d=N.canAccessRoute(s,target);
          if(d.ok)reachable.push({url:target,reason:d.reason});
          else if(['ASSIGNMENT_ADAPTER_REQUIRED','INCOMPLETE_ASSIGNMENT'].includes(d.reason))pending.push({url:target,reason:d.reason});
        }
        return {role,assignment:s.activeAssignment,reachable,pending};
      })};
    });
    const ready = featureDecision.ok && payloadReadiness.every(p=>p.roles.every(r=>r.pending.length===0));
    console.log(JSON.stringify({
      confirmedPayloadsValid:plan.profiles.length,
      directURL:{role:'GURU_PONDOK',attempted:'admin/users.html',...direct,errors},
      naqibAttendanceRoute:featureDecision,
      payloadReadiness,
      productionActivationReady:ready,
      actualProductionWrites:0
    },null,2));
    if (!ready) process.exitCode=2;
    await context.close();
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
