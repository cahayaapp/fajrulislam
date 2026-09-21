// Mechanical cache-version bump + required root/docs mirror, no business transforms.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','docs','node_modules','tests','.codex'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))files.push(p)}}
walk(root);const entries=[];
for(const p of files){const old=fs.readFileSync(p,'utf8');if(!old.includes('role-entry-v2.js'))continue;const next=old.replace(/role-entry-v2\.js\?v=[^"'\s]+/g,'role-entry-v2.js?v=265');if(next!==old)fs.writeFileSync(p,next);const relative=path.relative(root,p);entries.push(relative);const mirror=path.join(root,'docs',relative);if(fs.existsSync(mirror))fs.writeFileSync(mirror,next)}
const shared=['css/cahaya-ui-v2.css','css/mobile-home-v2.css','css/cahaya-feature-theme-v264.css','js/cahaya-ui-v2.js','js/mobile-home-v2.js','js/role-entry-v2.js','js/role-route-registry-v2.js','js/wali-mentoring-model-v2.js','wali/dashboard/mentoring-pekanan.js','js/manager-character-home-v2.js','main-dashboard.html'];
for(const p of shared)fs.copyFileSync(path.join(root,p),path.join(root,'docs',p));
console.log(`UI entry version synchronized: ${entries.length} pages. Shared production mirrors: ${shared.length}.`);
