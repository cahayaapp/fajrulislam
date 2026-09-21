// Read-only audit generator; emits JSON for review/apply_patch, never writes.
const fs=require('node:fs'),path=require('node:path');
const R=require('../js/role-system-v2.js'),N=require('../js/role-navigation-v2.js');
const root=path.resolve(__dirname,'..'),plan=require('./role-v2-confirmed-plan.json');
const walk=d=>fs.readdirSync(path.join(root,d),{withFileTypes:true}).flatMap(x=>{
 if(['docs','.git','node_modules','.agents','.codex','migration-export','tests'].includes(x.name)||x.name.startsWith('.'))return [];
 const p=path.posix.join(d,x.name);return x.isDirectory()?walk(p):p.endsWith('.html')?[p]:[];
});
function sources(file,seen=new Set()){
 if(seen.has(file)||!fs.existsSync(path.join(root,file)))return [];
 seen.add(file);const text=fs.readFileSync(path.join(root,file),'utf8'),out=[{file,text}];
 for(const m of text.matchAll(/<script[^>]*src=["']([^"']+)["']/g)){
  if(/^(https?:|\/\/)/.test(m[1])||/role-(system|navigation|scope|entry|route-registry)-v2/.test(m[1]))continue;
  const p=path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1].split('?')[0]));if(!p.startsWith('../'))out.push(...sources(p,seen));
 }return out;
}
function refs(file){return [...new Set(sources(file).flatMap(s=>[...s.text.matchAll(/["'`]((?:cahaya_app|observasi_lapangan|kalender_materi_pembelajaran|kalender_pendidikan)(?:\/[^"'`\s<>]*)?)["'`]/g)].map(m=>m[1])))].sort()}
const readyPolicies=new Set(['home','workspace','shell','wali','mentor-usrah','naqib-report']);
const files=walk('').filter(f=>!['index.html','404.html','role-access-denied.html'].includes(f)).sort();
const rows=files.map(file=>{
 const e=N.routes[file],policy=e?.policy||'unregistered';
 const status=readyPolicies.has(policy)?'A':['teacher','program-attendance','strategic','division','naqib-journal','naqib-initiative'].includes(policy)?'B':['scoped','counselor-queue-pending','naqib-assessment-pending'].includes(policy)?'C':'D';
 const roles=e?.roles||R.ROLE_IDS.filter(r=>e?.menus?.some(m=>R.ROLE_PERMISSIONS[r].includes(m)));
 return {file,status,policy,roles,menus:e?.menus||[],paths:refs(file)};
});
const accounts=plan.profiles.map(p=>({account:p.documentId,defaultRole:p.patch.defaultRole,roles:p.patch.roles.map(role=>{
 const s=R.switchRole(R.resolveSession({...p.patch,username:p.documentId}),role).session;
 const granted=[],denied=[],pending=[];
 for(const [url,e] of Object.entries(N.routes)){
  const target=e.policy==='division'?url+'?division=pendidikan':url;
  const verdict=N.canAccessRoute(s,target);
  if(verdict.ok)granted.push(target);
  else if(['ASSIGNMENT_ADAPTER_REQUIRED','INCOMPLETE_ASSIGNMENT'].includes(verdict.reason)&&e.menus.some(m=>R.can(role,m,s.activeAssignment)))pending.push(target+' ('+verdict.reason+')');
  else denied.push(target);
 }return {role,assignment:p.patch.assignments[role],granted,pending,denied};
})}));
console.log(JSON.stringify({rows,accounts}));
