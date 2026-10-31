const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const html = fs.readFileSync(path.resolve(__dirname, '../wali/dashboard/beranda.html'), 'utf8');
const start = html.indexOf('  function lepasListenerTimeline()');
const end = html.indexOf('  /* =========================================================\n     V62', start);
assert(start > 0 && end > start);
const source = html.slice(start, end);
const naqibHtml = fs.readFileSync(path.resolve(__dirname, '../workspace/naqib-operasional.html'), 'utf8');
const commandHtml = fs.readFileSync(path.resolve(__dirname, '../supervisor/command-center.html'), 'utf8');
const academicHtml = fs.readFileSync(path.resolve(__dirname, '../supervisor/laporan-akademik.html'), 'utf8');
const moduleCode = html => html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
  .replace(/import\{[^;]+;/g, '')
  .replace(/load\(\);\s*$/, 'window.__firstLoad=load();');
async function fixturePage(browser, ids) {
  const page = await browser.newPage();
  await page.setContent(ids.map(id => `<div id="${id}"></div>`).join(''));
  return page;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="loadingData"></div><div id="timelineContainer"></div><div id="timelineDiagnostic"></div>');
    await page.addScriptTag({ content: `
      const bindings=[]; let selected='A', renderCount=0, media={};
      const dbRT={ref(path){const query={path,limitToLast(n){this.limit=n;return this},on(event,callback,error){bindings.push({query:this,path,callback,error,detached:false})},off(event,callback){const b=bindings.find(x=>x.query===this&&x.callback===callback);if(b)b.detached=true}};return query}};
      let timelineListenerSignature='',timelineListenerBindings=[],timelineIndexedSnapshots={};
      let timelineListenerGeneration=0,timelineInitialPromise=Promise.resolve(),timelineInitialResolve=null;
      let initialTimelineReady=false,timelineRefreshTimer=null,sourceWarnings=[];
      let globalDB={},currentDayOffset=0;const INITIAL_HISTORY_DAYS=7;
      const kunciIndexSantriTimeline=()=>[selected];
      const renderWaliMobileDashboard=()=>{renderCount++};
      const renderRiwayatTerlihat=()=>{renderCount++};
      const parsePengaturanMedia=value=>{media=value};
      const jadwalkanRefreshTimeline=()=>{renderCount++};
      ${source}
      window.fixture={bindings,select(key){selected=key;return pasangListenerTimeline()},fire(path,value){const b=bindings.find(x=>!x.detached&&x.path===path);if(!b)throw Error('missing '+path);b.callback({val:()=>value})},fail(path){const b=bindings.find(x=>!x.detached&&x.path===path);if(!b)throw Error('missing '+path);b.error(new Error('permission_denied'))},state(){return {ready:initialTimelineReady,data:globalDB,renderCount,warnings:sourceWarnings,loading:document.getElementById('loadingData').style.display,active:bindings.filter(x=>!x.detached).map(x=>x.path),detached:bindings.filter(x=>x.detached).map(x=>x.path)}}};
    ` });
    const childA = 'cahaya_app/wali_index/A/program';
    const childB = 'cahaya_app/wali_index/B/program';
    await page.evaluate(() => { window.firstLoad = fixture.select('A'); });
    assert.equal((await page.evaluate(() => fixture.state())).loading, 'block');
    await page.waitForTimeout(250);
    assert.equal((await page.evaluate(() => fixture.state())).loading, 'block', 'loading tetap tampil saat snapshot awal lambat');
    await page.evaluate(() => {
      for (const path of fixture.state().active) fixture.fire(path, path.endsWith('/program') ? {a:{studentKey:'A'}} : {});
    });
    await page.evaluate(() => window.firstLoad);
    assert.equal((await page.evaluate(() => fixture.state())).data.program.a.studentKey, 'A');
    await page.evaluate(path => fixture.fire(path,{fresh:{studentKey:'A'}}), childA);
    assert.equal((await page.evaluate(() => fixture.state())).data.program.fresh.studentKey, 'A');
    await page.evaluate(() => { window.old = fixture.select('A'); window.next = fixture.select('B'); });
    let state = await page.evaluate(() => fixture.state());
    assert(state.detached.includes(childA));
    assert.equal(Object.keys(state.data.program).length, 0);
    await page.evaluate(() => {
      const old = fixture.bindings.find(x=>x.detached&&x.path.endsWith('/A/program'));
      old.callback({val:()=>({stale:{studentKey:'A'}})});
      for (const path of fixture.state().active) fixture.fire(path, path.endsWith('/program') ? {b:{studentKey:'B'}} : {});
    });
    await page.evaluate(() => window.next);
    state = await page.evaluate(() => fixture.state());
    assert.equal(state.data.program.b.studentKey, 'B');
    assert.equal(state.data.program.stale, undefined);
    await page.evaluate(() => { window.errorLoad = fixture.select('C'); });
    await page.evaluate(() => {
      for (const path of fixture.state().active) path.endsWith('/tahfiz') ? fixture.fail(path) : fixture.fire(path,{});
    });
    await page.evaluate(() => window.errorLoad);
    state = await page.evaluate(() => fixture.state());
    assert.equal(state.ready,true);
    assert.equal(state.loading,'none');
    assert.equal(state.warnings.length,1);
    console.log('PASS Wali browser: initial snapshot, realtime, rapid child switch, stale callback isolation, listener error');

    const naqibCode=moduleCode(naqibHtml);
    const naqibIds=[...new Set([...naqibCode.matchAll(/\$\('([^']+)'\)/g)].map(match=>match[1]))];
    const naqibPage=await fixturePage(browser,naqibIds);
    await naqibPage.addScriptTag({content:`
      window.__calls=[];
      window.CAHAYA_CONFIG={firebase:{}};
      window.CAHAYA_PROGRAM_HARIAN_24JAM=[{id:'subuh',program:'Subuh',waktu:'04.00'},{id:'zuhur',program:'Zuhur',waktu:'12.00'}];
      window.CahayaWorkspace={localDate:()=> '2026-10-31',dayName:()=> 'Sabtu',unitFromProfile:()=> 'Putra',name:()=> 'Naqib',norm:value=>String(value||'').toLowerCase(),records:value=>Object.values(value||{}),esc:value=>String(value)};
      const getApps=()=>[{}],initializeApp=()=>({}),getDatabase=()=>({}),ref=(_db,name)=>({name});
      const orderByChild=field=>({field}),startAt=start=>({start}),endAt=end=>({end});
      const query=(base,...clauses)=>({...base,clauses});
      const get=async request=>{window.__calls.push(request);return {exists:()=>true,val:()=>({today:{tanggal:'2026-10-31',programId:'subuh'},old:{tanggal:'2026-10-30',programId:'zuhur'}})}};
    `});
    await naqibPage.addScriptTag({content:naqibCode});
    await naqibPage.evaluate(()=>window.__firstLoad);
    const naqib=await naqibPage.evaluate(()=>({calls:window.__calls,list:document.getElementById('programList').textContent}));
    assert.equal(naqib.calls.length,1);
    assert.equal(naqib.calls[0].name,'cahaya_app/absensi_program_harian');
    assert.deepEqual(naqib.calls[0].clauses.map(x=>Object.values(x)[0]),['tanggal','2026-10-31','2026-10-31\uf8ff']);
    console.log('PASS Naqib browser: one date scoped RTDB query');
    await naqibPage.close();

    const commandCode=moduleCode(commandHtml);
    const commandIds=[...new Set([...commandCode.matchAll(/\$\('([^']+)'\)/g)].map(match=>match[1]))];
    const commandPage=await fixturePage(browser,commandIds);
    await commandPage.addScriptTag({content:`
      window.__calls=[];window.CAHAYA_CONFIG={firebase:{}};
      window.CahayaWorkspace={monthKey:()=> '2026-10',unitFromProfile:()=> 'Putra',name:()=> 'Supervisor',norm:value=>String(value||'').toLowerCase(),records:value=>Object.values(value||{}),toast:()=>{}};
      const getApps=()=>[{}],initializeApp=()=>({}),getDatabase=()=>({}),ref=(_db,name)=>name;
      const get=async name=>{window.__calls.push(name);return {exists:()=>true,val:()=>name==='observasi_lapangan'?{a:{tanggal:'2026-10-30',unit:'Putra',jenis:'pembelajaran',persentase:80},b:{tanggal:'2026-10-30',unit:'Putra',jenis:'pengasuhan',persentase:70}}:{}}};
      const push=()=>({key:'unused'}),set=async()=>{throw Error('writes forbidden')};
    `});
    await commandPage.addScriptTag({content:commandCode});
    await commandPage.evaluate(()=>window.__firstLoad);
    const command=await commandPage.evaluate(()=>({calls:window.__calls,audit:document.getElementById('audit').textContent}));
    assert.equal(command.calls.length,7);
    assert.equal(command.calls.filter(x=>x==='observasi_lapangan').length,1);
    assert.equal(command.calls.includes('cahaya_app/capaian_materi'),false);
    console.log('PASS Supervisor Command Center browser: seven reads and no duplicate observation read');
    await commandPage.close();

    const academicPage=await fixturePage(browser,['list']);
    const arrayCode=academicHtml.slice(academicHtml.indexOf('function array(v)'),academicHtml.indexOf('function profile()'));
    const dataCode=academicHtml.slice(academicHtml.indexOf('function flattenTahfiz(value)'),academicHtml.indexOf('const requestedMode='));
    await academicPage.addScriptTag({content:`
      window.__calls=[];
      const fixture={'cahaya_app/nilai_ujian_bulanan':{a:{status:'FINAL',nilai_total:88,is_remedial:true}},'cahaya_app/nilai_ujian':{b:{status:'FINAL',nilai_total:90},c:{status:'DRAFT',nilai_total:75}},'cahaya_app/rapor_publication':{student:{published:true}},'cahaya_app/program_quran_santri':{student:{program:'TAHFIZ'}},'cahaya_app/setoran_tahfiz':{one:{program:'tahfiz',tanggal:'2026-10-01',data:{a:{namaSantri:'A',surah:'Al-Mulk'}}}}};
      const db={ref(path){return {once:async()=>{window.__calls.push(path);return {val:()=>fixture[path]||{}}}}}};
      const loadSchedule=async()=>{},populateFilters=()=>{},$=id=>document.getElementById(id),esc=value=>String(value);
      let rows=[],tahfizRows=[],tahfizHistoryPromise=null,markers={},quranAssignments={};
      ${arrayCode}${dataCode}
      window.academic={load,loadTahfizHistory,inspect:()=>({rows,tahfizRows,markers,quranAssignments})};
    `});
    await academicPage.evaluate(()=>academic.load());
    let academic=await academicPage.evaluate(()=>({calls:window.__calls,state:academic.inspect()}));
    assert.equal(academic.calls.length,4);
    assert.equal(academic.state.rows.length,3);
    assert.equal(academic.state.rows[0].is_remedial,true);
    await academicPage.evaluate(()=>academic.loadTahfizHistory());
    academic=await academicPage.evaluate(()=>({calls:window.__calls,state:academic.inspect()}));
    assert.equal(academic.calls.length,5);
    assert.equal(academic.state.tahfizRows[0].surah,'Al-Mulk');
    console.log('PASS Supervisor Academic browser: four initial reads, Tahfiz lazy read, report values retained');
    await academicPage.close();
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
