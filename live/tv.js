import {attendanceBoards} from './attendance.mjs';
import {standings} from '../js/usrah-ranking.mjs';
const $ = id => document.getElementById(id);
const zone = 'Asia/Jakarta';
const day = date => new Date(+date + 7*3600000).toISOString().slice(0,10);
const time = new Intl.DateTimeFormat('id-ID',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const calendar = new Intl.DateTimeFormat('id-ID',{timeZone:zone,weekday:'long',day:'numeric',month:'long',year:'numeric'});
const names = {subuh:'Subuh',dzuhur:'Zuhur',ashar:'Asar',maghrib:'Magrib',isya:'Isya'};
const channels = ['Renungan','Salat','Setoran','Guru','Santri','Program','Konselor'];
const quotes = [
  'Satu ayat yang dijaga hari ini menjadi bekal untuk esok.',
  'Ilmu tumbuh saat kita berani bertanya dan tekun mengulang.',
  'Ringankan langkah temanmu. Kebaikan kecil bisa menguatkan satu usrah.',
  'Saat hafalan terasa sulit, mulai lagi dari satu ayat.',
  'Jaga niat, rapikan langkah, lalu tuntaskan yang sudah dimulai.'
];
const unit=document.documentElement.dataset.unit;
const counselor=unit==='putra'?{muda:'Abi Dandi',madya:'Abi Dony'}:{muda:'Kak Meilisa',madya:'Umi Dini'};
const categories = {
  Setoran:['tahfiz',{sudah:'Sudah setoran',belum:'Belum tercatat setoran'}],
  Guru:['guru',{masuk:'Guru hadir',izin:'Guru izin',belum:'Guru belum absen'}],
  Konselor:['konselor',{muda:'Menghadap '+counselor.muda,madya:'Menghadap '+counselor.madya}],
  Santri:['santri',{masuk:'Santri hadir',izin:'Santri izin',sakit:'Santri sakit',alfa:'Santri alfa'}]
};
const info={Program:'Kehadiran program · Absensi naqib',Konselor:'Panggilan konselor hari ini',Setoran:'Peserta Tahfiz · Setoran hari ini',Guru:'Jadwal mengajar · Rekap guru hari ini',Santri:'Absensi pembelajaran · Sesi KBM hari ini'};
const populations={Program:'santri yang diabsen pada program ini',Setoran:'peserta Tahfiz',Guru:'guru dalam rekap',Santri:'santri dengan presensi tercatat',Konselor:'santri yang dipanggil'};
const percent=new Intl.NumberFormat('id-ID',{style:'percent',maximumFractionDigits:1});
const competition = 'Usrah Bersih';
let ranking = null, rankingDown = false;

if(unit==='putra') channels.splice(2,0,competition);
const feed=`https://absensi-santri-fajrul-islam-default-rtdb.firebaseio.com/cahaya_public/live_tv/${unit}.json`;
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
const prayerLeadMinutes=10, quietPrayerMinutes=20;
let activePrayerScreen='';
const soundButton=$('prayer-sound');
const preferenceKey='cahaya.live.prayerSound.'+unit;
const announcedKey=preferenceKey+'.last';
const speaker=new Audio();
speaker.preload='none';
let soundEnabled=false, lastAnnouncement='', playbackBlocked=false, playbackId=0;
try{
  soundEnabled=localStorage.getItem(preferenceKey)==='on';
  lastAnnouncement=sessionStorage.getItem(announcedKey)||'';
}catch{}
function showSoundState(){
  soundButton.setAttribute('aria-pressed',String(soundEnabled));
  soundButton.textContent=playbackBlocked?'Izinkan suara':soundEnabled?'Suara aktif':'Aktifkan suara';
}
function stopSound(){
  playbackId++;
  speaker.onended=null;
  speaker.onerror=null;
  speaker.pause();
}
function playClips(clips,eventKey){
  stopSound();
  const id=playbackId;
  function failed(){
    if(id!==playbackId)return;
    stopSound();
    if(eventKey)lastAnnouncement='';
    playbackBlocked=true;
    showSoundState();
  }
  function next(){
    if(id!==playbackId)return;
    const clip=clips.shift();
    if(clip===undefined){
      if(eventKey)try{sessionStorage.setItem(announcedKey,eventKey)}catch{}
      return;
    }
    speaker.src=new URL('audio/'+unit+'/'+clip+'.mp3',document.baseURI).href;
    speaker.onended=next;
    speaker.onerror=failed;
    speaker.play().catch(failed);
  }
  next();
}
showSoundState();
soundButton.onclick=()=>{
  soundEnabled=playbackBlocked || !soundEnabled;
  playbackBlocked=false;
  try{localStorage.setItem(preferenceKey,soundEnabled?'on':'off')}catch{}
  stopSound();
  showSoundState();
  if(soundEnabled){
    const now=new Date(), previous=lastAnnouncement;
    updatePrayerScreen(now,times[day(now)]);
    if(previous===lastAnnouncement && document.body.dataset.prayerMode!=='quiet')playClips(['aktif']);
  }
};

function updatePrayerScreen(date, row){
  let mode='', label='', at='', remaining=0;
  for(const [key,prayer] of Object.entries(names)){
    const scheduled=row?.[key];
    if(!/^\d{2}:\d{2}$/.test(scheduled))continue;
    const elapsed=(date-Date.parse(day(date)+'T'+scheduled+':00+07:00'))/60000;
    if(elapsed>=-prayerLeadMinutes && elapsed<quietPrayerMinutes){
      mode=elapsed<0?'approaching':'quiet';
      label=prayer;at=scheduled;remaining=Math.ceil(-elapsed*60);break;
    }
  }
  const signature=mode?mode+' '+label+' '+at:'';
  if(signature!==activePrayerScreen){
    activePrayerScreen=signature;
    const panel=$('prayer-screen');
    document.body.dataset.prayerMode=mode;
    panel.hidden=!mode;
    if(mode==='quiet')stopSound();
    if(!mode){paint();return;}
    panel.replaceChildren(element('h1','',mode==='quiet'?'Waktunya salat '+label:'Menjelang waktu salat '+label));
    if(mode==='approaching'){
      panel.prepend(element('p','kicker',label+' · '+at+' WIB'));
      const timer=element('strong','prayer-countdown');
      timer.id='prayer-countdown';
      timer.setAttribute('role','timer');
      timer.setAttribute('aria-live','off');
      timer.setAttribute('aria-label','Waktu tersisa sebelum salat');
      panel.append(timer,element('p','prayer-invitation','Semua santri, mari segera bergegas ke masjid.'));
    }
  }
  if(mode==='approaching'){
    const eventKey=day(date)+' '+label;
    if(soundEnabled && !playbackBlocked && lastAnnouncement!==eventKey && !document.hidden){
      lastAnnouncement=eventKey;
      playClips([label.toLowerCase(),remaining<60?0:Math.ceil(remaining/60)],eventKey);
    }
    const minutes=String(Math.floor(remaining/60)).padStart(2,'0');
    const seconds=String(remaining%60).padStart(2,'0');
    $('prayer-countdown').textContent=minutes+':'+seconds;
  }
}
function build(){
  const old=slides[position];
  const pages=[{channel:'Renungan'},{channel:'Salat'}];
  if(unit==='putra')pages.push({channel:competition});
  const size=innerWidth<=650?8:12;
  for(const [channel,[section,labels]] of Object.entries(categories)){
    if(channel==='Santri')continue;
    if(!snapshot){pages.push({channel});continue;}
    const total=new Set(Object.keys(labels).flatMap(key=>snapshot[section]?.[key]||[])).size;
    for(const [key,title] of Object.entries(labels)){
      const list=snapshot[section]?.[key]||[];
      const pageSize=channel==='Konselor'?5:size;
      for(let start=0;start<Math.max(1,list.length);start+=pageSize)
        pages.push({channel,key,title,list,start,size:pageSize,total});
    }
  }
  for(const channel of ['Santri','Program']){
    const boards=attendanceBoards(snapshot?.presensi,channel==='Santri'?'kbm':'program');
    if(!boards.length)pages.push({channel,emptySessions:true});
    for(const board of boards)pages.push({channel,board,id:board.id});
  }
  prepareNotice();
  slides=pages;
  position=Math.max(0,slides.findIndex(s=>s.channel===old?.channel&&s.id===old?.id&&s.key===old?.key&&s.title===old?.title&&s.start===old?.start));
  paint();
}
function paint(){
  const s=slides[position];if(!s)return;
  const scene=element('article','scene'), heading=(text)=>scene.append(element('h1','',text));
  const description=(text)=>scene.append(element('p','meta',text));
  scene.append(element('p','kicker',s.channel==='Renungan'?'Renungan hari ini':s.channel==='Salat'?'Kabupaten Belitung':s.channel===competition?'Lomba Usrah Bersih · 11–21 November 2026':info[s.channel]));
  if(s.channel==='Renungan'){
    scene.classList.add('quote');heading(quotes[quoteIndex%quotes.length]);scene.append(element('div','rule'));
  }else if(s.channel==='Salat'){
    const p=prayerInfo(new Date());
    heading(p.next?'Menjelang '+names[p.next]:'Jadwal salat');
    if(p.at)scene.append(element('strong','big-time',p.at+' WIB'));
    description(p.next?(p.tomorrow?'Subuh berikutnya · besok':'Waktu salat berikutnya'):'Menunggu jadwal Belitung hari ini.');
  }else if(s.channel===competition){
    heading('Peringkat sementara');
    if(rankingDown || !ranking || !ranking.sessions)
      description(rankingDown?'Pembaruan peringkat tertunda.':ranking?'Belum ada sesi yang dinilai.':'Memuat peringkat.');
    const chart=element('ol','rank-chart');
    chart.setAttribute('aria-label','Urutan Usrah Bersih');
    for(const {usrah,rank} of ranking?.rows??Array.from({length:6},(_,i)=>({usrah:i+1}))){
      const row=element('li','rank-row');
      row.append(element('strong','rank-number',rank?'#'+rank:'—'),element('span','','Usrah '+usrah));
      const track=element('span','rank-track'),bar=element('span','rank-bar');
      bar.style.width=(rank?(7-rank)/6*100:0)+'%';
      track.append(bar);row.append(track);chart.append(row);
    }
    scene.append(chart);
  }else if(s.board){
    const {title,slot,subjects,groups,total}=s.board;
    heading([title,slot].filter(Boolean).join(' · '));
    description([...subjects,total+' santri tercatat'].join(' · '));
    const chart=element('div','attendance-chart');
    for(const [key,label] of Object.entries({hadir:'Hadir',izin:'Izin',alfa:'Alfa',sakit:'Sakit'})){
      const people=groups[key],count=key==='hadir'?people:people.length;
      const ratio=total?count/total:0;
      const card=element('div','att-card att-'+key);
      card.append(element('span','att-label',label),element('strong','att-share',total?percent.format(ratio):'—'));
      const track=element('div','att-track'),bar=element('i');
      bar.style.width=(100*ratio)+'%';track.append(bar);card.append(track);
      chart.append(card);
    }
    scene.append(chart);
    for(const [key,label] of [['izin','Izin'],['alfa','Alfa'],['sakit','Sakit']]){
      if(!groups[key].length)continue;
      const line=element('div','att-names');
      line.append(element('b','',label+' ('+groups[key].length+')'),element('span','',groups[key].join(' · ')));
      scene.append(line);
    }
    if(groups.belum)description(groups.belum+' santri belum dikonfirmasi · '+percent.format(groups.belum/total));
  }else if(s.emptySessions){
    heading(s.channel==='Program'?'Kehadiran program naqib':'Kehadiran KBM');
    description(!snapshot?'Menunggu ringkasan hari ini.':'Belum ada sesi yang tercatat hari ini.');
  }else if(!snapshot){
    heading(s.channel==='Setoran'?'Setoran tahfiz':s.channel==='Konselor'?'Panggilan konselor':'Presensi '+s.channel.toLowerCase());
    scene.append(element('strong','share','Persentase —'));
    description(sourceDown?'Koneksi ringkasan belum tersedia. Layar akan mencoba lagi.':'Menunggu ringkasan hari ini.');
  }else{
    const titles={Santri:{masuk:'Hadir di kelas',izin:'Izin belajar',sakit:'Sakit saat KBM',alfa:'Alfa saat KBM'},
      Guru:{masuk:'Guru hadir mengajar',izin:'Guru izin mengajar',belum:'Guru belum absen mengajar'}};
    heading(s.id?s.title:titles[s.channel]?.[s.key]??s.title);
    if(s.id)description([s.context,s.status].filter(Boolean).join(' · '));
    if(s.channel==='Guru'){
      const details={masuk:'Sudah tercatat hadir mengajar setidaknya sekali hari ini.',
        izin:'Izin atau berhalangan mengajar hari ini, tanpa catatan hadir.',
        belum:'Jadwal mengajar sudah mulai, presensi dan izin belum tercatat.'};
      description(details[s.key]);
    }
    const count=s.list.length, stamp=time.format(new Date(snapshot.updatedAt));
    const hours=(Date.now()-Date.parse(snapshot.updatedAt))/3600000;
    const status=sourceDown||hours>1.25?'Pembaruan tertunda · data pukul ':'Data pukul ';
    const page=count>s.size?' · Halaman '+(s.start/s.size+1)+'/'+Math.ceil(count/s.size):'';
    const summary=element('p','meta');
    if(s.total){
      summary.append(element('strong','share','Persentase '+percent.format(count/s.total)),
        document.createTextNode(' · '+count+' dari '+s.total+' '+populations[s.channel]));
    }else{
      summary.append(element('strong','share','Persentase —'),document.createTextNode(' · 0 '+populations[s.channel]));
    }
    summary.append(document.createTextNode(' · '+status+stamp+' WIB'+page));
    const showLines=s.channel==='Setoran'&&s.key==='sudah';
    const lines=showLines?snapshot.tahfiz?.baris:null;
    if(showLines){
      const known=(lines??[]).filter(value=>Number.isFinite(value)&&value>=0);
      const total=known.length?known.reduce((sum,value)=>sum+value,0):count?'—':0;
      summary.append(document.createTextNode(' · '+total+' baris tercatat hari ini'));
    }
    scene.append(summary);
    if(count){
      const grid=element('div','names');
      s.list.slice(s.start,s.start+s.size).forEach((n,i)=>{
        const label=element('div','person',n);
        if(s.channel==='Santri'&&!s.id){
          const ref=snapshot.kbm?.byStatus?.[s.key]?.[s.start+i];
          const lesson=snapshot.kbm?.labels?.[ref];
          label.append(element('small','line-count',lesson||'Rincian pelajaran belum tersedia'));
        }
        if(showLines){
          const value=lines?.[s.start+i];
          label.append(element('small','line-count',Number.isFinite(value)&&value>=0?value+' baris':'Baris belum tercatat'));
        }
        label.style.setProperty('--i',i);grid.append(label);
      });
      scene.append(grid);
    }else description('Belum ada nama pada kategori ini.');
  }
  $('stage').replaceChildren(scene);
  $('channel-picker').value=s.channel;
  fitScene();
  for(const button of $('channels').children){
    if(button.textContent===s.channel)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
  }
  nextSlide=Date.now()+ (s.board?18000:s.list?.length?13000:9000);
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
async function updateRanking(){
  try{
    const url='https://firestore.googleapis.com/v1/projects/absensi-santri-fajrul-islam/databases/(default)/documents/usrah_bersih_202611/rekap';
    const fields=(await json(url)).fields;
    const sessions=Number(fields.sessions.integerValue);
    const sums=fields.sums.arrayValue.values.map(v=>Number(v.integerValue));
    ranking={sessions,rows:standings({sessions,sums})};
    rankingDown=false;
  }catch{rankingDown=true;}
  if(slides[position]?.channel===competition)paint();
}
async function updateFeed(){
  if(fetching)return;
  fetching=true;
  try{
    const data=await json(feed);
    snapshot=data?.unit===unit&&data.date===day(new Date())&&Number.isFinite(Date.parse(data.updatedAt))?data:null;
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
let noticeEntries=[], noticePage=-1;
function prepareNotice(){
  const calls=new Map();
  for(const level of ['muda','madya'])for(const n of snapshot?.konselor?.[level]||[])calls.set(n,level);
  noticeEntries=[...calls].map(([n,level])=>({n,level}));
  noticePage=-1;
  updateNotice();
}
function updateNotice(){
  const banner=$('counselor-notice');
  if(!banner)return;
  banner.hidden=!noticeEntries.length;
  if(banner.hidden)return;
  const pages=Math.ceil(noticeEntries.length/5),page=Math.floor(Date.now()/10000)%pages;
  if(page===noticePage)return;
  noticePage=page;
  const head=element('div','notice-head');
  head.append(element('strong','notice-label','Panggilan konselor'));
  if(pages>1)head.append(element('small','','Kelompok '+(page+1)+' / '+pages));
  const cards=element('div','notice-cards');
  for(const {n,level} of noticeEntries.slice(page*5,page*5+5)){
    const card=element('div','notice-card');
    card.append(element('span','notice-name',n),element('small','notice-level','Menghadap '+counselor[level]));
    cards.append(card);
  }
  banner.replaceChildren(head,cards);
}
function tick(){
  const now=new Date(), d=day(now), t=time.format(now);
  if(d!==currentDay){
    currentDay=d;snapshot=null;
    $('date').textContent=calendar.format(now);
    build();updateFeed();updatePrayer();
  }
  if(document.body.dataset.prayerMode!=='quiet')updateNotice();
  if(lastClock!==t){lastClock=t;$('clock').textContent=t;}
  const p=prayerInfo(now), signature=d+JSON.stringify(p);
  updatePrayerScreen(now,p.row);
  if(alarm!==signature){
    alarm=signature;
    $('prayers').replaceChildren(...Object.entries(names).map(([k,label])=>{
      const item=element('div','prayer'+(p.next===k&&!p.tomorrow?' active':''));
      item.append(element('small','',label),element('strong','',p.row?.[k]||'—'));return item;
    }));
    if(slides[position]?.channel==='Salat')paint();
  }
  if(!activePrayerScreen&&!paused&&Date.now()>=nextSlide)advance();
}
function togglePause(){
  paused=!paused;document.body.classList.toggle('paused',paused);
  const b=$('pause');b.textContent=paused?'▶':'Ⅱ';b.title=paused?'Lanjutkan tayangan':'Jeda tayangan';
  b.setAttribute('aria-label',b.title);nextSlide=Date.now()+10000;
}
function fitScene(){
  const stage=$('stage'),scene=stage.firstElementChild;
  if(!scene)return;
  scene.style.zoom='';
  if(!matchMedia('(max-width:768px)').matches || !stage.clientHeight)return;
  // Zoom changes line wrapping. Find the largest size that fits this slide.
  if(scene.offsetHeight<=stage.clientHeight)return;
  let low=0,high=1;
  for(let i=0;i<9;i++){
    const scale=(low+high)/2;
    scene.style.zoom=scale;
    if(scene.offsetHeight*scale<=stage.clientHeight)low=scale;else high=scale;
  }
  scene.style.zoom=low;
}
new ResizeObserver(fitScene).observe($('stage'));
$('channel-picker').onchange=e=>{
  position=slides.findIndex(s=>s.channel===e.target.value);paint();
};
for(const channel of channels){
  $('channel-picker').add(new Option(channel,channel));
  const b=element('button','',channel);b.onclick=()=>{position=slides.findIndex(s=>s.channel===channel);paint();};$('channels').append(b);
}
$('next').onclick=()=>advance();$('pause').onclick=togglePause;
$('full').hidden=!document.fullscreenEnabled;
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}};
document.addEventListener('keydown',e=>{
  if(activePrayerScreen || e.target.tagName==='SELECT')return;
  if(e.key==='ArrowRight')advance();
  if(e.key==='ArrowLeft')advance(-1);
  if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();togglePause();}
});
window.matchMedia('(max-width:650px)').addEventListener('change',build);
tick();setInterval(tick,1000);setInterval(updateFeed,300000);setInterval(updatePrayer,3600000);

if(unit==='putra'){updateRanking();setInterval(updateRanking,300000);}
