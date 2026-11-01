'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
let count=0;
for(const file of ['main-dashboard.html','docs/main-dashboard.html','admin/database.html','docs/admin/database.html']){
 const html=fs.readFileSync(file,'utf8');
 for(const [index,match] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()){
  const [,attrs,code]=match;if(!code.trim()||/type=["']application\//i.test(attrs))continue;
  if(/type=["']module/i.test(attrs)){const result=cp.spawnSync(process.execPath,['--input-type=module','--check'],{input:code,encoding:'utf8'});assert.equal(result.status,0,`${file} script ${index}: ${result.stderr}`)}
  else new vm.Script(code,{filename:`${file}:script-${index}`});count++;
 }
 if(file.endsWith('main-dashboard.html')){
  const context={document:{getElementById:id=>id==='contentFrame'?context.frame:context.title},frame:{removeAttribute(){}},title:{}};
  const fn=html.slice(html.indexOf('    function tampilkanHalamanTanpaAkses()'),html.indexOf('    function bukaHalamanAwalYangDiizinkan()'));
  vm.runInNewContext(fn+';tampilkanHalamanTanpaAkses();',context);
  assert(context.frame.srcdoc.includes('Belum Ada Menu yang Diotorisasi'));
  assert(!context.frame.srcdoc.includes('admin-emerald-shell'));
 }
}
assert.equal(fs.readFileSync('main-dashboard.html','utf8'),fs.readFileSync('docs/main-dashboard.html','utf8'));
console.log(`PASS ${count} inline scripts compile; access fallback renders; dashboard mirrors match`);
