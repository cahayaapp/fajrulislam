const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const presentation=fs.readFileSync(path.join(root,'js/cahaya-ui-v2.js'),'utf8');
assert(!/\b(?:fetch|XMLHttpRequest|setInterval)\s*\(/.test(presentation),'presentation must not fetch or poll');
assert(!/localStorage\.(?:setItem|removeItem)|firebase\.|getDatabase\(/.test(presentation),'presentation must not mutate session or data');
for(const file of ['css/cahaya-ui-v2.css','css/cahaya-feature-theme-v264.css','js/cahaya-ui-v2.js','js/role-entry-v2.js','main-dashboard.html','js/manager-character-home-v2.js','admin/admin_media.html','js/mobile-home-v2.js','js/wali-mentoring-model-v2.js','wali/dashboard/mentoring-pekanan.html','wali/dashboard/mentoring-pekanan.js'])assert.equal(fs.readFileSync(path.join(root,file),'utf8'),fs.readFileSync(path.join(root,'docs',file),'utf8'),`${file} mirror`);
const manager=fs.readFileSync(path.join(root,'js/manager-character-home-v2.js'),'utf8');
const quick=manager.split('const quick=')[1].split(';const menu=')[0],secondary=manager.split(';const menu=')[1].split(';function render')[0];
assert(quick.includes('Tindak Lanjut'));assert(!quick.includes('Kontrol Hari Ini'));assert(!secondary.includes('Tindak Lanjut'));
assert(presentation.includes('prefers-reduced-motion')||fs.readFileSync(path.join(root,'css/cahaya-ui-v2.css'),'utf8').includes('prefers-reduced-motion'));
assert(presentation.includes("path.startsWith('wali/')?'285':'274'"),'staff Home must request the refreshed mobile menu script');
assert(fs.readFileSync(path.join(root,'js/role-entry-v2.js'),'utf8').includes("location.pathname.includes('/wali/')?'269':'274'"),'entry must request the refreshed presentation loader');
const entries=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','docs','node_modules','tests','.codex'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const text=fs.readFileSync(p,'utf8');const relative=path.relative(root,p);if(text.includes('role-entry-v2.js')){assert(/role-entry-v2\.js\?v=\d+/.test(text),`${p} UI release`);if(relative==='home-konselor.html'||relative==='main-dashboard.html')assert(text.includes('role-entry-v2.js?v=274'),`${p} counselor cache release`);const mirror=path.join(root,'docs',relative);if(fs.existsSync(mirror))assert.equal(text,fs.readFileSync(mirror,'utf8'),`${relative} mirror`);entries.push(relative)}}}}
walk(root);assert(entries.length>=140);console.log(`global-ui-v2-contract: no data/session writes, no polling, exact Manager IA, ${entries.length} versioned entrypoints and mirrors OK`);
