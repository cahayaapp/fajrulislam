const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=require('../js/admin-master-v2-core.js'),source=fs.readFileSync('js/admin-master-v2.js','utf8');
const ids=['scheduleStats','scheduleClass','scheduleSearch','scheduleCount','scheduleDays','downloadSchedule'];
const nodes=Object.fromEntries(ids.map(id=>[id,{value:'',textContent:'↓ Download PNG',innerHTML:'',disabled:false}]));
let drawn=[],downloads=[],messages=[],blobFails=false;
const ctx2={translate(){},clip(){},scale(){},beginPath(){},roundRect(){},fill(){},save(){},restore(){},arc(){},stroke(){},createLinearGradient:()=>({addColorStop(){}}),font:'',measureText:text=>({width:String(text).length*(parseInt(ctx2.font)||14)*.55}),fillText:(text,x,y)=>drawn.push({text,x,y,font:ctx2.font}),fillRect(){},strokeRect(){}};
const canvas={width:0,height:0,getContext:()=>ctx2,toBlob:callback=>callback(blobFails?null:{})};
const state={users:[],schedule:[{kelas:'Kelas 1 Putra',hari:1,mapel:'Bahasa Arab',guruNama:'Guru Satu',jamMulai:'05:10',tahunAjaran:'2026/2027'},{kelas:'Kelas 2 Putra',hari:2,mapel:'Hadits',guruNama:'Muhammad Zawawi',jamMulai:'09:20',tahunAjaran:'2026/2027'},{kelas:'Kelas 1 Putri',hari:3,mapel:'Adab',guruNama:'Guru Putri',jamMulai:'09:20',tahunAjaran:'2026/2027'}]};
const context={Path2D:class {constructor(path){this.path=path}},C,state,window:{CAHAYA_CONFIG:{app:{institutionName:'Pesantren Cahaya Fajrul Islam'}}},$:id=>nodes[id],stat:()=>'',options:()=>'',document:{fonts:{ready:Promise.resolve()},createElement:tag=>tag==='canvas'?canvas:{click(){downloads.push(this.download)},remove(){}},body:{appendChild(){}}},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){},toast:message=>messages.push(message)};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('const SCHEDULE_DAYS='),source.indexOf('function renderPrograms()')),context);
const render=()=>vm.runInContext('renderSchedule()',context);
const texts=()=>drawn.map(item=>item.text).join('\n');
async function download(args){drawn=[];await context.downloadSchedule(args);assert(drawn.every(item=>item.x>=0&&item.y<canvas.height),'All text inside image height');}
(async()=>{
 render();assert(nodes.scheduleDays.innerHTML.includes('data-download-class="Kelas 1 Putra"'));assert(nodes.scheduleDays.innerHTML.includes('data-download-group="Putri"'));
 const button={textContent:'↓',disabled:false};await download({kelas:'Kelas 2 Putra',group:'Putra',button});
 assert(texts().includes('Muhammad Zawawi'));assert(!texts().includes('Guru Putri'));assert(!texts().includes('Guru Satu'));assert(texts().includes('JADWAL PELAJARAN'));assert(texts().includes('Pesantren Cahaya Fajrul Islam'));assert(texts().includes('2026/2027'));assert(texts().includes('Diunduh dari CAHAYA APP pada'));assert(texts().includes('WIB.'));assert(downloads.at(-1).includes('kelas-2-putra'));assert.equal(button.textContent,'↓');assert.equal(button.disabled,false);
 await download({group:'Putra',button});assert(texts().includes('Guru Satu'));assert(texts().includes('Muhammad Zawawi'));assert(!texts().includes('Guru Putri'));
 await download();assert(texts().includes('Guru Putri'));
 nodes.scheduleSearch.value='Hadits';await download({group:'Putra',button});assert(texts().includes('Hasil pencarian: Hadits'));assert(!texts().includes('Guru Satu'));
 nodes.scheduleSearch.value='';state.schedule[0].guruNama='Nama panjang '.repeat(60);await download({kelas:'Kelas 1 Putra',button});assert(drawn.filter(item=>item.font==='15px sans-serif').length>3,'Long teacher name wraps');
 blobFails=true;const count=downloads.length;await download({kelas:'Kelas 2 Putra',button});assert.equal(downloads.length,count);assert.equal(button.disabled,false);assert(messages.at(-1).includes('Gambar gagal'));
 console.log('PASS per-class/group/all exports, filters, institution/year header, WIB footer, long names, bounds and failure recovery');
})().catch(error=>{console.error(error);process.exitCode=1});
