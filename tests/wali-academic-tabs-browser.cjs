'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'wali/dashboard/akademik.html'),'utf8');
const extract=name=>{const match=html.match(new RegExp('  function '+name+'\\([^]*?\\n  \\}'));assert(match,name);return match[0]};
const styles=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match=>match[1]).join('\n');
const functions=['bindReportTabs','selectedPeriod','selectedPeriodicScores','escapeAcademic','scoreComponents','renderPeriodicReport'].map(extract).join('\n');
const records=[
 {id:'monthly',nama_santri:'ANAK A',studentKey:'anaka',tahun_akademik:'2026/2027',status_nilai:'FINAL',locked:true,jenis_ujian:'Bulanan',periode_ujian:'September',bulan:'September',mata_pelajaran:'Fiqih',nilai_total:90},
 {id:'quarter',nama_santri:'ANAK A',studentKey:'anaka',tahun_akademik:'2026/2027',status_nilai:'FINAL',locked:true,jenis_ujian:'Triwulan',periode_ujian:'Triwulan 1',mata_pelajaran:'Fiqih',guru_penguji:'Guru A',nilai_total:86,is_remedial:true},
 {id:'semester',nama_santri:'ANAK A',studentKey:'anaka',tahun_akademik:'2026/2027',status_nilai:'FINAL',locked:true,jenis_ujian:'Semester',periode_ujian:'Semester 1',semester:'Ganjil',mata_pelajaran:'Bahasa Arab',guru_penguji:'Guru B',nilai_total:88},
 {id:'draft',nama_santri:'ANAK A',studentKey:'anaka',tahun_akademik:'2026/2027',status_nilai:'DRAFT',locked:false,jenis_ujian:'Triwulan',periode_ujian:'Triwulan 1',mata_pelajaran:'Adab',nilai_total:99},
 {id:'other',nama_santri:'ANAK B',studentKey:'anakb',tahun_akademik:'2026/2027',status_nilai:'FINAL',locked:true,jenis_ujian:'Triwulan',periode_ujian:'Triwulan 1',mata_pelajaran:'Nahwu',nilai_total:100}
];
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 for(const width of [360,409,430]){const page=await browser.newPage({viewport:{width,height:720}});await page.setContent(`<style>${styles}</style><main class="app-container"><div class="report-tabs"><button class="report-tab active" data-report-tab="bulanan" aria-selected="true">Bulanan</button><button class="report-tab" data-report-tab="triwulan" aria-selected="false">Triwulan</button><button class="report-tab" data-report-tab="semester" aria-selected="false">Semester</button></div><div id="monthFilterWrap"></div><div id="quarterFilterWrap" hidden><select id="filterTriwulan"><option>Triwulan 1</option></select></div><div id="semesterFilterWrap" hidden><select id="filterSemester"><option>Semester 1</option></select></div><select id="filterTahunAkademik"><option>2026/2027</option></select><section id="secPeriodik"><div id="periodReportSummary"></div><div id="periodReportList"></div></section></main>`);
  await page.addScriptTag({path:path.join(root,'js/academic-report-score-policy.js')});await page.addScriptTag({path:path.join(root,'js/wali-academic-report-v2.js')});
  await page.evaluate(({functions,records})=>{window.formatGelarAkademik=x=>x;window.examBelongsToStudentProgram=()=>true;(0,eval)(`let activeReportTab='bulanan';const academicReport=window.CahayaWaliAcademicReportV2;const activeStudentProfile={name:'ANAK A',studentKey:'anaka'};const globalPeriodicExams=${JSON.stringify(records)};function activeYear(){return document.getElementById('filterTahunAkademik').value}${functions};window.__active=()=>activeReportTab;window.renderSemuaData=()=>{if(activeReportTab!=='bulanan')renderPeriodicReport()};bindReportTabs();`);},{functions,records});
  assert.equal(await page.locator('[data-report-tab="bulanan"]').getAttribute('aria-selected'),'true');
  await page.locator('[data-report-tab="triwulan"]').click();let text=await page.locator('#periodReportList').innerText();assert(text.includes('Fiqih'));assert(text.includes('86'));assert(text.includes('Remedial'));assert(!text.includes('Bahasa Arab'));assert(!text.includes('Adab'));assert(!text.includes('Nahwu'));
  await page.locator('[data-report-tab="semester"]').click();text=await page.locator('#periodReportList').innerText();assert(text.includes('Bahasa Arab'));assert(text.includes('88'));assert(!text.includes('Fiqih'));
  assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width,`overflow ${width}px`);await page.close();
 }
 console.log('Wali academic tabs browser: default monthly, exact quarterly/semester FINAL data, remedial, isolation, 360/409/430px: PASS');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
