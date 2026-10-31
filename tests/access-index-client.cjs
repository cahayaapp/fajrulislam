'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const C=require('../js/access-index-client.js');
const staff=C.entriesFor({roleSystemVersion:2,roles:['GURU_PONDOK'],label:'Guru Uji'},'guru-uji');
assert.equal(staff.user.active,true);
assert.equal(staff.user.internal,true);
assert.equal(staff.user.roles.guru_pondok,true);
assert.equal(staff.wali,null);
const wali=C.entriesFor({roleSystemVersion:2,roles:['WALI_SANTRI'],students:[{studentKey:'anak-1',namaSantri:'Anak Satu'},{studentKey:'anak-2',active:false}]},'wali-uji');
assert.equal(wali.user.internal,false);
assert.equal(wali.wali.active,true);
assert.equal(wali.wali.students['anak-1'].active,true);
assert.equal(wali.wali.students['anak-2'].active,false);
assert.equal(C.entriesFor({roles:['WALI_SANTRI'],active:false,students:[{studentKey:'anak-1'}]},'nonaktif').wali.active,false);
for(const path of ['admin/users.html','docs/admin/users.html']){
 const html=fs.readFileSync(path,'utf8');
 assert.match(html,/firebase-database\.js/);
 assert.match(html,/syncAccessIndex\(patch,patch\.username\)/);
 assert.match(html,/syncAccessIndex\(merged,editId\)/);
 assert.match(html,/cahaya_access\/users\/\$\{uid\}/);
 const inline=html.match(/<script>\s*('use strict';[\s\S]*?)<\/script><\/body>/)?.[1];
 assert.ok(inline,path);
 new vm.Script(inline,{filename:path});
}
console.log('PASS Admin access index generation and editor wiring');
