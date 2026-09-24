'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const R=require('../js/role-system-v2.js'),N=require('../js/role-navigation-v2.js'),M=require('../js/role-menu-v2.js'),{fixtures,profile}=require('./role-menu-v2-fixtures.cjs');
let links=0;const results=[];
for(const fixture of fixtures){
  const s=R.resolveSession(fixture.user),items=M.model(s);
  assert(items.some(x=>x.id==='menu-home'),fixture.name+' has a Home');
  assert.equal(new Set(items.map(x=>x.id)).size,items.length,'unique DOM IDs');
  assert.equal(new Set(items.map(x=>M.key(x.route))).size,items.length,'unique functional destinations');
  for(const item of items){
    const p=N.parse(item.route);assert(p&&fs.existsSync(path.join(__dirname,'..',p.path)),item.route);
    assert(N.routes[p.path],item.route);assert(N.decision(s,item.permission,item.route).ok,fixture.name+' '+item.label);
    assert.equal(M.resolve(s,item.id,item.route).route,item.route);
    // A Wali cannot access any internal role page or impersonate a menu.
    if(s.activeRole!=='WALI_SANTRI'&&p.path!=='role-workspace.html')assert(!N.canAccessRoute(R.resolveSession(profile('WALI_SANTRI')),item.route).ok,item.route+' rejects unrelated role');
    for(const prefix of ['', 'docs/']){
      const html=fs.readFileSync(path.join(__dirname,'..',prefix,p.path),'utf8');
      for(const [,src] of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)){
        if(/^(?:https?:|\/\/)/.test(src)||src.includes('${'))continue;
        assert(fs.existsSync(path.resolve(__dirname,'..',prefix,path.dirname(p.path),src.split('?')[0])),`${prefix}${p.path}: ${src}`);
      }
    }
    links++;
  }
  for(const kind of ['jadwal','kpi']){const target=M.bottom(s,kind);if(target)assert(items.some(x=>x.id===target));}
  if(s.activeRole==='MANAJER'&&s.activeAssignment.area==='PEMBINAAN_KARAKTER')assert(!items.some(x=>x.label==='Kontrol Hari Ini'));
  if(s.activeRole==='DIREKTUR')assert(!R.can('DIREKTUR','menu-nilai',s.activeAssignment));
  if(s.activeRole==='SUPERVISOR'){
    assert.equal(items.some(x=>x.label==='Review Izin Santri'),N.canAccessRoute(s,'supervisor/review-izin-santri.html').ok);
    assert.equal(items.some(x=>x.id==='menu-kontrol-publikasi-rapor'),R.canManageTahsinLevels(s.activeRole,s.activeAssignment));
  }
  results.push({role:fixture.name,visible:items.length,blocked:M.audit(s).filter(x=>x.status==='BLOCKED').map(x=>x.label)});
}
const mentor=R.resolveSession(profile('MENTOR_USRAH'));
assert(!N.canAccessRoute(mentor,'pembinaan/mentoring-individu.html').ok);
const noAssignment=R.resolveSession(profile('MENTOR_USRAH',{usrahIds:[]}));assert(!N.canAccessRoute(noAssignment,'pembinaan/mentor-usrah-v2.html').ok);
const teacher=R.resolveSession(profile('GURU_PONDOK'));
assert.equal(M.resolve(teacher,'menu-nilai','admin/users.html'),null,'forged route not silently accepted');
for(const f of ['main-dashboard.html','js/role-menu-v2.js','js/role-system-v2.js','js/role-navigation-v2.js','js/role-route-registry-v2.js','role-workspace.html','js/role-guide-v2.js','js/naqib-home-hub.js','css/cahaya-ui-v2.css'])assert.equal(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),fs.readFileSync(path.join(__dirname,'../docs',f),'utf8'),'mirror: '+f);
console.log(JSON.stringify({links,results},null,2));
