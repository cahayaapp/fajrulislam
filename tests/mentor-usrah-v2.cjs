const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../js/cahaya-assessment-registry.js'),R=require('../js/role-system-v2.js'),N=require('../js/role-navigation-v2.js');
assert.equal(A.dimensions.length,5);assert.deepEqual(A.dimensions.map(x=>x.name),['Cinta Allah','Akhlak Mulia','Hati Bersih','Akal Cerdas','Fisik Berdaya']);assert.equal(A.dimensions.reduce((n,d)=>n+d.indicators.length,0),12);assert(A.dimensions.every(d=>d.indicators.every(i=>i.options.length===5)));assert.deepEqual(A.scale,[1,2,3,4,5]);
const authoritative=fs.readFileSync(path.join(__dirname,'../pusat-asesmen/santri.html'),'utf8');for(const d of A.dimensions)for(const i of d.indicators){assert(authoritative.includes(i.label),i.label);for(const option of i.options)assert(authoritative.includes(option),option)}
const mentor=R.resolveSession({username:'mentor',roleSystemVersion:2,roles:['MENTOR_USRAH'],defaultRole:'MENTOR_USRAH',assignments:{MENTOR_USRAH:{usrahIds:['USRAH_3','USRAH_4']}}});assert.equal(R.homeFor('MENTOR_USRAH'),'home-mentor-usrah.html?v=225');assert.deepEqual(R.menusFor('MENTOR_USRAH',mentor.activeAssignment),['menu-home','menu-profil','menu-chat','menu-panduan-kerja','menu-kpi-role','menu-jadwal-role','menu-mentoring-individu','menu-mentoring-usrah','menu-jurnal-liburan-monitor']);assert(N.canAccessRoute(mentor,'pembinaan/mentor-usrah-v2.html?view=form').ok);assert(N.canAccessRoute(mentor,'pembinaan/mentor-usrah-v2.html?view=history').ok);assert(!N.canAccessRoute(mentor,'pembinaan/mentoring-individu.html').ok);assert(!N.canAccessRoute(mentor,'konselor/cases-v2.html').ok);assert(!R.can('MENTOR_USRAH','case.handle',mentor.activeAssignment));
const home=fs.readFileSync(path.join(__dirname,'../home-mentor-usrah.html'),'utf8');assert.equal((home.match(/class="mu-feature/g)||[]).length,2);for(const forbidden of ['KPI Mentor','Self Asesmen Mentor','Absensi','Skor Kedisiplinan'])assert(!home.includes(forbidden));
const implementation=fs.readFileSync(path.join(__dirname,'../js/mentor-usrah-v2.js'),'utf8');
assert(implementation.includes("studentKey:key"));
assert(implementation.includes("wali_index/${key}/mentoring/${id}"));
assert(implementation.includes("repairWaliMentoringIndex(scoped)"));
assert(implementation.includes("range('HISTORY')"));
const menuModel=require('../js/role-menu-v2.js').model(mentor);
assert(menuModel.find(x=>x.id==='menu-mentoring-individu').route.endsWith('view=form'));
assert(menuModel.find(x=>x.id==='menu-mentoring-usrah').route.endsWith('view=history'));
for(const [menu,view] of [['menu-mentoring-individu','form'],['menu-mentoring-usrah','history']]){
  assert(N.decision(mentor,menu,`pembinaan/mentor-usrah-v2.html?v=224&view=${view}`).ok);
  assert(!N.decision(mentor,menu,view==='form'?'pembinaan/mentoring-individu.html':'pembinaan/mentoring-usrah.html').ok);
}
const dashboard=fs.readFileSync(path.join(__dirname,'../main-dashboard.html'),'utf8');
assert(dashboard.includes("mentor-usrah-v2.html?v=226&amp;view=form"));
assert(dashboard.includes("mentor-usrah-v2.html?v=226&amp;view=history"));
assert(!dashboard.includes("loadPage('pembinaan/mentoring-individu.html"));
assert(!dashboard.includes("loadPage('pembinaan/mentoring-usrah.html"));
console.log('mentor-usrah-v2: ok');
