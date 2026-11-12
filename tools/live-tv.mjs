// Build one public daily projection. Raw attendance, contacts and notes never leave this process.
import {pathToFileURL} from 'node:url';

const db = 'https://absensi-santri-fajrul-islam-default-rtdb.firebaseio.com';
const zone = 'Asia/Jakarta';
const day = date => new Date(date.getTime()+7*3600000).toISOString().slice(0,10);
const values = data => Object.values(data || {}).filter(Boolean);
const key = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('id');
const sorted = names => [...names].sort((a,b)=>a.localeCompare(b,'id'));
const name = value => typeof value === 'string' ? value.trim() : '';
const known = {hadir:'masuk',terlambat:'masuk',izin:'izin',sakit:'sakit',alfa:'alfa',alpha:'alfa'};
function entries(data, accepts) {
  return values(data).flatMap(item => accepts(item) ? [item] :
    typeof item==='object' ? entries(item,accepts) : []);
}

export function project({roster, deposits, lessons, staffLog, schedule, leave, blocked}, now) {
  const date=day(now), clock=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
  const weekday=new Date(date+'T12:00:00Z').getUTCDay();
  const students=new Map();
  for(const group of values(roster)) for(const item of values(group)){
    const n=name(typeof item==='string'?item:item.nama||item.namaSantri);
    if(n)students.set(key(n),n);
  }
  const recorded=new Map();
  for(const r of values(deposits)){
    if(r.tanggal!==date || (r.program && key(r.program)!=='tahfiz'))continue;
    for(const item of values(r.data)){
      const n=name(item.nama||item.namaSantri);
      if(n && !/^(tidak|belum) setor/i.test(name(item.setoran)))recorded.set(key(n),students.get(key(n))||n);
    }
  }

  const attendance=new Map();
  // A correction to an earlier class must not override a later lesson's roll call.
  const ordered=values(lessons).filter(r=>r.tanggal===date).sort((a,b)=>
    String(a.jamMulaiJadwal||'').localeCompare(String(b.jamMulaiJadwal||'')) ||
    String(a.waktuSimpan||'').localeCompare(String(b.waktuSimpan||'')));
  for(const r of ordered) for(const item of values(r.data)){
    const n=name(item.nama||item.namaSantri), status=known[key(item.statusFinal||item.statusAkhir||item.status||item.statusAwal)];
    if(n && status)attendance.set(key(n),{n:students.get(key(n))||n,status});
  }
  const pupils={masuk:[],izin:[],sakit:[],alfa:[]};
  for(const {n,status} of attendance.values())pupils[status].push(n);
  for(const list of Object.values(pupils))list.sort((a,b)=>a.localeCompare(b,'id'));

  const teachers=new Map(), aliases=new Map();
  function identify(code,display){
    const n=name(display), id=key(code)||aliases.get(key(n))||key(n);
    if(!id)return '';
    if(n){aliases.set(key(n),id);teachers.set(id,n);}
    else if(!teachers.has(id))teachers.set(id,name(code));
    return id;
  }
  const due=new Set(), present=new Set(), excused=new Set();
  for(const r of entries(schedule,r=>r && typeof r==='object' && 'hari' in r && ('guruKode' in r||'guruNama' in r))){
    if(r.aktif===false || Number(r.hari)%7!==weekday)continue;
    const id=identify(r.guruKode,r.guruNama||r.namaGuru);
    if(id && r.jamMulai && r.jamMulai.padStart(5,'0')<=clock)due.add(id);
  }
  for(const r of values(staffLog)){
    if(r.tanggal!==date)continue;
    const id=identify(r.guruKodeKalender||r.guruKode,r.namaGuru||r.guru);
    if(!id)continue;
    const status=key(r.statusKehadiran||r.status);
    if(/izin|sakit/.test(status))excused.add(id);
    else if(/hadir|tepat|terlambat|masuk/.test(status))present.add(id);
  }
  for(const r of values(blocked)){
    if(r.tanggal!==date||!/izin|sakit|tugas|dinas/i.test(r.statusKetidakhadiran||''))continue;
    const label=name(r.guruTerjadwal),id=aliases.get(key(label))||key(label);
    if(id){
      if(!teachers.has(id))teachers.set(id,label);
      excused.add(id);
    }
  }
  for(const r of values(leave)){
    if(key(r.review?.status||r.status)!=='approved'||!(r.startDate<=date&&date<=r.endDate))continue;
    if(r.startDate===date&&r.startTime&&r.startTime>clock)continue;
    const id=identify(r.teacherCode,r.teacherName);
    if(id)excused.add(id);
  }
  const names=ids=>sorted(new Set([...ids].map(id=>teachers.get(id))));
  return {date,updatedAt:now.toISOString(),tahfiz:{sudah:sorted(recorded.values()),belum:sorted([...students].filter(([k])=>!recorded.has(k)).map(([,n])=>n))},
    guru:{masuk:names(present),izin:names([...excused].filter(id=>!present.has(id))),belum:names([...due].filter(id=>!present.has(id)&&!excused.has(id)))},santri:pupils};
}

async function database(path,query={},options={}){
  const url=new URL(path+'.json',db);
  for(const [k,v] of Object.entries(query))url.searchParams.set(k,JSON.stringify(v));
  if(process.env.LIVE_FIREBASE_ID_TOKEN)url.searchParams.set('auth',process.env.LIVE_FIREBASE_ID_TOKEN);
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error('Firebase '+path+' HTTP '+response.status);
  return response.status===204?null:response.json();
}
export async function publish(){
  const now=new Date(),date=day(now);
  const daily={orderBy:'tanggal',equalTo:date};
  const read=(path,query)=>database('/cahaya_app/'+path,query);
  const weekday=new Date(date+'T12:00:00Z').getUTCDay();
  const todaysSchedule=Promise.all((weekday===0?[0,7]:[weekday]).map(n=>
    read('jadwal_pelajaran',{orderBy:'hari',equalTo:n})
  )).then(rows=>Object.assign({},...rows));
  const [roster,deposits,lessons,staffLog,schedule,leave,blocked]=await Promise.all([
    read('master_usrah'),read('setoran_tahfiz',daily),read('absensi_pembelajaran',daily),
    read('log_absensi_guru',daily),todaysSchedule,read('izin_guru'),read('guru_berhalangan')
  ]);
  if(!roster||!schedule)throw Error('Roster atau jadwal guru belum tersedia.');
  const summary=project({roster,deposits,lessons,staffLog,schedule,leave,blocked},now);
  if(day(new Date())!==date)throw Error('Hari WIB berubah, ulangi publikasi.');
  if(!process.argv.includes('--check')){
    await database('/cahaya_public/live_tv',{}, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(summary)});
  }
  console.log('Ringkasan '+date+' · '+Buffer.byteLength(JSON.stringify(summary))+' byte.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)publish().catch(e=>{console.error(e.message);process.exitCode=1});
