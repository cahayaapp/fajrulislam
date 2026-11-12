// Build one public daily projection. Raw attendance, contacts and notes never leave this process.
import Quran from '../js/quran-menu-roster.js';
import Placement from '../js/student-program-applicability.js';
import Cases from '../js/counselor-case-v2.js';
import Model from '../js/counselor-simplified-v3-model.js';
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

const units=['putra','putri'];
function unitOf(label){
  const value=key(label);
  const match=value.match(/\b(putra|putri)\b/);
  if(match)return match[1];
  const group=value.match(/^usrah\s*([1-8])$/);
  return group?(Number(group[1])<=6?'putra':'putri'):'';
}
function groupUnit(row){
  return unitOf(row.unit)||unitOf(row.unitPembelajaran)||unitOf(row.kelas)||unitOf(row.className);
}
export function project(data,now,unit){
  if(!units.includes(unit))throw Error('Unit TV wajib dipilih.');
  const {roster,classes,placements,deposits,lessons,staffLog,schedule,leave,blocked,reports,program,actions,book}=data;
  const date=day(now), clock=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
  const weekday=new Date(date+'T12:00:00Z').getUTCDay();
  const students=new Map(), other=new Set();
  for(const [label,group] of [...Object.entries(roster||{}),...Object.entries(classes||{})]){
    const side=unitOf(label);
    for(const item of values(group)){
      const n=Quran.studentName(item), id=Placement.identityKey(n,label);
      if(side===unit && n)students.set(id,n);
      else if(side && n)other.add(id);
    }
  }
  const belongs=(id,explicit)=>explicit?explicit===unit:students.has(id)&&!other.has(id);
  const scheduleRows=entries(schedule,r=>r&&typeof r==='object'&&'hari' in r&&('guruKode' in r||'guruNama' in r));
  const qClasses=[...new Set(scheduleRows.filter(r=>r.aktif!==false&&groupUnit(r)===unit&&/qur|tahsin|tahfiz/i.test(r.mapel||'')).map(r=>r.kelas).filter(Boolean))];
  const participants=new Map();
  for(const m of Quran.programMembers(classes,qClasses,'Tahfiz',date,placements||{})){
    const id=Placement.identityKey(m.name,m.academicClass);
    if(m.placement.programQuran && m.placement.programQuran!=='TAHFIZ')continue;
    if(belongs(id,unitOf(m.academicClass)))participants.set(id,m.name);
  }
  const recorded=new Map();
  for(const r of values(deposits)){
    if(r.tanggal!==date || (r.program ? key(r.program)!=='tahfiz' : r.jenisInput!=='setoran_hafalan'))continue;
    for(const item of values(r.data)){
      const n=name(item.nama||item.namaSantri);
      const id=Placement.identityKey(n,r.kelas);
      if(participants.has(id)&&belongs(id,groupUnit(r))&&!/^(tidak|belum) setor/i.test(name(item.setoran)))recorded.set(id,participants.get(id));
    }
  }

  const attendance=new Map();
  // A correction to an earlier class must not override a later lesson's roll call.
  const ordered=values(lessons).filter(r=>r.tanggal===date).sort((a,b)=>
    String(a.jamMulaiJadwal||'').localeCompare(String(b.jamMulaiJadwal||'')) ||
    String(a.waktuSimpan||'').localeCompare(String(b.waktuSimpan||'')));
  for(const r of ordered) for(const item of values(r.data)){
    const n=name(item.nama||item.namaSantri), status=known[key(item.statusFinal||item.statusAkhir||item.status||item.statusAwal)];
    const id=Placement.identityKey(n,r.kelas);
    if(n && status && belongs(id,groupUnit(r)))attendance.set(id,{n:students.get(id)||n,status});
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
  const unitSchedules=new Set();
  for(const r of scheduleRows){
    if(r.aktif===false || groupUnit(r)!==unit || Number(r.hari)%7!==weekday)continue;
    if(r.id)unitSchedules.add(r.id);
    const id=identify(r.guruKode,r.guruNama||r.namaGuru);
    if(id && r.jamMulai && r.jamMulai.padStart(5,'0')<=clock)due.add(id);
  }
  for(const r of values(staffLog)){
    if(r.tanggal!==date||(groupUnit(r)?groupUnit(r)!==unit:!unitSchedules.has(r.jadwalId)))continue;
    const id=identify(r.guruKodeKalender||r.guruKode,r.namaGuru||r.guru);
    if(!id)continue;
    const status=key(r.statusKehadiran||r.status);
    if(/izin|sakit/.test(status))excused.add(id);
    else if(/hadir|tepat|terlambat|masuk/.test(status))present.add(id);
  }
  for(const r of values(blocked)){
    if(r.tanggal!==date||(groupUnit(r)?groupUnit(r)!==unit:!unitSchedules.has(r.jadwalId))||!/izin|sakit|tugas|dinas/i.test(r.statusKetidakhadiran||''))continue;
    const label=name(r.guruTerjadwal),id=aliases.get(key(label))||key(label);
    if(id){
      if(!teachers.has(id))teachers.set(id,label);
      excused.add(id);
    }
  }
  for(const r of values(leave)){
    if(!values(r.units).some(x=>unitOf(x)===unit)&&groupUnit(r)!==unit)continue;
    if(key(r.review?.status||r.status)!=='approved'||!(r.startDate<=date&&date<=r.endDate))continue;
    if(r.startDate===date&&r.startTime&&r.startTime>clock)continue;
    const id=identify(r.teacherCode,r.teacherName);
    if(id)excused.add(id);
  }
  const names=ids=>sorted(new Set([...ids].map(id=>teachers.get(id))));
  const candidates=Model.sourceCases(reports||{},program||{},lessons||{},[...values(actions),...values(book)])
    .filter(c=>belongs(Placement.identityKey(c.student),unitOf(c.unit)||unitOf(c.raw.kelas)||unitOf(c.context.usrah))&&!Model.cleared(c));
  const queue={muda:new Set(),madya:new Set()};
  for(const c of candidates){
    const h=c.caseV2?.higherEscalation;
    if(!c.student||c.reportDate!==date||Cases.FINAL_STATES.has(c.status)||(h?.requestedAt&&!h.response?.respondedAt))continue;
    const level=c.routeLevel||Cases.routeCase(c,candidates).level;
    queue[level==='MADYA'?'madya':'muda'].add(students.get(Placement.identityKey(c.student))||c.student);
  }
  return {unit,date,konselor:{muda:sorted(queue.muda),madya:sorted(queue.madya)},updatedAt:now.toISOString(),tahfiz:{sudah:sorted(recorded.values()),belum:sorted([...participants].filter(([k])=>!recorded.has(k)).map(([,n])=>n))},
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
  // Two preceding days are sufficient for the existing three-consecutive-days routing rule.
  const range={orderBy:'tanggal',startAt:Cases.shiftDate(date,-2),endAt:date+'\uf8ff'};
  const [roster,classes,placements,deposits,lessons,staffLog,schedule,leave,blocked,reports,program,actions,book]=await Promise.all([
    read('master_usrah'),read('master_akademik/kelas'),read('program_quran_santri'),
    read('setoran_tahfiz',daily),read('absensi_pembelajaran',range),read('log_absensi_guru',daily),
    read('jadwal_pelajaran'),read('izin_guru'),read('guru_berhalangan'),read('log_lapor_inisiatif',range),
    read('absensi_program_harian',range),read('laporan_penindakan',{...range,orderBy:'tanggalPenindakan'}),
    read('buku_kasus_konselor')
  ]);
  if(!roster||!schedule||!classes)throw Error('Roster, kelas atau jadwal belum tersedia.');
  const data={roster,classes,placements,deposits,lessons,staffLog,schedule,leave,blocked,reports,program,actions,book};
  const summary=Object.fromEntries(units.map(unit=>[unit,project(data,now,unit)]));
  if(day(new Date())!==date)throw Error('Hari WIB berubah, ulangi publikasi.');
  if(!process.argv.includes('--check')){
    await database('/cahaya_public/live_tv',{}, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(summary)});
  }
  console.log('Ringkasan '+date+' · '+Buffer.byteLength(JSON.stringify(summary))+' byte.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)publish().catch(e=>{console.error(e.message);process.exitCode=1});
