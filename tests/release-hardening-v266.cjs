'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const R=require('../js/role-system-v2.js'),M=require('../js/role-menu-v2.js'),N=require('../js/role-navigation-v2.js'),C=require('../js/role-guide-content-v2.js'),{fixtures,profile}=require('./role-menu-v2-fixtures.cjs');
assert.deepEqual(M.REQUIRED_INTERNAL_UTILITIES,['kpi','pesan','profil','panduan']);
let internal=0;
for(const f of fixtures.filter(x=>x.user.defaultRole!=='WALI_SANTRI')){
  const s=R.resolveSession(f.user),items=M.model(s);internal++;
  for(const id of ['menu-profil','menu-chat','menu-panduan-kerja'])assert(items.some(x=>x.id===id),f.name+' '+id);
  for(const kind of ['jadwal','kpi'])assert(items.some(x=>x.id===M.bottom(s,kind)),f.name+' '+kind);
  const guide=items.find(x=>x.id==='menu-panduan-kerja');assert.equal(guide.route,'panduan-role-v2.html');
  assert.equal(items.find(x=>x.id==='menu-chat').action,'chat');
  assert.equal(items.filter(x=>x.id==='menu-panduan-kerja').length,1);
  const content=C.get(s);assert(content,f.name+' local content');
  for(const key of ['purpose','structure','question','duties','boundary','cycle','daily','weekly','monthly','evidence','finding','escalation','relations','avoid','statuses'])assert(content[key]?.length,f.name+' '+key);
  assert(!/Firebase|RTDB|activeAssignment|caseV2|orderByChild|schema|adapter/.test(JSON.stringify(content)));
  for(const item of items)assert(C.steps(item,s).length>20,'manual '+item.label);
  if(s.activeRole==='MANAJER'&&s.activeAssignment.area==='PEMBINAAN_KARAKTER')assert(!JSON.stringify(content).includes('Kontrol Hari Ini'));
  // Navigation additions do not grant new business actions.
  if(['MENTOR_USRAH','NAQIB','NAQIBAH','DAPUR','MEDIA'].includes(s.activeRole))assert(!R.can(s.activeRole,'case.handle',s.activeAssignment));
  if(s.activeRole==='MENTOR_USRAH')assert(!R.can(s.activeRole,'message.broadcast',s.activeAssignment));
}
const wali=R.resolveSession(profile('WALI_SANTRI'));assert.equal(C.get(wali),null);assert.deepEqual(M.model(wali).map(x=>x.id),['menu-home','menu-panduan-kerja']);
for(const route of ['panduan-role-v2.html','utilitas-role-v2.html?view=kpi','pesan.html'])assert(!N.canAccessRoute(wali,route).ok);
for(const file of ['js/role-guide-content-v2.js','js/role-utilities-v2.js'])assert(!/\b(?:fetch|XMLHttpRequest|setInterval|getDatabase|firebase)\s*[.(]/.test(fs.readFileSync(file,'utf8')),file+' local only');
const chat=fs.readFileSync('js/pengurus-whatsapp-chat.js','utf8');assert(!/setInterval\(/.test(chat));assert(chat.includes('pesan_global/'));assert(chat.includes('Belum Ada Pesan'));assert(chat.includes('retryCahayaMessages'));assert(chat.includes('stopMessageListeners'));
const changed=['main-dashboard.html','profil.html','panduan-role-v2.html','pesan.html','utilitas-role-v2.html','js/role-system-v2.js','js/role-route-registry-v2.js','js/role-navigation-v2.js','js/role-menu-v2.js','js/role-entry-v2.js','js/cahaya-ui-v2.js','js/mobile-home-v2.js','js/pengurus-whatsapp-chat.js','js/role-guide-content-v2.js','js/role-utilities-v2.js','css/role-utilities-v2.css'];
for(const file of changed){const source=fs.readFileSync(file,'utf8');assert.equal(source,fs.readFileSync('docs/'+file,'utf8'),'mirror '+file);if(file.endsWith('.js'))new vm.Script(source,{filename:file});else if(file.endsWith('.html'))for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/src=|type=["']module/.test(match[1]))new vm.Script(match[2],{filename:file+' inline'});}
console.log(`PASS release hardening: ${internal} internal contexts, required utilities, local guides, Wali exclusion, unchanged business authority, syntax and mirrors`);
