// Actual presentation functions, isolated fixtures: no Firebase reads or writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const wali=fs.readFileSync(path.join(root,'wali/dashboard/akademik.html'),'utf8');
const bulk=fs.readFileSync(path.join(root,'supervisor/raport-bulanan.html'),'utf8');
const uas=fs.readFileSync(path.join(root,'admin/rapot-uas.html'),'utf8');
const extract=name=>{const match=wali.match(new RegExp('  function '+name+'\\([^]*?\\n  \\}'));assert(match,name);return match[0];};
const record={nama_santri:'SANTRI UJI',studentKey:'santriuji',mata_pelajaran:'Fiqih',guru_penguji:'Guru Uji',materi_ujian:'Bab Thaharah QA_MATERIAL',materi:'QA_MATERIAL',jenis_ujian:'Bulanan',periode_ujian:'September',bulan:'September',tahun_akademik:'2026/2027',status_nilai:'FINAL',locked:true,nilai_total:90,nilai_syafawi:90,nilai_tahriri:90,nilai_tashnif:90,nilai_tathbiqi:90,bobot_syafawi_persen:25,bobot_tahriri_persen:25,bobot_tashnif_persen:25,bobot_tathbiqi_persen:25,is_remedial:true,keterangan:'Sudah memahami materi dasar'};
const original=JSON.stringify(record);
for(const source of [wali,bulk,uas])assert(!/materi_ujian|Materi Ujian|Capaian Materi|Target Materi|Pokok Materi|Topik Pembelajaran/.test(source));
assert(fs.readFileSync(path.join(root,'guru/inputNilaiUjian.html'),'utf8').includes('materi_ujian: params.materi'));
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:409,height:720}});
  const styles=[...wali.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
  await page.setContent('<style>'+styles+'</style><section id="secEvaluasi"><div id="evaluasiListContainer"></div></section>');
  await page.addScriptTag({path:path.join(root,'js/academic-report-score-policy.js')});
  await page.addScriptTag({path:path.join(root,'js/wali-academic-report-v2.js')});
  await page.evaluate(({record,code})=>{
   window.globalExams=[record];window.currentMonthFilter='September';window.formatGelarAkademik=x=>x;window.academicReport=window.CahayaWaliAcademicReportV2;window.activeStudentProfile={name:'SANTRI UJI',studentKey:'santriuji'};window.activeYear=()=> '2026/2027';window.examBelongsToStudentProgram=()=>true;
   (0,eval)(code);renderEvaluasi();
  },{record,code:extract('renderEvaluasi')});
  const screen=await page.locator('#evaluasiListContainer').innerText();
  assert(!/Materi|QA_MATERIAL|Thaharah/.test(screen));
  for(const text of ['Fiqih','Guru Uji','90','Baik','Lisan','Tulisan','Tashnif','Praktek','Telah melakukan Remedial','Sudah memahami materi dasar'])assert(screen.toLowerCase().includes(text.toLowerCase()),text);
  assert.equal(await page.evaluate(()=>JSON.stringify(globalExams[0])),original);
  assert(screen.includes('90%'));
  for(const value of [90,75,65]){
   await page.evaluate(value=>{globalExams=[{...globalExams[0],nilai_total:value}];renderEvaluasi();},value);
   const remedialScreen=await page.locator('#evaluasiListContainer').innerText();
   assert(remedialScreen.includes(String(value)),`screen keeps remedial score ${value}`);
   assert(remedialScreen.includes('Remedial'),`screen labels remedial score ${value}`);
  }
  await page.addScriptTag({path:'/tmp/cahaya-qa-jspdf.js'});await page.addScriptTag({path:'/tmp/cahaya-qa-autotable.js'});
  const functions=['teksPdf','predikatNilai','opsiAutoTable','pastikanRuangPdf','judulBagianPdf','gambarUjianPdf'].map(extract).join('\n');
  const data=await page.evaluate(({functions,record})=>{
   window.gambarHeaderLanjutan=()=>{};(0,eval)(functions);
   const doc=new jspdf.jsPDF();gambarUjianPdf(doc,20,{},[record]);
   const pdfScores=[90,75,65].map(value=>{const qa=new jspdf.jsPDF();gambarUjianPdf(qa,20,{},[{...record,nilai_total:value}]);return qa.lastAutoTable.body[0].raw[5]});
   return {bytes:Array.from(new Uint8Array(doc.output('arraybuffer'))),headers:doc.lastAutoTable.head[0].raw,rows:doc.lastAutoTable.body[0].raw,width:doc.lastAutoTable.columns.reduce((sum,c)=>sum+c.width,0),pdfScores};
  },{functions,record});
  assert.deepEqual(data.headers,['Mata Pelajaran','Lisan','Tulisan','Tashnif','Praktek','Nilai','Predikat','Keterangan']);
  assert.equal(data.rows.length,8);assert.equal(data.rows[5],'90');assert(!data.rows.join(' ').includes('QA_MATERIAL'));assert.equal(data.width,180);assert(data.rows[7].includes('Telah melakukan Remedial'));assert(data.rows[7].includes('Sudah memahami'));
  assert.deepEqual(data.pdfScores,['90','75','65']);
  fs.writeFileSync('/tmp/cahaya-no-material-individual.pdf',Buffer.from(data.bytes));
  const template=bulk.match(/<template id="raportTemplate">([\s\S]*?)<\/template>/)[1];
  const section=bulk.slice(bulk.indexOf('const tbody = page.querySelector(".tabelNilai")'),bulk.indexOf('// SECTION B1: TAHFIZ'));
  const css=[...bulk.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
  await page.setContent('<style>'+css+' .fixture{break-after:page}</style><main id="printArea"></main>');
  await page.addScriptTag({path:path.join(root,'js/academic-report-score-policy.js')});
  await page.evaluate(({template,section,record})=>{
   for(const name of ['SANTRI UJI','SANTRI UJI DUA']){
    const page=document.createElement('div');page.innerHTML=template;
    new Function('page','dataN','santriName','tAkademik','namaBulanIndo','getPredikat',section)(page,[{...record,nama_santri:name}],name,'2026/2027','September',()=>({huruf:'B',color:'navy'}));
    const paper=document.createElement('section');paper.className='fixture';
    const title=document.createElement('h2');title.textContent=name;paper.append(title,page.querySelector('.tabelNilai').closest('table'));document.querySelector('#printArea').append(paper);
   }
  },{template,section,record});
  const text=await page.locator('#printArea').innerText();assert(!/Materi|Thaharah|QA_MATERIAL/.test(text));
  assert(text.includes('90'));
  assert(text.includes('Telah melakukan Remedial'));assert(text.includes('Sudah memahami materi dasar'));
  assert.equal(await page.locator('.tabelNilai tr').count(),2);
  await page.pdf({path:'/tmp/cahaya-no-material-bulk.pdf',format:'A4',printBackground:true});
  assert.equal(JSON.stringify(record),original);
  assert(uas.includes("item?.is_remedial === true")&&uas.includes('Telah melakukan Remedial'));
  console.log('PASS: actual screen/monthly PDF/bulk-print renderers; PDF Guru column removed; scores/components/predikat retained; populated material fixture unchanged.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
