// Offline deterministic startup audit. No SDK, network, or production writes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('home-naqib.html','utf8');
const source=fs.readFileSync('js/naqib-home-hub.js','utf8');
const shell=fs.readFileSync('main-dashboard.html','utf8');
assert(!/firebase|onValue|\.once\(|\bfetch\s*\(|XMLHttpRequest/i.test(html+source),'Home must not own operational network code');
assert.equal((html.match(/id="menuGrid"/g)||[]).length,1);
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',classList:{add(){},remove(){}},setAttribute(){},replaceChildren(){}});return elements.get(id)}
const profile={username:'khaizuran',nama:'Khaizuran'};
const localStorage={getItem:key=>key==='cahayaCurrentUser'?JSON.stringify(profile):key==='cahayaActiveRole'?'naqib':null};
const opened=[];
const parent={postMessage(){},openAuthorizedMenu(id){opened.push(id)},openCahayaGlobalRoleModal(){}};
const window={parent,addEventListener(){}};
const context={window,document:{getElementById:element},localStorage,location:{origin:'http://127.0.0.1:4173'},console,Date,Intl,Image:function(){this.onerror=null},clearTimeout,URLSearchParams};
vm.createContext(context);vm.runInContext(source,context);
assert.equal(element('userName').textContent,'Khaizuran');
assert.equal((html.match(/class="quick(?: [^"]+)?"/g)||[]).length,4);
for(const title of ['Absensi Program','Laporan Pelaksanaan','Catat Inisiatif Santri','Naqib Teladan'])assert(html.includes(title));
for(const title of ['Asesmen CAHAYA Santri','Self Asesmen Naqib','Lapor Kasus / Pelanggaran','Skor Kedisiplinan','Riwayat Laporan','Riwayat Absensi','Panduan Kerja'])assert(element('menuGrid').innerHTML.includes(title));
for(const duplicate of ['Program Hari Ini','Absensi Program','Laporan Pelaksanaan','Catat Inisiatif Santri','KPI Naqib'])assert(!element('menuGrid').innerHTML.includes(duplicate));
assert.equal((element('menuGrid').innerHTML.match(/class="menu-card/g)||[]).length,7);
assert(!/Tangani|Beri Hukuman|Selesaikan Kasus|Tutup Kasus/.test(html+element('menuGrid').innerHTML));
context.window.openMenu('menu-gamifikasi');
assert.deepEqual(opened,['menu-gamifikasi']);
assert(shell.includes("NAQIB: {jadwal:['menu-dashboard-operasional']"));
assert.equal((shell.match(/id="mobileBottomNav"/g)||[]).length,1,'shell owns exactly one bottom nav');
console.log('PASS Naqib Home local identity, static routes, role boundary, zero operational network');
