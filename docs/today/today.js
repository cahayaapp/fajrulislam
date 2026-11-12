import {attendanceBoards} from '../live/attendance.mjs';
import {standings} from '../js/usrah-ranking.mjs';

const $=id=>document.getElementById(id);
const tabs=['Ringkasan','KBM','Program','Tahfiz','Guru','Konselor','Salat','Usrah Bersih'];
const prayers={subuh:'Subuh',dzuhur:'Zuhur',ashar:'Asar',maghrib:'Magrib',isya:'Isya'};
const today=()=>new Date(Date.now()+7*3600000).toISOString().slice(0,10);
const clock=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'});
const dateFormat=new Intl.DateTimeFormat('id-ID',{dateStyle:'full',timeZone:'Asia/Jakarta'});
const reflections=['Satu ayat yang dijaga hari ini menjadi bekal untuk esok.','Ilmu tumbuh saat kita berani bertanya dan tekun mengulang.','Ringankan langkah temanmu. Kebaikan kecil bisa menguatkan satu usrah.','Jaga niat, rapikan langkah, lalu tuntaskan yang sudah dimulai.'];
let unit='putra',tab=tabs[0],date='',data=null,ranks=null,schedule=null,loading=false,failed=false,request=0;
function node(tag,text,cls){
  const n=document.createElement(tag);
  if(text!==undefined)n.textContent=text;
  if(cls)n.className=cls;
  return n;
}
function metric(label,value){
  const card=node('div',undefined,'metric');card.append(node('small',label),node('b',value));return card;
}
function pct(count,total){return total?Math.round(100*count/total)+'%':'—'}
function group(parent,label,names,total){
  const details=node('details'),summary=node('summary',label+' · '+names.length+(total===undefined?'':' · '+pct(names.length,total)));
  details.append(summary);
  if(names.length){
    const list=node('ul');for(const name of names)list.append(node('li',name));details.append(list);
  }else details.append(node('p','Belum ada nama tercatat.','muted'));
  parent.append(details);
}
function boards(kind){return attendanceBoards(data?.presensi,kind)}
function nav(){
  $('sections').replaceChildren();
  for(const label of tabs){
    if(label==='Usrah Bersih'&&unit==='putri')continue;
    const b=node('button',label);
    if(label===tab)b.setAttribute('aria-current','page');
    b.onclick=()=>{tab=label;nav();render();$('detail').scrollTop=0};
    $('sections').append(b);
  }
}
function render(){
  $('date').textContent=dateFormat.format(new Date());
  $('stamp').textContent=loading?'Memuat data…':data?(failed?'Pembaruan tertunda · ':'Data pukul ')+clock.format(new Date(data.updatedAt))+' WIB':failed?'Ringkasan belum dapat diakses.':'Belum ada ringkasan hari ini.';
  $('refresh').disabled=loading;
  $('heading').textContent=({KBM:'Presensi sesi belajar',Program:'Presensi program naqib',Guru:'Presensi guru',Tahfiz:'Setoran santri tahfiz',Konselor:'Panggilan konselor',Salat:'Jadwal salat · Belitung',Ringkasan:'Ringkasan '+unit,'Usrah Bersih':'Peringkat sementara Usrah Bersih'})[tab];
  const box=$('content');box.replaceChildren();
  const metrics=node('div',undefined,'metrics');
  if(tab==='Salat'){
    for(const [key,label] of Object.entries(prayers))metrics.append(metric(label,schedule?.[key]??'—'));
    box.append(metrics,node('p','Waktu Indonesia Barat','muted'));return;
  }
  if(tab==='Usrah Bersih'){
    if(!ranks?.some(r=>r.rank)){box.append(node('p',ranks?'Belum ada sesi yang dinilai.':loading?'Memuat peringkat…':'Peringkat belum tersedia.'));return}
    for(const row of ranks)metrics.append(metric('Usrah '+row.usrah,'#'+row.rank));
    box.append(metrics);return;
  }
  if(tab==='Ringkasan'){
    const calls=new Set([...(data?.konselor?.muda??[]),...(data?.konselor?.madya??[])]);
    for(const [label,value] of [['Sesi belajar',boards('kbm').length],['Sesi program',boards('program').length],['Sudah setoran',data?.tahfiz?.sudah?.length],['Guru hadir',data?.guru?.masuk?.length],['Panggilan konselor',calls.size]])metrics.append(metric(label,data?value??0:'—'));
    box.append(metrics,node('blockquote',reflections[Math.floor(Date.parse(today())/86400000)%reflections.length]));return;
  }
  if(!data){box.append(node('p',$('stamp').textContent,'muted'));return}
  if(tab==='Program'||tab==='KBM'){
    const sessions=boards(tab==='KBM'?'kbm':'program');
    for(const board of sessions){
      box.append(node('h3',[board.title,board.slot].filter(Boolean).join(' · ')),node('p',[...board.subjects,board.total+' santri tercatat'].join(' · '),'muted'));
      const g=board.groups;
      box.append(metric('Hadir',g.hadir+' · '+pct(g.hadir,board.total)));
      for(const [key,label] of [['izin','Izin'],['sakit','Sakit'],['alfa','Alfa']])group(box,label,g[key],board.total);
      if(g.belum)box.append(node('small',g.belum+' belum dikonfirmasi'));
    }
    if(!sessions.length)box.append(node('p','Belum ada sesi tercatat hari ini.'));return;
  }
  if(tab==='Tahfiz'){
    const {sudah=[],belum=[],baris=[]}=data.tahfiz??{};
    const total=new Set([...sudah,...belum]).size;
    const known=baris.filter(n=>Number.isFinite(n)&&n>=0);
    box.append(metric('Total baris tercatat',known.length?known.reduce((a,b)=>a+b,0):sudah.length?'—':0));
    group(box,'Sudah setoran',sudah.map((n,i)=>n+' · '+(Number.isFinite(baris[i])&&baris[i]>=0?baris[i]+' baris':'baris belum tercatat')),total);
    group(box,'Belum setoran',belum,total);return;
  }
  const isGuru=tab==='Guru', source=(isGuru?data.guru:data.konselor)??{};
  const labels=isGuru?{masuk:'Hadir mengajar',izin:'Izin mengajar',belum:'Belum absen mengajar'}:unit==='putra'?{muda:'Abi Dandi',madya:'Abi Dony'}:{muda:'Kak Meilisa',madya:'Umi Dini'};
  const total=new Set(Object.keys(labels).flatMap(k=>source[k]??[])).size;
  for(const [key,label] of Object.entries(labels))group(box,label,source[key]??[],total);
}
async function json(url){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error(r.status);return await r.json()}finally{clearTimeout(timeout)}
}
async function prayer(d){
  if(schedule && date===d)return schedule;
  try{const row=(await json('../live/jadwal-belitung.json'))[d];if(row)return row}catch{}
  const month=await json('https://api.myquran.com/v3/sholat/jadwal/3988c7f88ebcb58c6ce932b957b6f332/'+d.slice(0,7));
  return month.data.jadwal[d];
}
async function ranking(){
  const {fields}=await json('https://firestore.googleapis.com/v1/projects/absensi-santri-fajrul-islam/databases/(default)/documents/usrah_bersih_202611/rekap');
  return standings({sessions:Number(fields.sessions.integerValue),sums:fields.sums.arrayValue.values.map(v=>Number(v.integerValue))});
}
async function refresh(){
  const id=++request,d=today();
  if(date!==d){data=null;schedule=null;ranks=null;date=d}
  loading=true;render();
  const [feed,pr,rank]=await Promise.allSettled([json('https://absensi-santri-fajrul-islam-default-rtdb.firebaseio.com/cahaya_public/live_tv/'+unit+'.json'),prayer(d),unit==='putra'?ranking():null]);
  if(id!==request)return;
  if(today()!==d){refresh();return}
  failed=feed.status==='rejected';
  if(!failed){const v=feed.value;data=v?.unit===unit&&v.date===d&&Number.isFinite(Date.parse(v.updatedAt))?v:null}
  schedule=pr.value??null;ranks=rank.value??null;loading=false;render();
}
document.querySelector('fieldset').onchange=e=>{
  unit=e.target.value;data=null;ranks=null;failed=false;
  if(unit==='putri'&&tab==='Usrah Bersih')tab='Ringkasan';
  nav();refresh();
};
$('refresh').onclick=refresh;
setInterval(()=>{if(!document.hidden&&!loading)refresh()},300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&date!==today())refresh()});
nav();refresh();
