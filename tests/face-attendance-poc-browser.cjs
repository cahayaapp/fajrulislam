const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:409,height:720},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${origin}/dev/face-attendance-poc.html?test=1`);await page.evaluate(()=>window.FaceAttendancePOCTest.ready);
    const result=await page.evaluate(async()=>{
      const api=window.FaceAttendancePOCTest,basis=index=>Array.from({length:6},(_,position)=>position===index?1:0);
      for(let index=0;index<5;index++)await api.enroll(`student:${index}`,`SANTRI ${String.fromCharCode(65+index)}`,`Kelas ${index+1} Putra`,[basis(index),basis(index),basis(index),basis(index)]);
      await api.newSession(new Date('2026-09-26T04:00:00+07:00'));
      const a=await api.scan(basis(0),{now:new Date('2026-09-26T04:41:00+07:00')});
      const duplicate=await api.scan(basis(0),{now:new Date('2026-09-26T04:42:00+07:00')});
      const b=await api.scan(basis(1),{now:new Date('2026-09-26T04:48:00+07:00')});
      const unknown=await api.scan(basis(5),{now:new Date('2026-09-26T04:43:00+07:00')});
      const enrolled=api.state.enrollments.length;await api.clearCache();const afterClear=api.state.enrollments.length;await api.syncProfiles();
      return {a:a.outcome.record,b:b.outcome.record,duplicate:duplicate.outcome.reason,unknown:unknown.match.reason,count:Object.keys(api.state.session.checkIns).length,enrolled,afterClear,afterResync:api.state.enrollments.length};
    });
    assert.equal(result.enrolled,5);assert.equal(result.afterClear,0);assert.equal(result.afterResync,5);assert.equal(result.count,2);assert.equal(result.a.status,'HADIR');assert.equal(result.b.status,'TERLAMBAT');assert.equal(result.duplicate,'DUPLICATE');assert.match(result.unknown,/BELOW_THRESHOLD|AMBIGUOUS/);
    assert.match(await page.locator('#scanLog').innerText(),/SANTRI A/);assert.match(await page.locator('#scanLog').innerText(),/SANTRI B/);
    for(const width of [360,409,430]){await page.setViewportSize({width,height:720});const metrics=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert(metrics.scroll<=metrics.width,`horizontal overflow at ${width}px: ${metrics.scroll}`)}
    await page.setViewportSize({width:409,height:720});await page.screenshot({path:'/tmp/face-attendance-poc-409x720.png',fullPage:true});
    assert.deepEqual(errors,[]);console.log('PASS face POC browser: 5 enrollments, recognized/unknown/duplicate, Hadir/Terlambat, 360-430px no overflow');
    await context.close();
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
