const assert=require('node:assert/strict');
const T=require('../js/naqib-report-templates.js');
const cases=[['Shalat Berjamaah','shalat'],['Makan Siang','makan'],['Wirid Pagi','wirid'],['Halqah Al-Quran','quran'],['Piket Kebersihan','kebersihan'],['Olahraga','olahraga'],['Mandi Sore','transisi'],['Qailulah','istirahat'],['Program Baru','generic']];
for(const [name,key] of cases){const t=T.resolve(name);assert.equal(t.key,key,name);assert.equal(t.items.length,6);assert(t.items.every(x=>x.id&&x.label))}
const home=require('node:fs').readFileSync('home-naqib.html','utf8'),hub=require('node:fs').readFileSync('js/naqib-home-hub.js','utf8');
assert.equal((home.match(/class="quick(?: [^"]+)?"/g)||[]).length,4);
for(const text of ['Absensi Program','Laporan Pelaksanaan','Catat Inisiatif Santri','Naqib Teladan'])assert(home.includes(text));
for(const text of ['Asesmen CAHAYA Santri','Self Asesmen Naqib','Lapor Kasus / Pelanggaran','Skor Kedisiplinan','Riwayat Laporan','Riwayat Absensi','Panduan Kerja'])assert(hub.includes(text));
for(const text of ["['Program Santri'","['KPI Naqib'"])assert(!hub.includes(text));
console.log('PASS exact Home IA and 9 per-program observation template resolutions');
