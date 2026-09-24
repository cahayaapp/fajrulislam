import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import{getDatabase,ref,get,set,update,query,orderByChild,equalTo,startAt,endAt}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
const hiddenStyle=document.createElement('style');hiddenStyle.textContent='[hidden]{display:none!important}';document.head.appendChild(hiddenStyle);
const R=window.CahayaRoleSystemV2,ctx=window.cahayaRoleContext,$=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));let user={};try{user=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')||{}}catch{}
const session=R.resolveSession(user,localStorage),a=session.activeAssignment,unit=a.unit,unitLabel=unit==='ALL'?'Putra & Putri':unit==='PUTRI'?'Putri':'Putra',identity={id:user.uid||user.username||'',name:user.label||user.nama||user.displayName||user.username||'Manajer Pendidikan'},params=new URLSearchParams(location.search),requestedView=params.get('view')||'control',view=requestedView==='kbm'?'control':requestedView,app=getApps().length?getApp():initializeApp(window.CAHAYA_CONFIG.firebase),db=getDatabase(app);
const PATH={schedule:'cahaya_app/jadwal_pelajaran',attendance:'cahaya_app/absensi_pembelajaran',absence:'cahaya_app/guru_berhalangan',targets:'kalender_materi_pembelajaran/ta_2026_2027',legacyTargets:'guru_kits_materi/ta_2026_2027',completion:'cahaya_app/capaian_materi_guru',scores:'cahaya_app/nilai_ujian_bulanan',final:'cahaya_app/nilai_input_final',scoreIndex:'cahaya_app/nilai_input_index',master:'cahaya_app/master_akademik',findings:'cahaya_app/masalah_pendidikan',coaching:'cahaya_app/pembinaan_guru',observation:'observasi_lapangan'};
const F=window.CahayaEducationFindingsV2,sharedCache=(()=>{try{return parent.CahayaDataCache||null}catch{return null}})(),cacheKey=`manager-education:${session.userKey}:${unit}`;
const config={control:['KONTROL OPERASIONAL','Kontrol Hari Ini','Pantau jadwal, kehadiran Guru, pelaksanaan KBM, pembukaan, finalisasi, kelas kosong, dan isu hari ini.'],material:['CAPAIAN MATERI','Capaian Materi','Bandingkan target dan laporan capaian materi Guru Pondok.'],followup:['TINDAK LANJUT','Tindak Lanjut','Kerjakan temuan aktif dari seluruh sumber operasional pendidikan.'],teachers:['PERSONIL PENDIDIKAN','Guru Pondok','Direktori dan konteks operasional Guru Pondok dalam unit Anda.'],scores:['MONITORING BULANAN','Nilai Ujian','Pantau kelengkapan input nilai per bulan tanpa mengubah nilai Guru.'],observation:['OBSERVASI OPERASIONAL','Observasi Pembelajaran','Catat kekuatan dan area perbaikan pelaksanaan pembelajaran.'],findings:['RIWAYAT OPERASIONAL','Riwayat Temuan','Tinjau temuan yang sudah selesai berdasarkan kalender.'],coaching:['PEMBINAAN PERSONIL','Pembinaan Guru','Catat apresiasi, coaching, briefing ulang, atau target perbaikan.'],kpi:['BUKTI OPERASIONAL','KPI Manajer Pendidikan','Bukti kerja pendidikan pada periode terpilih; bukan skor atau peringkat.'],guide:['PANDUAN KERJA','Panduan Manajer Pendidikan','Batas scope, siklus kontrol, dan jalur eskalasi operasional.']};
let state={schedule:[],rows:[],master:{},findings:[],recentFindings:[],scoreSessions:new Map,findingReadError:null,busy:false,suspended:false};
function assert(){ctx.assertCurrent();const manager=session.activeRole==='MANAJER'&&R.isEducationManager(a)&&['PUTRA','PUTRI'].includes(unit),review=view==='scores'&&((session.activeRole==='SUPERVISOR'&&R.canManageTahsinLevels('SUPERVISOR',a))||(session.activeRole==='DIREKTUR'&&unit==='ALL'));if(!manager&&!review)throw new Error('EDUCATION_SCORE_SCOPE_REQUIRED')}
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ')}function rows(v){return Array.isArray(v)?v.filter(Boolean):Object.entries(v||{}).map(([id,x])=>x&&typeof x==='object'?{id,...x}:null).filter(Boolean)}function jakartaDate(d=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),g=t=>p.find(x=>x.type===t)?.value||'';return`${g('year')}-${g('month')}-${g('day')}`}function shift(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}function range(k){const end=jakartaDate();if(k==='TODAY')return{start:end,end};if(k==='WEEK'){const d=new Date(end+'T12:00:00Z'),day=(d.getUTCDay()+6)%7;return{start:shift(end,-day),end}}return{start:end.slice(0,8)+'01',end}}function dateOf(x){return String(x.tanggal||x.date||x.targetDate||x.completedDate||x.tanggal_ujian||x.createdAt||x.timestamp||'').slice(0,10)}function isPkbm(x={}){return /(^| )pkbm( |$)/.test(norm([x.jenis,x.programDomain,x.domain,x.unit,x.unitPembelajaran,x.kelas,x.kelas_kelompok,x.classNames?.join?.(' '),x.sesi,x.sumber,x.sumberJadwal,x.jadwalId,x.id].filter(Boolean).join(' ')))}function unitOf(x={}){const s=norm([x.unit,x.unitPembelajaran,x.kelas,x.kelas_kelompok,x.kelasLabel,x.classNames?.join?.(' ')].filter(Boolean).join(' '));if(s.includes('putri'))return'PUTRI';if(s.includes('putra'))return'PUTRA';return''}function inScope(x){if(isPkbm(x))return false;const u=unitOf(x);return !u||u===unit||Array.isArray(x.classNames)&&x.classNames.some(n=>unitOf({kelas:n})===unit)}function education(rowsIn){return rowsIn.filter(x=>inScope(x))}function toast(v){const e=$('toast');e.textContent=v;e.classList.add('show');clearTimeout(window.__meToast);window.__meToast=setTimeout(()=>e.classList.remove('show'),2300)}function setState(v){$('state').textContent=v;$('state').hidden=false}function hideState(){$('state').hidden=true}function status(v,t='info'){return`<span class="me-status ${t}">${esc(v)}</span>`}function rowCard(title,sub,badge='',actions=''){return`<article class="me-row"><div class="me-row-head"><div><h3>${esc(title)}</h3><p>${sub}</p></div>${badge}</div>${actions?`<div class="me-actions">${actions}</div>`:''}</article>`}function stat(items){$('summary').innerHTML=items.map(([v,l])=>`<div class="me-stat"><b>${esc(v)}</b><small>${esc(l)}</small></div>`).join('')}
function scoreHash(value=''){const s=String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h)^s.charCodeAt(i);return'k'+(h>>>0).toString(36)}
function sessionClasses(marker){return String(marker.kelasScope||'').split('|').map(s=>s.trim()).filter(Boolean)}
function scoreSessionScope(marker,records){
  const classes=sessionClasses(marker);
  if(marker.sessionVersion!=='v805'||!marker.sessionKey||!classes.length||!records.length||isPkbm(marker))return false;
  if(!classes.every(c=>['PUTRA','PUTRI'].includes(unitOf({kelas:c}))&&(unit==='ALL'||unitOf({kelas:c})===unit)))return false;
  if(!classes.every(c=>state.schedule.some(s=>norm(s.mapel||s.mataPelajaran)===norm(marker.mapel)&&norm(s.guruKode||s.guruNama||s.guru)===norm(marker.guruKode||marker.guru)&&[s.kelas,...(s.classNames||[])].some(name=>norm(name)===norm(c)))))return false;
  if(records.some(item=>!item?.recordKey||!item.dbPath||!item.data||isPkbm(item.data)||!['PUTRA','PUTRI'].includes(unitOf(item.data))||(unit!=='ALL'&&unitOf(item.data)!==unit)))return false;
  return records.every(item=>norm(item.data.guru_penguji)===norm(marker.guru)&&norm(item.data.mata_pelajaran)===norm(marker.mapel)&&norm(item.data.jenis_ujian)===norm(marker.jenisUjian)&&String(item.data.tahun_akademik)===String(marker.tahunAkademik)&&norm(item.data.periode_ujian)===norm(marker.periode)&&String(item.data.kode_penilaian||'')===String(marker.kodePenilaian||'')&&classes.some(c=>norm(c)===norm(item.data.kelas_kelompok||item.data.kelas)));
}
async function read(path,q){assert();const s=await get(q||ref(db,path));assert();return rows(s.val())}async function readOne(path){assert();const s=await get(ref(db,path));assert();return s.val()||{}}async function dateRead(path,date){return read(path,query(ref(db,path),orderByChild('tanggal'),equalTo(date)))}async function rangeRead(path,from,to){return read(path,query(ref(db,path),orderByChild('tanggal'),startAt(from),endAt(to)))}
// For findings, the RTDB child key is the write target. Legacy payload IDs can differ.
function findingRows(value){return Object.entries(value||{}).map(([key,record])=>record&&typeof record==='object'?{...record,id:key}:null).filter(Boolean)}
async function readFindingSnapshot(q){assert();const snapshot=await get(q||ref(db,PATH.findings));assert();return findingRows(snapshot.val())}
function invalidateFindingCache(){const key=`${cacheKey}:legacy-findings`;sharedCache?.clear(key);try{sessionStorage.removeItem(`cahaya:data:${key}`);localStorage.removeItem(`cahaya:data:${key}`)}catch(error){console.warn('Cache Temuan persisten belum dapat dibersihkan',error)}}
async function readFindings(from,to,compatibilityFallback=true){
  assert();state.findingReadError=null;let queried=[],queryError=null;
  try{queried=await readFindingSnapshot(query(ref(db,PATH.findings),orderByChild('tanggal'),startAt(from),endAt(to)))}catch(error){queryError=error;console.warn('Temuan date query gagal; mencoba kompatibilitas legacy',error)}
  let all=queried;
  // The legacy root has records keyed by date, `date`, or timestamps. Read it
  // once per session for compatible views; a `tanggal` query alone misses them.
  if(queryError||compatibilityFallback||!queried.length){
    const key=`${cacheKey}:legacy-findings`;
    all=sharedCache?.get(key,300000);
    if(!all){try{all=await readFindingSnapshot();sharedCache?.set(key,all)}catch(error){
      const recent=state.recentFindings.length?state.recentFindings:sharedCache?.get(`${cacheKey}:recent-findings`,300000)||[];
      state.findingReadError=error;
      console.warn('Riwayat Temuan legacy belum dapat dimuat; menampilkan hasil query dan Temuan yang baru disimpan',error);
      all=queried;
    }}
  }
  const recent=state.recentFindings.length?state.recentFindings:sharedCache?.get(`${cacheKey}:recent-findings`,300000)||[];
  // A just-confirmed write wins over an older snapshot, but not newer remote data.
  const merged=new Map(all.map((item,index)=>[String(item.id??index),item]));
  for(const item of recent){const key=String(item.id),remote=merged.get(key);if(!remote||String(item.updatedAt||'')>=String(remote.updatedAt||''))merged.set(key,item)}
  all=[...merged.values()];
  await loadSchedule();
  return all.map(item=>F.normalizeEducationFinding(item,item.id)).filter(item=>F.inDateRange(item,from,to)&&F.inManagerScope(item,a,state.schedule));
}
async function cachedRoot(path){const key=`${cacheKey}:root:${path}`,cached=sharedCache?.get(key,300000);if(cached)return cached;const value=await readOne(path);sharedCache?.set(key,value);return value}
async function loadSchedule(){
  if(state.schedule.length)return state.schedule;
  const cacheId=`${cacheKey}:schedule`,cached=sharedCache?.get(cacheId,300000);
  if(cached){state.schedule=cached;return state.schedule}
  try{
    const response=await fetch('../data/jadwal-pelajaran-awal-2026-2027.json?v=164');
    if(response.ok)state.schedule=rows(await response.json());
  }catch(error){console.warn('Jadwal lokal belum dapat dibaca',error)}
  if(!state.schedule.length){
    try{
      const item=JSON.parse(localStorage.getItem('cahaya_guru_schedule_v148')||'null');
      if(item&&Date.now()-item.t<12*3600000)state.schedule=rows(item.v);
    }catch(error){console.warn('Cache jadwal tidak dapat dibaca',error)}
  }
  if(!state.schedule.length){
    try{state.schedule=await read(PATH.schedule)}
    catch(error){console.error('Jadwal lokal, cache, dan Firebase tidak dapat dimuat',error);throw new Error('Jadwal Kepondokan belum dapat dimuat. Periksa koneksi lalu coba Segarkan.')}
  }
  state.schedule=(unit==='ALL'?state.schedule.filter(x=>!isPkbm(x)):education(state.schedule)).filter(x=>x.aktif!==false&&norm(x.jenis)!=='ekskul');
  sharedCache?.set(cacheId,state.schedule);
  return state.schedule;
}function dayNo(date){return new Date(date+'T12:00:00').getDay()}function todaySchedule(date){return state.schedule.filter(x=>Number(x.hari)===dayNo(date)).sort((x,y)=>String(x.jamMulai||'').localeCompare(String(y.jamMulai||'')))}function recordMatch(r,s,date){if(dateOf(r)!==date)return false;if(String(r.jadwalId||'')&&String(s.id||'')&&String(r.jadwalId)===String(s.id))return true;const rc=[r.kelas,r.kelasLabel,...(r.classNames||[])].map(norm),sc=[s.kelas,...(s.classNames||[])].map(norm);return norm(r.mapel||r.mataPelajaran||r.subject)===norm(s.mapel||s.mataPelajaran)&&rc.some(x=>x&&sc.includes(x))}function attendanceState(r){if(!r)return['Absensi Belum Diisi','bad'];if(r.statusFinalisasi==='FINAL'||r.tahapAbsensi==='FINAL')return['Final','ok'];if(r.statusFinalisasi==='BELUM_FINAL'||r.tahapAbsensi==='PEMBUKAAN')return['Pembukaan Selesai • Belum Final','att'];return['Rekaman Tersedia','info']}function scheduleLabel(s){const classes=s.isCombined&&s.classNames?.length?s.classNames.join(' + '):s.kelas||'Kelas';return`${esc(s.jamMulai||'—')}–${esc(s.jamSelesai||'—')} • ${esc(classes)} • ${esc(s.guruNama||s.guruKode||s.guru||'Guru')}`}
async function loadControl(){
  const date=$('selectedDate').value;
  setState('Memuat jadwal tanggal terpilih…');
  await loadSchedule();
  const sessions=todaySchedule(date);
  stat([[sessions.length,'KBM terjadwal'],['…','Absensi final'],['…','Perlu perhatian'],['…','Temuan aktif']]);
  $('content').innerHTML=sessions.length
    ?sessions.map(s=>rowCard(s.mapel||s.mataPelajaran||'Pembelajaran',scheduleLabel(s),status('Memeriksa bukti…'))).join('')
    :'<div class="me-empty">Tidak ada sesi Kepondokan untuk unit ini pada tanggal terpilih.</div>';
  setState('Memuat absensi, izin Guru, dan Temuan tanggal terpilih…');
  const safe=async(label,promise)=>{try{return{data:await promise,error:null}}catch(error){console.error('Gagal memuat '+label,error);return{data:[],error}}};
  const [attendanceResult,absenceResult,findingResult]=await Promise.all([
    safe('absensi pembelajaran',dateRead(PATH.attendance,date)),
    safe('Guru berhalangan',dateRead(PATH.absence,date)),
    safe('Temuan pendidikan',readFindings(date,date,false))
  ]);
  const attendanceOk=!attendanceResult.error,absenceOk=!absenceResult.error;
  const findingsOk=!findingResult.error&&!state.findingReadError;
  const scopedAtt=education(attendanceResult.data),scopedAbs=education(absenceResult.data),scopedFind=findingResult.data;
  state.rows=sessions.map(s=>({
    s,ar:scopedAtt.find(r=>recordMatch(r,s,date)),
    leave:scopedAbs.find(r=>recordMatch(r,s,date))
  }));
  const final=attendanceOk?state.rows.filter(x=>attendanceState(x.ar)[0]==='Final').length:'—';
  const attention=attendanceOk&&absenceOk?state.rows.filter(x=>!x.ar||x.ar.statusFinalisasi!=='FINAL'||x.leave).length:'—';
  stat([[sessions.length,'KBM terjadwal'],[final,'Absensi final'],[attention,'Perlu perhatian'],[findingsOk?scopedFind.filter(x=>x.status!=='SELESAI').length:'—','Temuan aktif']]);
  $('content').innerHTML=state.rows.length?state.rows.map(({s,ar,leave})=>{
    const [st,tone]=attendanceOk?attendanceState(ar):['Bukti belum dapat dimuat','att'];
    const remaining=attendanceOk?(ar?.data?.filter?.(x=>(x.statusAwal||x.status)==='Belum Hadir'&&!(x.statusAkhir||x.statusFinal))?.length||0):0;
    const extra=[absenceOk?(leave?'Guru berhalangan: '+esc(leave.alasan||leave.statusKetidakhadiran||'tercatat'):''):'Data Guru berhalangan belum dapat dimuat',remaining?remaining+' santri masih Belum Hadir':''].filter(Boolean).join('<br>');
    const needsFinding=attendanceOk&&(!ar||tone!=='ok'||absenceOk&&leave);
    const summary=leave?'Guru berhalangan dan sesi memerlukan penyelesaian operasional.':!ar?'Absensi pembukaan belum dilakukan atau KBM belum memiliki bukti pelaksanaan.':remaining?remaining+' santri masih Belum Hadir dan finalisasi perlu ditinjau.':'Finalisasi absensi belum selesai.';
    const action=needsFinding?`<button class="me-btn warn" data-new-finding="${esc(s.id||'')}" data-source="KBM" data-source-path="${PATH.attendance}" data-personnel="${esc(s.guruNama||s.guruKode||s.guru||'')}" data-subject="${esc([s.mapel||s.mataPelajaran,s.kelas].filter(Boolean).join(' • '))}" data-summary="${esc(summary)}">Buat Temuan</button>`:'';
    return rowCard(s.mapel||s.mataPelajaran||'Pembelajaran',`${scheduleLabel(s)}${extra?'<br>'+extra:''}`,status(st,tone),action);
  }).join(''):'<div class="me-empty">Tidak ada sesi Kepondokan untuk unit ini pada tanggal terpilih.</div>';
  const unavailable=[!attendanceOk?'absensi pembelajaran':'',!absenceOk?'Guru berhalangan':'',!findingsOk?'Temuan':''].filter(Boolean);
  if(unavailable.length)setState('Jadwal tampil, tetapi '+unavailable.join(', ')+' belum dapat dimuat. Coba Segarkan.');
  else hideState();
}
function deepTargets(node,out=[]){if(!node||typeof node!=='object')return out;if(typeof node.material==='string'&&(node.date||node.targetDate))out.push(node);else Object.values(node).forEach(x=>deepTargets(x,out));return out}
async function loadMaterial(){setState('Memuat target dan capaian materi pada tanggal terpilih…');const date=$('selectedDate').value;await loadSchedule();let comp=[];try{comp=await read(PATH.completion,query(ref(db,PATH.completion),orderByChild('targetDate'),equalTo(date)))}catch{}let targetRoot=await cachedRoot(PATH.targets);if(!Object.keys(targetRoot).length)targetRoot=await cachedRoot(PATH.legacyTargets);const targets=education(deepTargets(targetRoot).filter(x=>String(x.date||x.targetDate).slice(0,10)===date)),sessions=todaySchedule(date),list=sessions.map(s=>{const target=targets.find(x=>norm(x.subject||x.mapel)===norm(s.mapel)&&([x.kelas,x.kelasLabel,...(x.classNames||[])].map(norm).includes(norm(s.kelas))||x.sourceAssignmentIds?.includes?.(s.id))),c=education(comp).filter(x=>norm(x.subject||x.mapel)===norm(s.mapel)&&([x.kelas,x.kelasLabel,...(x.classNames||[])].map(norm).includes(norm(s.kelas))||x.sourceAssignmentIds?.includes?.(s.id)));return{s,target,c}}),done=list.filter(x=>x.c.some(c=>c.status==='TERCAPAI'||c.statusAktif===true)).length,miss=list.filter(x=>x.c.some(c=>c.status==='BELUM_TERCAPAI')).length;stat([[list.filter(x=>x.target).length,'Target terjadwal'],[done,'Tercapai'],[miss,'Belum tercapai']]);$('content').innerHTML=list.length?list.map(({s,target,c})=>{const latest=c.sort((x,y)=>String(y.updatedAt||'').localeCompare(String(x.updatedAt||'')))[0],label=!target?'Target Belum Dibuat':!latest?'Belum Dilaporkan':latest.status==='TERCAPAI'?'Tercapai':'Belum Tercapai',tone=label==='Tercapai'?'ok':label==='Belum Tercapai'?'att':'bad',detail=`Target: ${esc(target?.material||'belum tersedia')}<br>${latest?`Laporan: ${esc(latest.material||target?.material||'Materi')}`:'Belum ada laporan capaian.'}${latest?.analisaPenyebab?`<br>Alasan: ${esc(latest.analisaPenyebab)}`:''}${latest?.rencanaTindakLanjut?`<br>Rencana Guru: ${esc(latest.rencanaTindakLanjut)}`:''}`,summary=label==='Target Belum Dibuat'?'Target materi belum dibuat.':label==='Belum Dilaporkan'?'Capaian materi belum dilaporkan.':`Target materi belum tercapai${latest?.analisaPenyebab?`: ${latest.analisaPenyebab}`:'.'}`;return rowCard(`${s.mapel||'Mapel'} • ${s.kelas||''}`,`${esc(s.guruNama||s.guruKode||'Guru')}<br>${detail}`,status(label,tone),label!=='Tercapai'?`<button class="me-btn warn" data-new-finding="${esc(latest?.id||target?.id||s.id||'')}" data-source="MATERI" data-source-path="${PATH.completion}" data-personnel="${esc(s.guruNama||s.guruKode||'')}" data-subject="${esc([s.mapel,s.kelas].filter(Boolean).join(' • '))}" data-summary="${esc(summary)}">Buat Temuan</button>`:'')}).join(''):'<div class="me-empty">Tidak ada sesi Kepondokan pada tanggal terpilih.</div>';hideState()}
async function loadScores(){
  setState('Memuat nilai bulanan dalam scope…');await loadSchedule();const month=$('selectedMonth').value;let scores=[];
  try{scores=await read(PATH.scores,query(ref(db,PATH.scores),orderByChild('tanggal_ujian'),startAt(month+'-01'),endAt(month+'-31\uf8ff')))}catch{}
  const selectedMonthLabel=norm(new Intl.DateTimeFormat('id-ID',{month:'long'}).format(new Date(month+'-15T12:00:00')));
  scores=(unit==='ALL'?scores.filter(x=>!isPkbm(x)):education(scores)).filter(x=>{
    const recordMonth=String(x.tanggal_ujian||x.timestamp||'').slice(0,7);
    return recordMonth===month||norm(x.bulan)===selectedMonthLabel;
  });
  const expected=new Map;state.schedule.forEach(s=>expected.set(`${norm(s.kelas)}|${norm(s.mapel)}|${norm(s.guruKode||s.guru)}`,s));
  const groups=[...expected.values()].map(s=>{const rs=scores.filter(x=>norm(x.kelas_kelompok||x.kelas)===norm(s.kelas)&&norm(x.mata_pelajaran||x.mapel)===norm(s.mapel)),unique=new Map(rs.map(x=>[norm(x.nama_santri||x.namaSantri||x.nama),x])),vals=[...unique.values()],explicit=vals.filter(x=>x.status||x.statusFinalisasi),final=explicit.filter(x=>norm(x.status||x.statusFinalisasi).includes('final')).length,low=vals.filter(x=>Number(x.nilai_total??x.nilai)<Number(x.kkm??70)).length;return{s,count:unique.size,final,hasFinalMarker:explicit.length>0,low}});
  stat([[groups.length,'Mapel/kelas'],[groups.filter(x=>x.count).length,'Sudah input'],[groups.filter(x=>!x.count).length,'Belum input']]);
  $('content').innerHTML=groups.length?groups.map(x=>{const label=!x.count?'Belum Input':!x.hasFinalMarker?'Tersimpan':x.final===x.count?'Final':'Draft / Parsial',tone=!x.count?'bad':label==='Final'?'ok':'att',summary=!x.count?'Nilai ujian bulanan belum diinput.':'Nilai ujian masih Draft / Parsial dan perlu dilengkapi.';const action=label==='Final'?'':`<button class="me-btn warn" data-new-finding="${esc(x.s.id||'')}" data-source="NILAI_UJIAN" data-source-path="${PATH.scores}" data-personnel="${esc(x.s.guruNama||x.s.guruKode||'')}" data-subject="${esc([x.s.mapel,x.s.kelas].filter(Boolean).join(' • '))}" data-summary="${esc(summary)}">Buat Temuan</button>`;return rowCard(`${x.s.mapel} • ${x.s.kelas}`,`${esc(x.s.guruNama||x.s.guruKode||'Guru')}<br>${x.count} santri tercatat • ${x.low} di bawah KKM`,status(label,tone),action)}).join(''):'<div class="me-empty">Jadwal Kepondokan belum tersedia.</div>';
  await loadFinalScoreSessions(month);hideState()
}
async function loadFinalScoreSessions(month){
  state.scoreSessions.clear();
  const [markers,indexes]=await Promise.all([readOne(PATH.final),readOne(PATH.scoreIndex)]);
  const cards=[];
  for(const [key,marker] of Object.entries(markers)){
    if(!marker||!['FINAL','REVISION_OPEN'].includes(marker.status)||marker.sessionKey!==key)continue;
    const records=Object.values(indexes[key]||{});
    if(!scoreSessionScope(marker,records)||!records.some(item=>String(item.data.tanggal_ujian||'').slice(0,7)===month))continue;
    state.scoreSessions.set(key,{marker,records});
    const stage=marker.status==='FINAL'?'Final':'Dibuka untuk Revisi';
    cards.push(rowCard(`${marker.mapel} • ${sessionClasses(marker).join(' + ')}`,`${esc(marker.guru)} • ${esc(marker.jenisPenilaian||marker.kodePenilaian||'Penilaian')} • ${esc(marker.jenisUjian)} • ${esc(marker.periode)} • ${esc(marker.tahunAkademik)} / ${esc(marker.semester||'')}<br>${records.length} nilai tersimpan`,status(stage,marker.status==='FINAL'?'ok':'att'),marker.status==='FINAL'?`<button type="button" class="me-btn primary" data-revise-score="${esc(key)}">Buka Revisi</button>`:''));
  }
  $('content').insertAdjacentHTML('afterbegin',`<div class="me-empty"><b>Sesi Penilaian • ${esc(month)}</b><br>Bulanan, Triwulan, dan Semester dalam scope Kepondokan.</div>`+(cards.join('')||'<div class="me-empty">Belum ada sesi Final pada bulan ini.</div>'));
}
function teacherDirectory(){const map=new Map;state.schedule.forEach(s=>{const key=norm(s.guruKode||s.guruNama||s.guru);if(!key)return;if(!map.has(key))map.set(key,{name:s.guruNama||s.guru||s.guruKode,subjects:new Set,classes:new Set});const t=map.get(key);t.subjects.add(s.mapel);t.classes.add(s.kelas)});return[...map.values()].sort((x,y)=>x.name.localeCompare(y.name,'id'))}async function loadTeachers(){setState('Menyiapkan direktori Guru Pondok…');await loadSchedule();const list=teacherDirectory();stat([[list.length,'Guru Pondok'],[new Set(state.schedule.map(x=>x.mapel)).size,'Mata pelajaran'],[state.schedule.length,'Alokasi jadwal']]);$('content').innerHTML=list.length?list.map(t=>rowCard(t.name,`${esc([...t.subjects].join(', '))}<br>${esc([...t.classes].join(' • '))}`,status('Kepondokan','info'),`<button class="me-btn" data-open-feature="coaching" data-menu="menu-pembinaan-guru" data-teacher="${esc(t.name)}">Pembinaan</button><button class="me-btn" data-open-feature="observation" data-menu="menu-observasi-pembelajaran" data-teacher="${esc(t.name)}">Observasi</button>`)).join(''):'<div class="me-empty">Belum ada Guru Pondok pada jadwal unit ini.</div>';hideState()}
async function loadFindings(history=false){setState(history?'Memuat riwayat temuan selesai…':'Memuat temuan aktif dalam rentang kalender…');const from=$('startDate').value,to=$('endDate').value;let list=await readFindings(from,to);list=list.filter(x=>history?x.status==='SELESAI':x.status!=='SELESAI');state.findings=list.sort((x,y)=>String(y.tanggal||'').localeCompare(String(x.tanggal||'')));stat(history?[[state.findingReadError?'—':list.length,'Temuan selesai'],[state.findingReadError?'—':new Set(list.map(x=>x.sourceType).filter(Boolean)).size,'Jenis sumber']]:[[state.findingReadError?'—':list.length,'Temuan aktif'],[state.findingReadError?'—':list.filter(x=>x.status==='BARU').length,'Baru'],[state.findingReadError?'—':list.filter(x=>x.status==='DIESKALASI_KE_SUPERVISOR').length,'Eskalasi']]);$('content').innerHTML=(state.findingReadError?'<div class="me-empty">Sebagian Temuan belum dapat dimuat. Coba Segarkan.</div>':'')+(list.length?list.map(x=>rowCard(x.temuan||'Temuan Pendidikan',`${esc(x.tanggal||'')} • ${esc(x.personil||'Personil belum ditentukan')}${x.sourceType?` • ${esc(x.sourceType)}`:''}<br>${esc(x.tindakanManajer||x.tindakan||(history?'Tidak ada catatan tindakan':'Belum ada tindakan'))}${x.targetPerbaikan?`<br>Target: ${esc(x.targetPerbaikan)}`:''}`,status(x.statusLabel,x.status==='SELESAI'?'ok':x.status==='DIESKALASI_KE_SUPERVISOR'?'bad':'att'),history?'':`<button class="me-btn primary" data-follow="${esc(x.id)}">Tindak Lanjuti</button>`)).join('') :(state.findingReadError?'':`<div class="me-empty">${history?'Belum ada temuan selesai pada rentang ini.':'Tidak ada temuan aktif pada rentang ini.'}</div>`));hideState()}
async function loadKpi(){
  setState('Memuat bukti kerja pendidikan pada rentang kalender…');
  const from=$('startDate').value,to=$('endDate').value;
  const [findings,observations,coaching]=await Promise.all([
    readFindings(from,to),rangeRead(PATH.observation,from,to),rangeRead(PATH.coaching,from,to)
  ]);
  const observed=observations.filter(x=>unitOf(x)===unit&&norm(x.jenis||x.type).includes('pembelajaran'));
  const coached=coaching.filter(x=>unitOf(x)===unit);
  const completed=findings.filter(x=>x.status==='SELESAI').length;
  const open=findings.filter(x=>x.status!=='SELESAI').length;
  const evidence=[
    ['Temuan ditindaklanjuti',findings.length?findings.filter(x=>x.tindakanManajer||x.tindakan).length:'—','Catatan tindakan Manajer yang sudah tersimpan.'],
    ['Temuan selesai',findings.length?completed:'—','Temuan dengan status Selesai.'],
    ['Temuan aktif',findings.length?open:'—','Temuan yang masih memerlukan proses atau evaluasi.'],
    ['Observasi pembelajaran',observed.length||'—','Observasi operasional yang terdokumentasi.'],
    ['Pembinaan Guru',coached.length||'—','Catatan apresiasi atau pembinaan yang terdokumentasi.']
  ];
  stat([[findings.length||'—','Temuan tercatat'],[observed.length||'—','Observasi'],[coached.length||'—','Pembinaan']]);
  $('content').innerHTML=evidence.map(([title,value,note])=>rowCard(title,`${esc(note)}<br>${esc(from)}–${esc(to)}`,status(value,value==='—'?'info':'ok'))).join('');
  hideState();
}
async function loadCoaching(){setState('Memuat pembinaan pada rentang kalender…');const list=education(await rangeRead(PATH.coaching,$('startDate').value,$('endDate').value)).sort((x,y)=>dateOf(y).localeCompare(dateOf(x)));stat([[list.length,'Catatan pembinaan'],[list.filter(x=>x.jenis==='APRESIASI').length,'Apresiasi'],[list.filter(x=>x.jenis!=='APRESIASI').length,'Perbaikan']]);$('content').innerHTML=`<button class="me-btn primary" data-coach="">+ Catat Pembinaan</button>`+(list.length?list.map(x=>rowCard(`${x.jenisLabel||x.jenis||'Pembinaan'} • ${x.guru||x.personil||'Guru'}`,`${esc(dateOf(x))}<br>${esc(x.pembahasan||x.arahan||'')}<br>${x.targetPerbaikan?`Target: ${esc(x.targetPerbaikan)}`:''}`,status(x.hasil?'Sudah Dievaluasi':'Aktif',x.hasil?'ok':'info'))).join(''):'<div class="me-empty">Belum ada pembinaan pada rentang ini.</div>');hideState()}
async function loadObservations(){setState('Memuat observasi pada rentang kalender…');const list=education(await rangeRead(PATH.observation,$('startDate').value,$('endDate').value)).filter(x=>norm(x.jenis||x.type).includes('pembelajaran')).sort((x,y)=>dateOf(y).localeCompare(dateOf(x)));stat([[list.length,'Observasi'],[new Set(list.map(x=>x.guru||x.dataUtama?.guru)).size,'Guru'],[list.filter(x=>x.areaPerbaikan).length,'Area perbaikan']]);$('content').innerHTML=`<button class="me-btn primary" data-observe="">+ Catat Observasi</button>`+(list.length?list.map(x=>{const guru=x.guru||x.dataUtama?.guru||'Guru',mapel=x.mapel||x.dataUtama?.mataPelajaran||'Pembelajaran',kelas=x.kelas||x.dataUtama?.kelas||'',summary=x.areaPerbaikan||x.catatanPelaksanaan||x.catatan||'Temuan dari observasi pembelajaran.';return rowCard(guru,`${esc(dateOf(x))} • ${esc(mapel)} • ${esc(kelas)}<br>${esc(x.catatanPelaksanaan||x.catatan||'')}`,status('Observasi Operasional','info'),`<button class="me-btn warn" data-new-finding="${esc(x.id||'')}" data-source="OBSERVASI" data-source-date="${esc(dateOf(x))}" data-source-path="${PATH.observation}" data-personnel="${esc(guru)}" data-subject="${esc([mapel,kelas].filter(Boolean).join(' • '))}" data-summary="${esc(summary)}">Buat Temuan</button>`)}).join(''):'<div class="me-empty">Belum ada observasi pada rentang ini.</div>');hideState()}
function guide(){const sections=[['Peran Saya','Mengendalikan operasional pendidikan harian: rencana, pelaksanaan, hasil, temuan, tindak lanjut, pembinaan, lalu selesai.'],['Scope KEPONDOKAN','Hanya Guru Pondok dan data Kepondokan sesuai unit penugasan. Guru, jadwal, kelas, absensi, dan nilai PKBM tidak termasuk.'],['Kontrol Harian Pendidikan','Bandingkan jadwal Pondok dengan bukti absensi, finalisasi, izin Guru, dan laporan capaian.'],['Monitoring Absensi','Manajer memantau pembukaan/finalisasi dan tidak mengubah kehadiran santri milik Guru.'],['Monitoring Materi','Baca target dan capaian Guru. Jika belum tercapai, periksa alasan serta rencana tindak lanjut.'],['Monitoring Nilai','Gunakan filter bulan. Manajer memantau kelengkapan Draft/Final dan tindak lanjut akademik, bukan mengubah nilai.'],['Temuan & Tindak Lanjut','Temuan adalah masalah operasional, bukan otomatis pelanggaran. Proses sampai perbaikan, evaluasi, atau selesai.'],['Pembinaan Guru','Gunakan Apresiasi, Coaching, Briefing Ulang, atau Target Perbaikan secara proporsional.'],['Eskalasi ke Supervisor','Eskalasi hanya bila masalah operasional tidak dapat diselesaikan. Sertakan alasan, ringkasan, dan keputusan/bantuan yang dibutuhkan.'],['Batas Kewenangan','Manajer tidak melakukan audit formal Supervisor, tidak mengubah data Guru, dan tidak memasukkan PKBM.'],['FAQ','Kelas gabungan tetap satu TeachingGroup. Masalah remedial tetap akademik; Konselor hanya untuk kasus non-akademik yang memang memerlukan penanganan.']];$('guide').innerHTML=sections.map(x=>`<section><h3>${x[0]}</h3><p>${x[1]}</p></section>`).join('');$('guide').hidden=false;$('state').hidden=true;$('summary').innerHTML=''}
function field(name,label,type='text',value='',extra=''){return`<label class="me-field ${type==='textarea'?'full':''}"><span>${label}</span>${type==='textarea'?`<textarea name="${name}" ${extra}>${esc(value)}</textarea>`:`<input name="${name}" type="${type}" value="${esc(value)}" ${extra}>`}</label>`}
function selectField(name,label,options,value=''){return`<label class="me-field"><span>${label}</span><select name="${name}">${options.map(([v,l])=>`<option value="${v}" ${v===value?'selected':''}>${l}</option>`).join('')}</select></label>`}
function openSheet(type,data={}){
  const findingDate=data.tanggal||$('selectedDate').value||jakartaDate();
  const forms={
    finding:{title:'Buat Temuan Operasional',eyebrow:'TEMUAN PENDIDIKAN',html:field('tanggal','Tanggal','date',findingDate)+field('personil','Guru / Personil','text',data.personil||'')+field('subject','Mata pelajaran / kelompok','text',data.subject||'')+field('finding','Temuan','textarea',data.summary||'', 'required')+selectField('priority','Prioritas',[['NORMAL','Normal'],['SEGERA','Segera']])},
    follow:{title:'Tindak Lanjut Temuan',eyebrow:'PERBAIKAN OPERASIONAL',html:field('analysis','Analisis singkat','textarea',data.analisis||'', 'required')+field('action','Tindakan Manajer','textarea',data.tindakanManajer||'', 'required')+field('target','Target perbaikan','textarea',data.targetPerbaikan||'', 'required')+field('deadline','Batas evaluasi','date',data.batasEvaluasi||jakartaDate())+selectField('status','Status',[['DIPROSES','Diproses'],['MENUNGGU_PERBAIKAN','Menunggu Perbaikan'],['PERLU_EVALUASI','Perlu Evaluasi'],['SELESAI','Selesai'],['DIESKALASI_KE_SUPERVISOR','Dieskalasi ke Supervisor']],F.status(data.status||'DIPROSES'))+field('reason','Alasan eskalasi','textarea',data.supervisorEscalation?.reason||'')+field('decision','Bantuan/keputusan yang dibutuhkan','textarea',data.supervisorEscalation?.decisionNeeded||'')},
    coach:{title:'Catat Pembinaan Guru',eyebrow:'PEMBINAAN OPERASIONAL',html:field('tanggal','Tanggal','date',jakartaDate())+field('guru','Guru','text',data.guru||'', 'required')+selectField('jenis','Jenis',[['APRESIASI','Apresiasi'],['COACHING','Coaching'],['BRIEFING_ULANG','Briefing Ulang'],['TARGET_PERBAIKAN','Target Perbaikan']])+field('basis','Basis / temuan')+field('discussion','Yang dibahas','textarea','', 'required')+field('guidance','Arahan','textarea')+field('target','Target perbaikan','textarea')+field('reviewDate','Tanggal evaluasi','date',shift(jakartaDate(),7))+field('result','Hasil','textarea')},
    observe:{title:'Observasi Pembelajaran',eyebrow:'OBSERVASI OPERASIONAL',html:field('tanggal','Tanggal','date',jakartaDate())+field('guru','Guru','text',data.guru||'', 'required')+field('mapel','Mata pelajaran','text','', 'required')+field('kelas','Kelas / TeachingGroup','text','', 'required')+selectField('condition','Kondisi',[['BERJALAN_BAIK','Berjalan Baik'],['PERLU_PERHATIAN','Perlu Perhatian'],['BERMASALAH','Bermasalah']])+field('notes','Catatan pelaksanaan','textarea','', 'required')+field('strength','Kekuatan','textarea')+field('improve','Area yang perlu diperbaiki','textarea')}
    ,revision:{title:'Buka Revisi Nilai',eyebrow:'SESI NILAI FINAL',html:`<p class="me-empty">${esc(data.guru)} • ${esc(data.mapel)} • ${esc(data.kelas)}<br>${esc(data.jenis)} • ${esc(data.periode)} • ${esc(data.tahun)} • Final</p>`+field('reason','Alasan Membuka Revisi','textarea','', 'required placeholder="Contoh: Guru tidak sengaja menekan Final, masih ada nilai yang perlu diperbaiki."')+'<p>Seluruh nilai yang sudah tersimpan tetap dipertahankan. Guru dapat memperbaiki sesi ini dan melakukan finalisasi kembali.</p>'}
  };
  const f=forms[type];if(!f)return;
  $('sheetTitle').textContent=f.title;$('sheetEyebrow').textContent=f.eyebrow;$('formFields').innerHTML=f.html;
  $('saveBtn').textContent=type==='revision'?'Buka Revisi Nilai':'Simpan';
  const form=$('actionForm');form.dataset.type=type;form.dataset.id=data.id||'';form.dataset.sourceType=data.sourceType||'';form.dataset.sourceId=data.sourceId||'';form.dataset.sourcePath=data.sourcePath||'';
  $('sheet').classList.add('open');
}
async function saveAction(e){
  e.preventDefault();if(state.busy)return;assert();
  const form=new FormData(e.currentTarget),type=e.currentTarget.dataset.type,id=e.currentTarget.dataset.id||'',v=Object.fromEntries(form),now=new Date().toISOString(),base={unit,area:'PENDIDIKAN',programDomain:'KEPONDOKAN',managedRole:'GURU_PONDOK',createdBy:identity.name,createdById:identity.id,updatedAt:now};
  state.busy=true;$('saveBtn').disabled=true;$('saveBtn').textContent='Menyimpan…';
  try{
    if(type==='revision'){
      await openScoreRevision(id,String(v.reason||'').trim());
      toast('Sesi nilai dibuka untuk revisi.');
    }else if(type==='finding'){
      const key=`finding_${v.tanggal}_${identity.id||'manager'}_${Date.now()}`,sourceType=e.currentTarget.dataset.sourceType||'MANUAL',sourceId=e.currentTarget.dataset.sourceId||'',sourcePath=e.currentTarget.dataset.sourcePath||'';
      const payload={...base,id:key,tanggal:v.tanggal,personil:v.personil,subject:v.subject,temuan:v.finding,masalah:v.finding,priority:v.priority,status:'Baru',sourceType,sourceId,sourcePath,createdAt:now,history:[{type:'TEMUAN_DIBUAT',sourceType,actor:identity.name,at:now}]};
      await set(ref(db,`${PATH.findings}/${key}`),payload);
      invalidateFindingCache();
      state.recentFindings=[...state.recentFindings.filter(item=>item.id!==key),payload];
      sharedCache?.set(`${cacheKey}:recent-findings`,state.recentFindings);
      toast('Temuan berhasil disimpan.');
    }else if(type==='follow'){
      const old=state.findings.find(x=>x.id===id)||{},escalate=v.status==='DIESKALASI_KE_SUPERVISOR',event={type:escalate?'ESKALASI_SUPERVISOR':'TINDAK_LANJUT',actor:identity.name,at:now,status:v.status};
      const patch={analisis:v.analysis,tindakanManajer:v.action,targetPerbaikan:v.target,batasEvaluasi:v.deadline,status:F.statusLabel(v.status),updatedAt:now,history:[...(old.history||[]),event]};
      if(escalate){if(!v.reason.trim()||!v.decision.trim())throw new Error('Lengkapi alasan dan bantuan/keputusan yang dibutuhkan.');patch.supervisorEscalation={...(old.supervisorEscalation||{}),requestedBy:identity.name,requestedById:identity.id,requestedAt:now,reason:v.reason.trim(),summary:v.analysis.trim(),decisionNeeded:v.decision.trim(),response:old.supervisorEscalation?.response||null}}
      await update(ref(db,`${PATH.findings}/${id}`),patch);
      invalidateFindingCache();
      const saved={...old,...patch,id};
      state.recentFindings=[...state.recentFindings.filter(item=>item.id!==id),saved];
      const priorRecent=sharedCache?.get(`${cacheKey}:recent-findings`,300000)||[];
      sharedCache?.set(`${cacheKey}:recent-findings`,[...priorRecent.filter(item=>item.id!==id),saved]);
    }else if(type==='coach'){
      const key=`coach_${v.tanggal}_${identity.id||'manager'}_${Date.now()}`,payload={...base,id:key,tanggal:v.tanggal,guru:v.guru,jenis:v.jenis,jenisLabel:{APRESIASI:'Apresiasi',COACHING:'Coaching',BRIEFING_ULANG:'Briefing Ulang',TARGET_PERBAIKAN:'Target Perbaikan'}[v.jenis],basis:v.basis,pembahasan:v.discussion,arahan:v.guidance,targetPerbaikan:v.target,tanggalEvaluasi:v.reviewDate,hasil:v.result,sourceFinding:e.currentTarget.dataset.sourceFinding||'',createdAt:now};
      await set(ref(db,`${PATH.coaching}/${key}`),payload);
    }else if(type==='observe'){
      const key=`obs_pendidikan_${v.tanggal}_${identity.id||'manager'}_${Date.now()}`,payload={...base,id:key,tanggal:v.tanggal,jenis:'pembelajaran',tipeObservasi:'OPERASIONAL_MANAJER',guru:v.guru,mapel:v.mapel,kelas:v.kelas,kondisiOperasional:v.condition,catatanPelaksanaan:v.notes,kekuatan:v.strength,areaPerbaikan:v.improve,createdAt:now};
      await set(ref(db,`${PATH.observation}/${key}`),payload);
    }
    $('sheet').classList.remove('open');if(type!=='finding'&&type!=='revision')toast('Catatan tersimpan.');
    try{await loadCurrent()}catch(error){console.error('Data tersimpan, tetapi pemuatan ulang gagal',error);setState('Catatan tersimpan, tetapi daftar belum dapat dimuat. Coba Segarkan.');toast('Catatan tersimpan, tetapi daftar belum dapat dimuat.')}
  }catch(err){console.error('Gagal menyimpan catatan Manajer Pendidikan',err);toast(type==='finding'?'Temuan gagal disimpan.':err.message||'Catatan gagal disimpan.')}finally{state.busy=false;$('saveBtn').disabled=false;$('saveBtn').textContent=type==='revision'?'Buka Revisi Nilai':'Simpan'}
}
async function openScoreRevision(key,reason){
  assert();if(!reason)throw new Error('Alasan membuka revisi wajib diisi.');
  const initial=state.scoreSessions.get(key);
  if(!initial||initial.marker.status!=='FINAL')throw new Error('Sesi Final tidak tersedia. Segarkan rekap.');
  const [markerSnap,indexSnap]=await Promise.all([get(ref(db,`${PATH.final}/${key}`)),get(ref(db,`${PATH.scoreIndex}/${key}`))]);
  assert();const marker=markerSnap.val(),index=indexSnap.val()||{},items=Object.entries(index);
  if(!marker||marker.status!=='FINAL'||marker.locked!==true||marker.sessionKey!==key||marker.finalAt!==initial.marker.finalAt||!scoreSessionScope(marker,items.map(([,x])=>x)))throw new Error('Sesi berubah atau berada di luar scope. Segarkan rekap.');
  const source=await Promise.all(items.map(([,item])=>get(ref(db,`${item.dbPath}/${item.recordKey}`))));
  if(source.some((snap,i)=>!snap.exists()||snap.val().status_nilai!=='FINAL'||snap.val().locked!==true||snap.val().updated_at!==items[i][1].data.updated_at))throw new Error('Nilai telah berubah sejak rekap dimuat. Segarkan dahulu.');
  const at=new Date().toISOString(),cycle=Number(marker.revisionCycle||0)+1,updates={};
  items.forEach(([studentKey,item],i)=>{
    const previous=source[i].val(),data={...previous,status_nilai:'DRAFT',locked:false,revision_cycle:cycle,revision_opened_at:at,revision_opened_by:identity.name,revision_opened_by_id:identity.id,revision_reason:reason,updated_at:at};
    updates[`${item.dbPath}/${item.recordKey}`]=data;
    updates[`${PATH.scoreIndex}/${key}/${studentKey}`]={...item,data,updatedAt:at,status:'REVISION_OPEN'};
    const academicWaliKey=String(data.studentKey||data.nama_santri||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    data.studentKey=academicWaliKey;
    if(academicWaliKey)updates[`cahaya_app/wali_index/${academicWaliKey}/nilai_akademik/${item.recordKey}`]=data;
    if(marker.jenisUjian==='Bulanan'){
      const waliKey=academicWaliKey;
      if(waliKey)updates[`cahaya_app/wali_index/${waliKey}/nilai_bulanan/${item.recordKey}`]=data;
    }
    const teacherName=String(marker.guru||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(abah|abi|ummi|ustadzah|ustadz|ust|muallimah|muallim|guru|bapak|ibu|pak|bu|dr|s pd|m pd|mpd|se)\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
    const teacher=scoreHash(String(data.guruKode||marker.guruKode||teacherName||'guru'));
    const year=scoreHash(String(marker.tahunAkademik||'2026/2027')),period=scoreHash(String(marker.periode||'periode'));
    const className=data.kelas_kelompok||data.kelas||'',student=data.nama_santri||'';
    const ringkas=`cahaya_app/guru_nilai_ringkas/${teacher}/${year}/${period}/${scoreHash(`${className}|${student}|${marker.mapel}`)}`;
    if(marker.jenisUjian==='Bulanan'){
      updates[`${ringkas}/statusNilai`]='DRAFT';updates[`${ringkas}/is_remedial`]=data.is_remedial===true;
    }
    const tindak=`cahaya_app/guru_tindak_lanjut_index/${teacher}/${year}/${period}/${scoreHash(`${className}|${student}|${marker.mapel}|${marker.jenisUjian}|${marker.kodePenilaian||''}`)}`;
    updates[`${tindak}/statusNilai`]='DRAFT';updates[`${tindak}/is_remedial`]=data.is_remedial===true;
  });
  updates[`${PATH.final}/${key}`]={...marker,status:'REVISION_OPEN',locked:false,revisionCycle:cycle,revisionReason:reason,revisionOpenedAt:at,revisionOpenedBy:identity.name,revisionOpenedById:identity.id,revisionHistory:[...(marker.revisionHistory||[]),{cycle,at,by:identity.name,userId:identity.id,reason}]};
  // RTDB multi-location update is atomic. The source and all known projections change together.
  await update(ref(db),updates);
  sharedCache?.clear(`${cacheKey}:scores`);
}
async function loadCurrent(){assert();$('guide').hidden=true;if(view==='control')return loadControl();if(view==='material')return loadMaterial();if(view==='scores')return loadScores();if(view==='teachers')return loadTeachers();if(view==='followup')return loadFindings(false);if(view==='findings')return loadFindings(true);if(view==='coaching')return loadCoaching();if(view==='observation')return loadObservations();if(view==='kpi')return loadKpi();if(view==='guide')return guide()}
function openManagerFeature(targetView,teacher,menuId){const route=`manajer/pendidikan-v2.html?v=232&view=${encodeURIComponent(targetView)}&guru=${encodeURIComponent(teacher||'')}`;try{if(parent!==window&&typeof parent.loadPage==='function'){parent.loadPage(route,parent.document.getElementById(menuId));return}}catch{}location.href=`../${route}`}
document.addEventListener('click',event=>{const button=event.target.closest('[data-revise-score]');if(!button)return;const marker=state.scoreSessions.get(button.dataset.reviseScore)?.marker;if(marker)openSheet('revision',{id:button.dataset.reviseScore,guru:marker.guru,mapel:marker.mapel,kelas:sessionClasses(marker).join(' + '),jenis:marker.jenisUjian,periode:marker.periode,tahun:marker.tahunAkademik})});
async function setup(){assert();const c=config[view]||config.control;$('eyebrow').textContent=c[0];$('pageTitle').textContent=c[1];$('pageSubtitle').textContent=c[2];$('identityChip').textContent=identity.name;$('unitChip').textContent=unitLabel;$('scopeChip').textContent=`${unitLabel} • Kepondokan`;const today=jakartaDate(),month=/^\d{4}-\d{2}$/.test(params.get('bulan')||'')?params.get('bulan'):today.slice(0,7),r=range('MONTH');$('selectedDate').value=today;$('selectedMonth').value=month;$('startDate').value=r.start;$('endDate').value=r.end;const daily=['control','material'].includes(view),monthly=view==='scores',ranged=['followup','findings','coaching','observation','kpi'].includes(view);$('dateTools').hidden=!daily;$('monthTools').hidden=!monthly;$('rangeTools').hidden=!ranged;if(view==='guide'){$('dateTools').hidden=$('monthTools').hidden=$('rangeTools').hidden=true}await loadCurrent();const teacher=params.get('guru')||'';if(teacher&&view==='coaching')openSheet('coach',{guru:teacher});if(teacher&&view==='observation')openSheet('observe',{guru:teacher});if(params.get('createFinding')==='1')openSheet('finding',{tanggal:params.get('tanggal')||today,sourceId:params.get('sourceId')||'',sourceType:params.get('sourceType')||'MANUAL',sourcePath:params.get('sourcePath')||'',personil:params.get('personil')||'',subject:params.get('subject')||'',summary:params.get('summary')||''})}
document.addEventListener('click',e=>{const d=e.target.closest('[data-date]'),r=e.target.closest('[data-range]'),nf=e.target.closest('[data-new-finding]'),follow=e.target.closest('[data-follow]'),coach=e.target.closest('[data-coach]'),observe=e.target.closest('[data-observe]'),feature=e.target.closest('[data-open-feature]');if(d){$('selectedDate').value=jakartaDate();loadCurrent()}if(r){const x=range(r.dataset.range);$('startDate').value=x.start;$('endDate').value=x.end;loadCurrent()}if(nf)openSheet('finding',{tanggal:nf.dataset.sourceDate,sourceId:nf.dataset.newFinding,sourceType:nf.dataset.source,sourcePath:nf.dataset.sourcePath,personil:nf.dataset.personnel,subject:nf.dataset.subject,summary:nf.dataset.summary});if(follow)openSheet('follow',state.findings.find(x=>x.id===follow.dataset.follow)||{});if(coach)openSheet('coach',{guru:coach.dataset.coach});if(observe)openSheet('observe',{guru:observe.dataset.observe});if(feature)openManagerFeature(feature.dataset.openFeature,feature.dataset.teacher,feature.dataset.menu)});$('closeSheet').onclick=()=>$('sheet').classList.remove('open');$('actionForm').onsubmit=saveAction;$('reloadBtn').onclick=loadCurrent;$('reloadMonthBtn').onclick=loadCurrent;['selectedDate','selectedMonth','startDate','endDate'].forEach(id=>$(id).onchange=loadCurrent);$('backBtn').onclick=()=>parent!==window&&typeof parent.openAuthorizedMenu==='function'?parent.openAuthorizedMenu('menu-home'):history.back();addEventListener('cahaya:suspend',()=>{state.suspended=true;state.schedule=[];state.rows=[];state.findings=[]});document.addEventListener('visibilitychange',()=>{if(document.hidden)state.suspended=true;else if(state.suspended){state.suspended=false;loadCurrent()}});setup().catch(error=>{console.error('Gagal memuat workspace Manajer Pendidikan',error);const message=String(error?.message||'').startsWith('Jadwal Kepondokan')?error.message:'Data belum dapat dimuat. Coba Segarkan.';setState(message);toast(message)});
