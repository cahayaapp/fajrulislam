// Production-shaped existing Wali linkage; authentication/database are fixtures.
// Never logs into the actual parent's account or sends data to Firebase.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try{
    for(const canonical of [false,true]){
      const context=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'});
      await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.fulfill({body:'',contentType:'text/javascript'}));
      await context.addInitScript(({canonical})=>{
        window.__reads=[];window.__writes=[];window.__queries=[];
        const profile={username:'akbar308',akses:['wali'],namaAnak:'AKBAR PRAYOGA',...(canonical?{roleSystemVersion:2,roles:['WALI_SANTRI'],defaultRole:'WALI_SANTRI',assignments:{WALI_SANTRI:{}}}:{})};
        window.__profile=profile;
        const write=()=>{window.__writes.push('blocked');throw Error('Fixture forbids all writes')};
        const snapshot=value=>({val:()=>value,exists:()=>!!value,forEach:fn=>Object.entries(value||{}).forEach(([key,v])=>fn({...snapshot(v),key}))});
        const ref=p=>{
          const bulan=new Intl.DateTimeFormat('id-ID',{month:'long'}).format(new Date()),timestamp=new Date().toISOString();
          const exams={own:{nama_santri:'AKBAR PRAYOGA',mata_pelajaran:'OWN CHILD FIXTURE',materi_ujian:'OWN MATERIAL',nilai_total:85,bulan,timestamp},other:{nama_santri:'UNRELATED CHILD',mata_pelajaran:'FORBIDDEN OTHER FIXTURE',materi_ujian:'DO NOT SHOW',nilai_total:99,bulan,timestamp}};
          const dateParts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
          const day=`${dateParts.year}-${dateParts.month}-${dateParts.day}`;
          const mentoring={own:{namaSantri:'AKBAR PRAYOGA',tanggal:day,usrah:'Usrah 1',mentor:'Mentor fixture',targetBaru:'TARGET ANANDA',syukurPekan:'SYUKUR ANANDA',strongWhy:'WHY ANANDA',strategi:'STRATEGI ANANDA',catatanMentor:'PRIVATE MENTOR NOTE',fokusTipe:'PERBAIKI',cahayaKlarifikasi:{answers:{sp1:3},dimensions:{spiritual:{note:'Catatan klarifikasi ananda'}}},hasilTarget:{status:'TERCAPAI',keterangan:'HASIL ANANDA'}},other:{namaSantri:'UNRELATED CHILD',tanggal:day,targetBaru:'SECRET OTHER MENTORING'}};
          const program={own:{tanggal:day,program:'Halaqah Pagi',data:[{nama:'AKBAR PRAYOGA',status:'H'}]}};
          const cases={own:{santri:'AKBAR PRAYOGA',tanggalKejadian:day,sumberCaseId:'case-own',status:'SELESAI',deskripsiAwal:'UJI KASUS',kategoriAkhir:'Bimbingan',konselorPenindak:'Konselor Fixture'}};
          const fixture=p==='cahaya_app/log_mentoring_naqib'?mentoring:p==='cahaya_app/wali_index/akbarprayoga/nilai_bulanan'?exams:p==='cahaya_app/wali_index/akbarprayoga/program'?program:p==='cahaya_app/wali_index/akbarprayoga/kasus_konselor'?cases:null;
          const snap=snapshot(fixture),params={},q={once:async()=>{window.__reads.push('RTDB:'+p);window.__queries.push({path:p,...params});if(p==='cahaya_app/log_mentoring_naqib'&&localStorage.getItem('testMentoringDenied'))throw Error('PERMISSION_DENIED fixture');return snap},get:async()=>snap,on:(event,fn)=>{window.__reads.push('LISTEN:'+p);fn?.(snap)},off(){},set:write,update:write,push:write,child:k=>ref(p+'/'+k)};
          for(const k of ['orderByChild','equalTo','startAt','endAt','limitToLast','limitToFirst'])q[k]=value=>{params[k]=value;return q};
          return q;
        };
        const auth={currentUser:{uid:'mock-akbar308',email:'akbar308@cahayaapp.id'},signInWithEmailAndPassword:async()=>({user:auth.currentUser}),onAuthStateChanged:fn=>{queueMicrotask(()=>fn(auth.currentUser));return ()=>{}},signOut:async()=>{}};
        const firestore={collection:p=>({doc:id=>({get:async()=>{window.__reads.push('FS:'+p+'/'+id);return {exists:p==='users'||p==='settings',data:()=>p==='users'?profile:{wali:['menu-beranda-wali','menu-akademik-wali','menu-karakter-wali','menu-pembinaan-wali','menu-informasi-penting-wali']}}},set:write,update:write}),get:async()=>({docs:[],forEach(){}})})};
        window.firebase={apps:[{}],initializeApp(){},auth:()=>auth,firestore:()=>firestore,database:()=>({ref}),messaging:()=>({onMessage(){},getToken:async()=>null})};
        window.firebase.messaging.isSupported=()=>false;
      },{canonical});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/index.html?mode=login');
      await page.locator('#username').fill('akbar308');
      await page.locator('#password').fill('fixture-password-not-production');
      await page.locator('#btnSubmit').click();
      await page.waitForURL('**/wali/dashboard/index.html?*');
      await page.waitForFunction(()=>document.getElementById('studentNameLabel')?.textContent==='AKBAR PRAYOGA');
      assert.equal(await page.evaluate(()=>localStorage.getItem('cahayaWaliStudentProfile')&&JSON.parse(localStorage.getItem('cahayaWaliStudentProfile')).namaAnak),'AKBAR PRAYOGA');
      assert.equal(await page.locator('#mobileBottomNav').count(),0,'no staff navigation nested in Wali portal');
      const before=await page.evaluate(()=>({reads:window.__reads,writes:window.__writes}));
      assert.deepEqual(before.writes,[]);
      const home=page.locator('#contentFrame').contentFrame();
      await home.locator('#mobileRoleHome').waitFor();
      assert.equal(await home.locator('.mh-quick-grid [data-mh-id="utility-kabar"]').count(),1);
      assert.equal(await home.locator('.mh-quick-grid [data-mh-id="menu-mentoring-wali"]').count(),1);
      assert(!await home.locator('#mobileRoleHome').innerText().then(t=>t.includes('RUANG KERJA')));
      await home.locator('[data-mh-id="utility-kabar"]').first().click();
      await home.locator('#waliKabarLayer.open').waitFor({state:'visible'});
      await home.locator('#waliKabarLayer .wm-layer-close').click();
      assert.equal(await page.locator('#waliInformationMenus .nav-item:not([hidden])').count(),6);
      assert.equal(await page.locator('#menu-informasi-penting-wali').count(),0);
      for(const width of [409,456,550,1024,1440]){
        await page.setViewportSize({width,height:720});await page.waitForTimeout(120);
        await page.screenshot({path:`/tmp/cahaya-home-WALI-${canonical?'canonical':'legacy'}-${width}.png`});
        const geometry=await home.locator('#mobileRoleHome').evaluate(el=>{const box=s=>{const r=el.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};return {width:innerWidth,height:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,header:box('.mh-header'),hero:box('.mh-hero'),masthead:box('.mh-masthead'),date:box('.mh-date'),nameColor:getComputedStyle(el.querySelector('h1')).color,cards:[...el.querySelectorAll('.mh-quick-grid .mh-card,.mh-menu-grid .mh-card')].map(e=>({y:e.getBoundingClientRect().top,b:e.getBoundingClientRect().bottom})),banner:el.getBoundingClientRect().bottom}});
        if(process.env.CAHAYA_HOME_DEBUG)console.log(await home.locator('.mh-masthead').evaluate(el=>{const matches=[];function rules(list,href){for(const rule of list){if(rule.selectorText&&el.matches(rule.selectorText)&&rule.style?.gridTemplateColumns)matches.push({href,selector:rule.selectorText,columns:rule.style.gridTemplateColumns});if(rule.cssRules)rules(rule.cssRules,href)}}for(const sheet of document.styleSheets)try{rules(sheet.cssRules,sheet.href)}catch{}return {width:innerWidth,classes:el.className,style:el.getAttribute('style'),columns:getComputedStyle(el).gridTemplateColumns,matches}}));
        assert(geometry.scrollW<=geometry.width+1&&geometry.scrollH<=geometry.height+1,'Wali no overflow '+JSON.stringify(geometry));
        assert(geometry.cards.every(c=>c.b<=geometry.banner),'Wali no card/banner overlap '+JSON.stringify(geometry));
        assert(geometry.header.bottom<=geometry.hero.top,'Wali brand must be above greeting '+JSON.stringify(geometry));
        assert.equal(geometry.nameColor,'rgb(255, 255, 255)','Wali hero name must be white');
        assert(geometry.date.top<geometry.masthead.bottom&&geometry.date.bottom>geometry.masthead.bottom,'Wali floating date');
        const frameBox=await page.locator('#contentFrame').boundingBox(),navBox=await page.locator('#waliMobileBottomNav').boundingBox();
        if(navBox)assert(frameBox.y+geometry.cards.at(-1).b<=navBox.y+1,'Wali cards must not be covered by parent bottom nav');
      }
      await page.setViewportSize({width:409,height:720});
      // One existing information section per route, without a duplicate tab hub.
      for(const section of ['kalender','pembelajaran','program','izin','barang','disiplin']){
        await page.evaluate(s=>openWaliMobileShortcut(`menu-informasi-${s}-wali`),section);
        const info=page.locator('#contentFrame').contentFrame();
        await info.locator('.nav-tabs[hidden]').waitFor({state:'attached'});
        await info.locator(`#tab-${section}.active`).waitFor();
        assert.equal(await info.locator('.tab-panel.active').count(),1);
        assert(await info.locator('.nav-tabs').isHidden(),JSON.stringify(await info.locator('.nav-tabs').evaluate(el=>({hidden:el.hidden,display:getComputedStyle(el).display,classes:document.documentElement.className,url:location.href}))));
        assert.equal(await page.evaluate(()=>menuIdFromUrl(currentPortalPage)),`menu-informasi-${section}-wali`);
      }
      await page.evaluate(()=>openWaliMobileShortcut('menu-mentoring-wali'));
      const report=page.locator('#contentFrame').contentFrame();
      await report.getByText('TARGET ANANDA',{exact:true}).waitFor();
      for(const width of [409,456]){
        await page.setViewportSize({width,height:720});await page.waitForTimeout(150);
        await report.locator('.wm-dimension summary').first().click();
        const dimensions=await report.locator('html').evaluate(el=>({w:innerWidth,scroll:el.scrollWidth,body:document.body.innerText}));
        assert(dimensions.scroll<=dimensions.w,'report no overflow');
        assert(!dimensions.body.includes('PRIVATE MENTOR NOTE')&&!dimensions.body.includes('SECRET OTHER MENTORING'));
        await page.screenshot({path:`/tmp/cahaya-wali-mentoring-${canonical}-${width}.png`});
      }
      const queries=await report.locator('body').evaluate(()=>window.__queries.filter(x=>x.path==='cahaya_app/log_mentoring_naqib'));
      assert.equal(queries.length,3);
      assert(queries.every(x=>x.equalTo==='AKBAR PRAYOGA'&&['namaSantri','santri','studentName'].includes(x.orderByChild)));
      await report.locator('#mentoringStart').fill('2001-01-01');await report.locator('#mentoringEnd').fill('2001-01-01');await report.locator('#mentoringApply').click();
      await report.getByText('Belum ada laporan mentoring pada rentang tanggal ini.',{exact:true}).waitFor();
      assert.equal(await report.locator('body').evaluate(()=>window.__queries.filter(x=>x.path==='cahaya_app/log_mentoring_naqib').length),3,'date changes reuse scoped data');
      await page.evaluate(()=>openWaliMobileShortcut('menu-pembinaan-wali'));
      const coaching=page.locator('#contentFrame').contentFrame();
      await page.waitForFunction(()=>{
        const frame=document.getElementById('contentFrame')?.contentDocument;
        return frame?.getElementById('programPercent')?.textContent==='100%' &&
          frame?.getElementById('kasusListContainer')?.textContent?.includes('UJI KASUS');
      });
      const coachingState=await coaching.locator('body').evaluate(()=>({loading:document.getElementById('loadingData')?.textContent,program:document.getElementById('programPercent')?.textContent,section:document.getElementById('secProgram')?.style.display,reads:window.__reads}));
      assert.equal(coachingState.program,'100%','Hadir dari absensi program V2 tidak boleh menjadi 0%: '+JSON.stringify(coachingState));
      const caseState=await coaching.locator('body').evaluate(()=>({text:document.getElementById('kasusListContainer')?.textContent,visible:document.getElementById('secKasus')?.style.display,loading:document.getElementById('loadingData')?.textContent,reads:window.__reads}));
      assert.match(caseState.text||'',/UJI KASUS/,'kasus Konselor selesai muncul dari indeks Wali: '+JSON.stringify(caseState));
      // Direct URL parameters cannot replace linked-child scope.
      await page.goto(origin+'/wali/dashboard/mentoring-pekanan.html?santri=UNRELATED%20CHILD');
      await page.getByText('TARGET ANANDA',{exact:true}).waitFor();
      assert.equal(await page.getByText('SECRET OTHER MENTORING',{exact:true}).count(),0);
      await page.evaluate(()=>localStorage.setItem('testMentoringDenied','1'));await page.reload();
      await page.getByText('Laporan mentoring belum dapat dimuat.',{exact:false}).waitFor();
      assert.equal(await page.locator('.wm-report-card').count(),0,'rejected read not a fake empty/success');
      await page.evaluate(()=>localStorage.removeItem('testMentoringDenied'));
      // Open existing academic page using the same normal session; no actual child history downloaded.
      await page.goto(origin+'/wali/dashboard/akademik.html');
      await page.waitForFunction(()=>document.getElementById('studentNameHeader')?.textContent==='AKBAR PRAYOGA');
      await page.waitForFunction(()=>document.getElementById('loadingData')?.style.display==='none');
      // Follow the existing mobile period chooser, not its hidden native select.
      const month=new Intl.DateTimeFormat('id-ID',{month:'long'}).format(new Date());
      await page.locator('.v63-month-btn').filter({hasText:month}).click().catch(async error=>{
        console.log('MONTH_CLICK_DIAGNOSTIC',await page.evaluate(()=>({url:location.href,body:document.body.innerText.slice(0,1800),user:localStorage.getItem('cahayaCurrentUser')})));throw error;
      });
      await page.getByText('OWN CHILD FIXTURE',{exact:true}).waitFor({state:'visible',timeout:5000}).catch(async error=>{
        console.log(await page.evaluate(()=>({reads:window.__reads,loading:document.getElementById('loadingData')?.textContent,body:document.body.innerText.slice(-3000)})));
        throw error;
      });
      assert.equal(await page.getByText('FORBIDDEN OTHER FIXTURE',{exact:true}).count(),0);
      const academicReads=await page.evaluate(()=>window.__reads);
      assert(academicReads.includes('RTDB:cahaya_app/wali_index/akbarprayoga/nilai_bulanan'));
      assert(!academicReads.some(p=>p.includes('wali_index/unrelatedchild')));
      assert.equal(await page.evaluate(()=>CahayaWaliSession.namesMatch('UNRELATED CHILD',CahayaWaliSession.getStudent().namaAnak)),false);
      assert.deepEqual(await page.evaluate(()=>window.__writes),[]);
      await page.screenshot({path:`/tmp/wali-role-v2-${canonical?'canonical':'legacy'}.png`});
      console.log(JSON.stringify({canonical,login:'existing Wali portal',child:'same production-linked child',unrelatedChild:false,writes:0,errors}));
      assert.deepEqual(errors,[]);
      if(canonical){
        await page.evaluate(()=>{localStorage.setItem('cahayaCurrentUser',JSON.stringify({username:'not-wali',roleSystemVersion:2,roles:['DIREKTUR'],defaultRole:'DIREKTUR',assignments:{DIREKTUR:{unit:'ALL'}}}));localStorage.removeItem('cahayaActiveRoleV2')});
        await page.goto(origin+'/wali/dashboard/mentoring-pekanan.html');
        await page.locator('#roleAccessDenied').waitFor();
        assert.deepEqual(await page.evaluate(()=>window.__reads),[],'unrelated role denied before operational reads');
      }
      await context.close();
    }
  } finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
