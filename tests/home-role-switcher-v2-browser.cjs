const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const firebaseApp = `export const initializeApp=()=>({}),getApps=()=>[],getApp=()=>({});`;
const firebaseDb = `export const getDatabase=()=>({}),ref=(db,p)=>({p}),get=async()=>({val:()=>null}),set=async()=>{},update=async()=>{},query=(r)=>r,orderByChild=()=>({}),equalTo=()=>({}),startAt=()=>({}),endAt=()=>({});`;

const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream';
    res.setHeader('Content-Type', type);
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404).end(); }
});

const profile = {
  uid:'switch-fixture', username:'switch-fixture', nama:'Muhammad Zaky', roleSystemVersion:2,
  roles:['MANAJER','GURU_PONDOK','MENTOR_USRAH'], defaultRole:'MANAJER',
  assignments:{
    MANAJER:{area:'PENDIDIKAN',unit:'PUTRA',managedRoles:['GURU_PONDOK'],programDomain:'KEPONDOKAN'},
    GURU_PONDOK:{programDomain:'KEPONDOKAN'}, MENTOR_USRAH:{usrahIds:['USRAH_3']}
  }
};

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try {
    const context = await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});
    await context.addInitScript(user => {
      if (window === window.top && !sessionStorage.getItem('switch-init')) {
        localStorage.clear(); localStorage.setItem('cahayaCurrentUser',JSON.stringify(user));
        sessionStorage.setItem('switch-init','1');
      }
      const db = {ref:p=>({once:async()=>({val:()=>null,exists:()=>false}),on(){},off(){},set(){throw Error('write blocked')},update(){throw Error('write blocked')}})};
      const auth = {currentUser:{uid:'switch-fixture'},onAuthStateChanged:fn=>{setTimeout(()=>fn(auth.currentUser),10);return()=>{}},signOut:async()=>{}};
      window.firebase={apps:[{}],initializeApp(){return{}},auth:()=>auth,database:()=>db,firestore:()=>({collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>user})})})})};
    }, profile);
    await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin))return route.continue();return route.fulfill({contentType:'text/javascript',body:url.includes('firebase-app.js')?firebaseApp:url.includes('firebase-database.js')?firebaseDb:''})});
    const page = await context.newPage(), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/main-dashboard.html');
    await page.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('home-manajer-pendidikan'));
    let home=page.locator('#contentFrame').contentFrame();
    await home.locator('[data-cahaya-home-role]').waitFor();
    assert.match(await home.locator('[data-cahaya-home-role]').innerText(),/Manajer Pendidikan.*▾/);
    assert.equal(await home.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
    await home.locator('[data-cahaya-home-role]').click();
    assert.deepEqual(await page.locator('.cahaya-global-role-option b').allInnerTexts(),['Manajer Pendidikan','Guru Pondok','Mentor Usrah']);
    assert.equal(await page.locator('.cahaya-global-role-option[aria-pressed="true"]').count(),1);
    for(const width of [409,456,1440]){
      await page.setViewportSize({width,height:720});
      await page.screenshot({path:`/tmp/cahaya-ui-v2/role-picker-${width}.png`});
      const box=await page.locator('.cahaya-global-role-dialog').boundingBox();
      assert(box.x>=0&&box.x+box.width<=width&&box.y>=0&&box.y+box.height<=720);
    }
    await page.setViewportSize({width:409,height:720});
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#cahayaGlobalRoleOverlay.show').count(),0);
    await home.locator('[data-cahaya-home-role]').click();
    await page.locator('.cahaya-global-role-option').filter({hasText:'Mentor Usrah'}).click();
    await page.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('home-mentor-usrah'));
    home=page.locator('#contentFrame').contentFrame();
    await home.locator('[data-cahaya-home-role]').waitFor();
    assert.equal(await home.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
    assert.equal(await page.evaluate(()=>cahayaRoleV2Session.activeAssignment.usrahIds[0]),'USRAH_3');
    assert.equal(await page.locator('iframe.cahaya-page-frame').count(),1);
    await home.locator('[data-cahaya-home-role]').click();
    await page.locator('.cahaya-global-role-option').filter({hasText:'Guru Pondok'}).click();
    await page.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('home-guru'));
    assert.equal(await page.evaluate(()=>cahayaRoleV2Session.activeRole),'GURU_PONDOK');
    assert.equal(await page.locator('iframe.cahaya-page-frame').count(),1);
    await page.locator('#contentFrame').contentFrame().locator('.hero-role').click();
    await page.locator('.cahaya-global-role-option').filter({hasText:'Manajer Pendidikan'}).click();
    await page.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('home-manajer-pendidikan'));
    assert.equal(await page.evaluate(()=>cahayaRoleV2Session.activeAssignment.area),'PENDIDIKAN');
    assert.equal(await page.locator('iframe.cahaya-page-frame').count(),1);
    await page.locator('#mobileBottomNav [data-menu-id="global-kpi"]').click();
    await page.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('view=kpi'));
    assert.equal(await page.locator('#contentFrame').contentFrame().locator('#roleAccessDenied').count(),0);
    await page.locator('#mobileBottomNav [data-menu-id="menu-home"]').click();
    await page.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('home-manajer-pendidikan'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    // The shell also loads Firebase's CDN URL as a classic script; our ESM
    // fixture is only valid for the KPI module import, so ignore that fixture error.
    assert.deepEqual(errors.filter(message=>message!=="Unexpected token 'export'"),[]);
    await context.close();

    const single=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});
    await single.addInitScript(user=>{
      localStorage.setItem('cahayaCurrentUser',JSON.stringify(user));
      window.firebase={apps:[{}],initializeApp(){return{}},auth:()=>({currentUser:{uid:'single'},onAuthStateChanged:fn=>{setTimeout(()=>fn({uid:'single'}),10);return()=>{}},signOut:async()=>{}}),database:()=>({ref:()=>({once:async()=>({val:()=>null,exists:()=>false})})}),firestore:()=>({collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>user})})})})};
    },{...profile,uid:'single',username:'single',roles:['MANAJER'],defaultRole:'MANAJER'});
    await single.route('**/*',route=>{const url=route.request().url();if(url.startsWith(origin))return route.continue();return route.fulfill({contentType:'text/javascript',body:url.includes('firebase-app.js')?firebaseApp:url.includes('firebase-database.js')?firebaseDb:''})});
    const one=await single.newPage();
    await one.goto(origin+'/main-dashboard.html');
    await one.waitForFunction(()=>document.getElementById('contentFrame')?.src.includes('home-manajer-pendidikan'));
    const chip=one.locator('#contentFrame').contentFrame().locator('[data-cahaya-home-role]');
    await chip.waitFor();
    assert.equal(await chip.isDisabled(),true);
    assert.equal(await chip.innerText(),'Manajer Pendidikan');
    await single.close();
    console.log('home-role-switcher-v2-browser: ok');
  } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
