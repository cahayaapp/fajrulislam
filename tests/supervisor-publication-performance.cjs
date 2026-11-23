const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{test}=require('node:test');
const html=fs.readFileSync('supervisor/laporan-akademik.html','utf8');
const Best=require('../js/student-ranking-v1.js');
test('indexed ranking preserves attendance aliases, duplicates, sources and period filtering',()=>{
  const students=[{name:'Ahmad',studentKey:'a',sourceStudentKey:'id-a'},{name:'Budi',studentKey:'b'}];
  const attendance=[{tanggal:'2026-09-01',__attendanceSource:'PROGRAM',data:{a:{studentKey:'id-a',nama:'Ahmad',status:'HADIR'},b:{studentKey:'b',status:'IZIN'}}},{tanggal:'2026-09-02',__attendanceSource:'PEMBELAJARAN',students:[{nama:'AHMAD',status:'TERLAMBAT'},{nama:'Budi',status:'ALFA'}]},{tanggal:'2025-09-01',data:[{nama:'Ahmad',status:'ALFA'}]}];
  const opts={attendance,type:'bulanan',period:'September',academicYear:'2026/2027'};
  const result=Best.bestStudentRanking(students.map(student=>({student,average:85,complete:true})),opts);
  for(const item of result)assert.deepEqual(item.attendance,Best.attendanceFor(item.student,attendance,Best.periodRange(opts.type,opts.period,opts.academicYear)));
});
test('publishing one report writes once, blocks double click and never syncs other reports',async()=>{
  const controls=[{disabled:false,dataset:{}},{disabled:true,dataset:{}}],elements={type:{value:'bulanan'},period:{value:'September'},publicationStatus:{textContent:''}};
  let release,writes=0,lastPayload,confirmation;
  const pending=new Promise(resolve=>release=resolve),x={student:{name:'A',kelas:'1 Putra'},ready:{ready:true}};
  const ctx=vm.createContext({document:{querySelectorAll:()=>controls},$:id=>elements[id],window:{__visibleReports:[x]},canPublishReports:()=>true,confirm:message=>{confirmation=message;return true},loadRankingSupport:()=>pending,setTimeout,
    P:{TYPES:{bulanan:{label:'Bulanan'}},STATUS:{PUBLISHED:'PUBLISHED'},rankingSnapshot:()=>({rank:1})},B:{snapshot:()=>({rank:1})},reportModels:()=>[x],rankedModels:()=>[x],bestRankingForUnit:()=>[x],modelIdentity:item=>item.student.name,
    userUid:()=>'',userName:()=>'',supervisorUnit:()=>'',toast:()=>{},mutate:async(student,status,payload)=>{writes++;lastPayload=payload},syncPublishedRankingSnapshots:()=>{throw Error('unexpected mass sync')}});
  vm.runInContext(html.slice(html.indexOf('let publicationBusy='),html.indexOf('async function withdrawReport')),ctx);
  const first=ctx.publishReport(0);await ctx.publishReport(0);
  assert.equal(writes,0);assert(controls.every(control=>control.disabled));assert.match(elements.publicationStatus.textContent,/Menyiapkan/);
  release();await first;assert.equal(writes,1);assert.equal(controls[0].disabled,false);assert.equal(controls[1].disabled,true);assert.match(elements.publicationStatus.textContent,/berhasil/);
  x.ready={ready:false,final:2,expected:8};await ctx.publishReport(0);assert.equal(writes,2);assert.equal(lastPayload.publishedIncomplete,true);assert.match(confirmation,/2\/8 mapel Final/);
  ctx.canPublishReports=()=>false;await ctx.publishReport(0);assert.equal(writes,2);ctx.canPublishReports=()=>true;
  ctx.loadRankingSupport=async()=>{throw Error('offline')};await ctx.publishReport(0);assert.equal(writes,2);assert.equal(controls[0].disabled,false);assert.match(elements.publicationStatus.textContent,/offline/);
});
test('attendance requests are shared, cached per period, and retry after errors',async()=>{
  let calls=0,fail=false;const elements={type:{value:'bulanan'},period:{value:'September'},year:{value:'2026/2027'}};
  const ctx=vm.createContext({$:id=>elements[id],B:Best,array:value=>Object.values(value||{}),db:{ref(){return{orderByChild(){return this},startAt(){return this},endAt(){return this},async once(){calls++;if(fail)throw Error('offline');return{val:()=>({})}}}}}});
  vm.runInContext('let attendanceRows=[],rankingSupportKey="";'+html.slice(html.indexOf('const rankingRequests='),html.indexOf('async function renderRanking()')),ctx);
  await Promise.all([ctx.loadRankingSupport(),ctx.loadRankingSupport()]);assert.equal(calls,2);
  elements.period.value='Oktober';await ctx.loadRankingSupport();assert.equal(calls,4);
  elements.period.value='September';await ctx.loadRankingSupport();assert.equal(calls,4);
  elements.period.value='November';fail=true;await assert.rejects(ctx.loadRankingSupport(),/offline/);fail=false;await ctx.loadRankingSupport();assert.equal(calls,8);
});
