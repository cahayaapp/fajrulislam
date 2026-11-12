const $ = id => document.getElementById(id);
const zone = 'Asia/Jakarta';
const day = date => new Date(+date + 7*3600000).toISOString().slice(0,10);
const time = new Intl.DateTimeFormat('id-ID',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const calendar = new Intl.DateTimeFormat('id-ID',{timeZone:zone,weekday:'long',day:'numeric',month:'long',year:'numeric'});
const names = {subuh:'Subuh',dzuhur:'Zuhur',ashar:'Asar',maghrib:'Magrib',isya:'Isya'};
const channels = ['Renungan','Salat','Setoran','Guru','Santri'];
const quotes = [
  'Satu ayat yang dijaga hari ini menjadi bekal untuk esok.',
  'Ilmu tumbuh saat kita berani bertanya dan tekun mengulang.',
  'Ringankan langkah temanmu. Kebaikan kecil bisa menguatkan satu usrah.',
  'Saat hafalan terasa sulit, mulai lagi dari satu ayat.',
  'Jaga niat, rapikan langkah, lalu tuntaskan yang sudah dimulai.'
];
const categories = {
  Setoran:['tahfiz',{sudah:'Sudah setoran',belum:'Belum tercatat setoran'}],
  Guru:['guru',{masuk:'Guru hadir',izin:'Guru izin',belum:'Guru belum absen'}],
  Santri:['santri',{masuk:'Santri hadir',izin:'Santri izin',sakit:'Santri sakit',alfa:'Santri alfa'}]
};
const info={Setoran:'Setoran hafalan hari ini',Guru:'Presensi mengajar hari ini',Santri:'Status KBM terakhir yang tercatat'};
const feed='https://absensi-santri-fajrul-islam-default-rtdb.firebaseio.com/cahaya_public/live_tv.json';
const prayerAPI='https://api.myquran.com/v3/sholat/jadwal/3988c7f88ebcb58c6ce932b957b6f332/';
let snapshot=null, times={}, slides=[], position=0, quoteIndex=0, paused=false, currentDay='', lastClock='', alarm='', fetching=false, sourceDown=false, nextSlide=0;
function element(tag,cls,text){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
}
function prayerInfo(date){
  const today=day(date), now=time.format(date).replace('.',':');
  const row=times[today];
  if(!row)return {};
  const next=Object.keys(names).find(key=>row[key]>now);
  if(next)return {next,at:row[next],row};
  return {next:'subuh',at:times[day(new Date(+date+86400000))]?.subuh,row,tomorrow:true};
}
function build(){
  const old=slides[position];
  const pages=[{channel:'Renungan'},{channel:'Salat'}];
  const size=innerWidth<=650?8:12;
  for(const [channel,[section,labels]] of Object.entries(categories)){
    if(!snapshot){pages.push({channel});continue;}
    for(const [key,title] of Object.entries(labels)){
      const list=snapshot[section]?.[key]||[];
      for(let start=0;start<Math.max(1,list.length);start+=size)
        pages.push({channel,key,title,list,start,size});
    }
  }
  slides=pages;
  position=Math.max(0,slides.findIndex(s=>s.channel===old?.channel&&s.key===old?.key&&s.start===old?.start));
  paint();
}
function paint(){
  const s=slides[position];if(!s)return;
  const scene=element('article','scene'), heading=(text)=>scene.append(element('h1','',text));
  const description=(text)=>scene.append(element('p','meta',text));
  scene.append(element('p','kicker',s.channel==='Renungan'?'Renungan hari ini':s.channel==='Salat'?'Kabupaten Belitung':info[s.channel]));
  if(s.channel==='Renungan'){
    scene.classList.add('quote');heading(quotes[quoteIndex%quotes.length]);scene.append(element('div','rule'));
  }else if(s.channel==='Salat'){
    const p=prayerInfo(new Date());
    heading(p.next?'Menjelang '+names[p.next]:'Jadwal salat');
    if(p.at)scene.append(element('strong','big-time',p.at+' WIB'));
    description(p.next?(p.tomorrow?'Subuh berikutnya · besok':'Waktu salat berikutnya'):'Menunggu jadwal Belitung hari ini.');
  }else if(!snapshot){
    heading(s.channel==='Setoran'?'Setoran tahfiz':'Presensi '+s.channel.toLowerCase());
    description(sourceDown?'Koneksi ringkasan belum tersedia. Layar akan mencoba lagi.':'Menunggu ringkasan hari ini.');
  }else{
    heading(s.title);
    const count=s.list.length, stamp=time.format(new Date(snapshot.updatedAt));
    const hours=(Date.now()-Date.parse(snapshot.updatedAt))/3600000;
    const status=sourceDown||hours>1.25?'Pembaruan tertunda · data pukul ':'Data pukul ';
    const page=count>s.size?' · Halaman '+(s.start/s.size+1)+'/'+Math.ceil(count/s.size):'';
    description(count+' orang · '+status+stamp+' WIB'+page);
    if(count){
      const grid=element('div','names');
      s.list.slice(s.start,s.start+s.size).forEach((n,i)=>{
        const label=element('div','person',n);label.style.setProperty('--i',i);grid.append(label);
      });
      scene.append(grid);
    }else description('Belum ada nama pada kategori ini.');
  }
  $('stage').replaceChildren(scene);
  for(const button of $('channels').children){
    if(button.textContent===s.channel)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
  }
  nextSlide=Date.now()+ (s.list?.length?13000:9000);
}
function advance(step=1){
  position=(position+step+slides.length)%slides.length;
  if(slides[position].channel==='Renungan')quoteIndex++;
  paint();
}
async function json(url){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const r=await fetch(url,{signal:controller.signal,cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}
  finally{clearTimeout(timer);}
}
async function updateFeed(){
  if(fetching)return;
  fetching=true;
  try{
    const data=await json(feed);
    snapshot=data?.date===day(new Date())&&Number.isFinite(Date.parse(data.updatedAt))?data:null;
    sourceDown=false;
  }catch{sourceDown=true;}
  finally{fetching=false;build();}
}
async function updatePrayer(){
  const date=day(new Date());
  if(!times[date])try{Object.assign(times,await json('./jadwal-belitung.json'));}catch{}
  const tomorrow=day(new Date(Date.now()+86400000));
  const missing=new Set([date,tomorrow].filter(d=>!times[d]).map(d=>d.slice(0,7)));
  for(const month of missing){
    try{const d=await json(prayerAPI+month);Object.assign(times,d.data.jadwal);}catch{}
  }
  alarm='';tick();
}
function tick(){
  const now=new Date(), d=day(now), t=time.format(now);
  if(d!==currentDay){
    currentDay=d;snapshot=null;
    $('date').textContent=calendar.format(now);
    build();updateFeed();updatePrayer();
  }
  if(lastClock!==t){lastClock=t;$('clock').textContent=t;}
  const p=prayerInfo(now), signature=d+JSON.stringify(p);
  if(alarm!==signature){
    alarm=signature;
    $('prayers').replaceChildren(...Object.entries(names).map(([k,label])=>{
      const item=element('div','prayer'+(p.next===k&&!p.tomorrow?' active':''));
      item.append(element('small','',label),element('strong','',p.row?.[k]||'—'));return item;
    }));
    if(slides[position]?.channel==='Salat')paint();
  }
  if(!paused&&Date.now()>=nextSlide)advance();
}
function togglePause(){
  paused=!paused;document.body.classList.toggle('paused',paused);
  const b=$('pause');b.textContent=paused?'▶':'Ⅱ';b.title=paused?'Lanjutkan tayangan':'Jeda tayangan';
  b.setAttribute('aria-label',b.title);nextSlide=Date.now()+10000;
}
for(const channel of channels){
  const b=element('button','',channel);b.onclick=()=>{position=slides.findIndex(s=>s.channel===channel);paint();};$('channels').append(b);
}
$('next').onclick=()=>advance();$('pause').onclick=togglePause;
$('full').hidden=!document.fullscreenEnabled;
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}};
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight')advance();
  if(e.key==='ArrowLeft')advance(-1);
  if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();togglePause();}
});
window.matchMedia('(max-width:650px)').addEventListener('change',build);
tick();setInterval(tick,1000);setInterval(updateFeed,300000);setInterval(updatePrayer,3600000);
