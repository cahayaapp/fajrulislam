(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaCounselorCaseV2=api})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const ROOT='cahaya_app/log_lapor_inisiatif';
  const POINT_ROOT='cahaya_app/poin_manual';
  const SELF_ROOT='cahaya_app/self_asesmen_konselor';
  const PROGRAM_ATTENDANCE_ROOT='cahaya_app/absensi_program_harian';
  const LEARNING_ATTENDANCE_ROOT='cahaya_app/absensi_pembelajaran';
  const LEVELS=Object.freeze(['PEMULA','MADYA']);
  const UNITS=Object.freeze(['PUTRA','PUTRI']);
  const ROUTING_PRIORITY=Object.freeze(['MORAL','KRITIS','BERAT','MANUAL_ESCALATION','THREE_CONSECUTIVE_DAYS','ROUTINE']);
  const POINTS=Object.freeze({BIMBINGAN:0,RINGAN:-25,SEDANG:-50,BERAT:-100,KRITIS:-200});
  const FINAL_STATES=new Set(['SELESAI','TIDAK_TERBUKTI','DIBERSIHKAN']);
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
  const nameKey=v=>norm(v).replace(/^(SANTRI|ANANDA)_/,'');
  const dateOnly=v=>{const m=String(v||'').match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:''};
  const shiftDate=(date,delta)=>{if(!dateOnly(date))return'';const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)};
  function jakartaDate(date=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),get=t=>parts.find(x=>x.type===t)?.value||'';return`${get('year')}-${get('month')}-${get('day')}`}
  function calendarRange(shortcut='MONTH',today=jakartaDate()){
    const end=dateOnly(today);if(!end)return Object.freeze({start:'',end:''});
    if(shortcut==='TODAY')return Object.freeze({start:end,end});
    if(shortcut==='WEEK'){const d=new Date(end+'T12:00:00Z'),day=(d.getUTCDay()+6)%7;return Object.freeze({start:shiftDate(end,-day),end})}
    return Object.freeze({start:end.slice(0,8)+'01',end});
  }
  function validRange(start,end){start=dateOnly(start);end=dateOnly(end);return Boolean(start&&end&&start<=end)}
  function counselorLevel(value){const v=norm(value);return v==='MUDA'?'MADYA':LEVELS.includes(v)?v:''}
  function violationCode(raw={}){
    const attendance=normalizeAttendanceStatus(raw.violationCode||raw.statusFinal||raw.statusAkhir||raw.status);
    if(attendance)return attendance;
    const candidates=[raw.kodePelanggaran,raw.violationCode,raw.jenisPelanggaran,raw.kategoriKhusus,raw.bidangPelanggaran,raw.kategori,raw.jenis];
    const token=candidates.map(norm).find(Boolean)||'PELANGGARAN_LAIN';
    if(token.includes('MORAL')||token.includes('ETIKA'))return'MORAL';
    if(token.includes('BOLOS'))return'BOLOS_PROGRAM';
    if(token.includes('TERLAMBAT'))return'TERLAMBAT_PROGRAM';
    if(token.includes('KEBERSIH'))return'KEBERSIHAN';
    if(token.includes('KERAPI'))return'KERAPIAN';
    if(token.includes('KETERTIB'))return'KETERTIBAN_RINGAN';
    if(token.includes('DISIPLIN'))return'KEDISIPLINAN';
    return token;
  }
  function severity(raw={}){
    const candidates=[raw.caseV2?.severity,raw.severity,raw.tingkat,raw.kategoriAkhir,raw.kategoriKhusus,raw.kategori];
    for(const value of candidates){const v=norm(value);if(['RINGAN','SEDANG','BERAT','KRITIS'].includes(v))return v;if(v.includes('KRITIS'))return'KRITIS';if(v.includes('BERAT'))return'BERAT';}
    return raw.kritis===true?'KRITIS':'';
  }
  function normalizeAttendanceStatus(value){const v=norm(value);if(['A','ALFA'].includes(v))return'ALFA';if(['T','TERLAMBAT'].includes(v))return'TERLAMBAT';return''}
  function isViolation(raw={}){return norm(raw.tipe).includes('LAPOR_PELANGGARAN')||norm(raw.tipe).includes('ATTENDANCE_VIOLATION')||Boolean(raw.bidangPelanggaran||raw.kodePelanggaran||raw.violationCode)}
  function normalizeCase(raw={},id=''){
    const cv=raw.caseV2&&typeof raw.caseV2==='object'?raw.caseV2:{};
    const student=raw.dilaporkan||raw.santri||raw.namaSantri||raw.nama_santri||'';
    const reportDate=dateOnly(raw.tanggal||raw.waktu||raw.timestamp||raw.createdAt);
    const level=counselorLevel(cv.routeLevel||raw.assignedCounselorLevel||raw.levelKonselor);
    const status=norm(cv.status||raw.statusPenanganan||raw.status||'MENUNGGU_KONSELOR');
    return Object.freeze({id:String(id||raw.idLaporan||raw.id||''),raw,student,studentKey:nameKey(student),unit:norm(cv.unit||raw.unit||raw.jenisKelamin||raw.gender),reporter:raw.pelapor||raw.namaPenginput||raw.naqibPendata||'',reportDate,reportTime:raw.waktu||raw.timestamp||'',code:violationCode(raw),category:raw.bidangPelanggaran||raw.kategori||raw.kategoriKhusus||'',severity:severity(raw),status,routeLevel:level,routingReason:cv.routingReason||'',assignedId:cv.claim?.assignedCounselorId||raw.assignedCounselorId||'',assignedName:cv.claim?.assignedCounselorName||raw.assignedCounselorName||'',escalated:Boolean(cv.escalation||raw.escalatedAt||status==='DIESKALASI'),pointRef:cv.pointTransactionId||raw.pointTransactionId||'',chronology:raw.keterangan||raw.kronologi||'',caseV2:cv,dbPath:raw.dbPath||'',sourceType:raw.sourceType||'',sourceBadge:raw.sourceBadge||'',sourceRecordId:raw.sourceRecordId||'',initialPoint:Number(raw.initialPoint??raw.poin??0)||0,context:raw.context&&typeof raw.context==='object'?raw.context:{}});
  }
  function attendanceFinal(item={},document={},sourceType=''){
    const code=normalizeAttendanceStatus(item.statusFinal||item.statusAkhir||item.status);
    if(!code)return false;
    if(item.final===false)return false;
    const parentState=norm(document.statusFinalisasi||document.tahapAbsensi||document.statusAbsensi);
    if(sourceType==='ABSENSI_KBM')return item.final===true||Boolean(normalizeAttendanceStatus(item.statusFinal||item.statusAkhir))||parentState==='FINAL';
    return !['BELUM_FINAL','AWAL','DRAFT'].includes(parentState);
  }
  function attendanceResolved(item={}){
    const state=norm(item.caseV2?.status||item.statusPenanganan||item.statusKonseling||item.statusPenindakan);
    return FINAL_STATES.has(state)||['SUDAH_KONSELING','SUDAH_DITINDAK','DIHAPUS'].includes(state);
  }
  function attendanceCases(records={},sourceType='ABSENSI_PROGRAM',options={}){
    const root=sourceType==='ABSENSI_KBM'?LEARNING_ATTENDANCE_ROOT:PROGRAM_ATTENDANCE_ROOT,prefix=sourceType==='ABSENSI_KBM'?'LEARNING':'PROGRAM',badge=sourceType==='ABSENSI_KBM'?'Absensi KBM':'Absensi Program';
    const out=[];
    for(const[key,document]of Object.entries(records||{})){
      const rows=Array.isArray(document?.data)?document.data:Object.values(document?.data||{});
      rows.forEach((item,index)=>{
        if(!item||!attendanceFinal(item,document,sourceType)||(!options.includeResolved&&attendanceResolved(item)))return;
        const code=normalizeAttendanceStatus(item.statusFinal||item.statusAkhir||item.status);if(!code)return;
        const id=`${prefix}-${key}-${index}`,dbPath=`${root}/${key}/data/${index}`,activity=document.program||document.namaProgram||document.kegiatan||document.mapel||document.mataPelajaran||'',mapel=document.mapel||document.mataPelajaran||'';
        const raw={...item,id,tipe:'Attendance Violation',attendanceStatus:item.status,violationCode:code,kodePelanggaran:code,bidangPelanggaran:'KEDISIPLINAN',status:item.caseV2?.status||item.statusPenanganan||'MENUNGGU_KONSELOR',tanggal:dateOnly(document.tanggal||document.date||document.waktu),waktu:item.waktuFinalisasi||document.waktuFinalisasi||document.waktu||document.timestamp||'',dilaporkan:item.nama||item.namaSantri||item.santri||'',unit:document.unit||document.unitPembelajaran||item.unit||'',pelapor:document.naqibPenginput||document.guru||document.namaPenginput||'Penginput Absensi',keterangan:`${code==='ALFA'?'Alfa':'Terlambat'} pada ${activity||badge}.`,caseV2:item.caseV2||{},dbPath,sourceType,sourceBadge:badge,sourceRecordId:key,initialPoint:Number(item.poin)||0,context:{program:sourceType==='ABSENSI_KBM'?'':activity,mapel:sourceType==='ABSENSI_KBM'?mapel:'',usrah:item.usrahAsal||document.usrah||document.labelUsrah||'',kelas:document.kelas||document.kelasDipilih||'',jadwalId:document.jadwalIdPresensi||document.jadwalId||'',hari:document.hariJadwal||'',jamMulai:document.jamMulai||'',jamSelesai:document.jamSelesai||''}};
        out.push(normalizeCase(raw,id));
      });
    }
    return out;
  }
  function excludeRepresented(cases=[],rows=[]){const ids=new Set(),paths=new Set();for(const x of rows||[]){if(x?.sumberCaseId)ids.add(String(x.sumberCaseId));if(x?.sumberPath)paths.add(String(x.sumberPath))}return cases.filter(c=>!ids.has(String(c.id))&&!paths.has(String(c.dbPath)))}
  function sameOccurrence(a,b){return a.studentKey&&a.studentKey===b.studentKey&&a.code===b.code&&a.reportDate===b.reportDate}
  function hasThreeConsecutive(current,records){
    current=current?.raw?current:normalizeCase(current,current?.id);
    if(!current.reportDate||!current.studentKey||!current.code)return false;
    const dates=new Set(records.map((r,i)=>r?.raw?r:normalizeCase(r,r?.id||String(i))).filter(r=>r.studentKey===current.studentKey&&r.code===current.code).map(r=>r.reportDate));
    return dates.has(current.reportDate)&&dates.has(shiftDate(current.reportDate,-1))&&dates.has(shiftDate(current.reportDate,-2));
  }
  function routeCase(item,nearby=[]){
    const c=item?.raw?item:normalizeCase(item,item?.id);
    const code=norm(c.code),sev=norm(c.severity);
    if(code==='MORAL'||norm(c.category).includes('MORAL')||norm(c.category).includes('ETIKA'))return Object.freeze({level:'MADYA',reason:'MORAL'});
    if(sev==='KRITIS')return Object.freeze({level:'MADYA',reason:'KRITIS'});
    if(sev==='BERAT')return Object.freeze({level:'MADYA',reason:'BERAT'});
    if(c.escalated)return Object.freeze({level:'MADYA',reason:'MANUAL_ESCALATION'});
    if(hasThreeConsecutive(c,nearby))return Object.freeze({level:'MADYA',reason:'THREE_CONSECUTIVE_DAYS'});
    return Object.freeze({level:'PEMULA',reason:'ROUTINE'});
  }
  function actionable(item,assignment,nearby=[],identity=''){
    const c=item?.raw?item:normalizeCase(item,item?.id),route=routeCase(c,nearby),level=c.routeLevel||route.level;
    if(!isViolation(c.raw)||!UNITS.includes(norm(assignment?.unit))||c.unit&&c.unit!==norm(assignment.unit))return false;
    if(c.assignedId&&identity&&nameKey(c.assignedId)!==nameKey(identity))return false;
    return counselorLevel(assignment?.level)===level&&!FINAL_STATES.has(c.status);
  }
  function pointFor(value){const v=norm(value);return Object.hasOwn(POINTS,v)?POINTS[v]:null}
  function nfdk(values={}){const n=['niat','frekuensi','dampak','kondisi'].reduce((sum,k)=>sum+(Number(values[k])||0),0);return Object.freeze({score:n,severity:n>=7?'KRITIS':n>=5?'BERAT':n>=2?'SEDANG':'RINGAN'})}
  function weekKey(date=new Date()){
    const d=new Date(date);d.setHours(12,0,0,0);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toISOString().slice(0,10);
  }
  function timeline(item){
    const c=item?.raw?item:normalizeCase(item,item?.id),raw=c.raw,cv=c.caseV2||{},events=[{type:'DILAPORKAN',at:raw.waktu||raw.timestamp||raw.tanggal,label:'Laporan diterima',by:c.reporter}];
    if(cv.routedAt)events.push({type:'DIRUTEKAN',at:cv.routedAt,label:`Dirutekan ke Konselor ${cv.routeLevel||''}`,by:'Sistem'});
    if(cv.claim?.assignedAt)events.push({type:'DIAMBIL',at:cv.claim.assignedAt,label:'Kasus diambil',by:cv.claim.assignedCounselorName});
    if(cv.tabayyun?.savedAt)events.push({type:'TABAYYUN',at:cv.tabayyun.savedAt,label:`Tabayyun: ${cv.tabayyun.conclusion||''}`,by:cv.tabayyun.counselorName});
    Object.values(cv.counseling||{}).forEach(x=>events.push({type:'KONSELING',at:x.savedAt||x.date,label:'Sesi konseling/pembinaan',by:x.counselorName}));
    if(cv.consequence?.savedAt)events.push({type:'KONSEKUENSI',at:cv.consequence.savedAt,label:cv.consequence.label||'Konsekuensi edukatif',by:cv.consequence.counselorName});
    if(cv.pointTransactionId)events.push({type:'POIN',at:cv.pointAt,label:`Transaksi poin ${cv.pointValue??''}`,by:cv.pointBy});
    if(cv.evaluation?.savedAt)events.push({type:'EVALUASI',at:cv.evaluation.savedAt,label:`Evaluasi: ${cv.evaluation.result||''}`,by:cv.evaluation.counselorName});
    if(cv.escalation?.escalatedAt)events.push({type:'ESKALASI',at:cv.escalation.escalatedAt,label:'Kasus dieskalasi ke Konselor Madya',by:cv.escalation.escalatedByName,note:[cv.escalation.reason,cv.escalation.note].filter(Boolean).join(' · ')});
    if(cv.higherEscalation?.requestedAt){const h=cv.higherEscalation,target=norm(h.targetRole);events.push({type:'ESKALASI_PIMPINAN',at:h.requestedAt,label:target==='DIREKTUR'?'Meminta keputusan Direktur':'Meminta arahan Supervisor',by:h.requestedByName,note:[h.reason,h.summary,h.decisionNeeded,h.urgency].filter(Boolean).join(' · ')});if(h.response?.respondedAt){events.push({type:'RESPONS_PIMPINAN',at:h.response.respondedAt,label:target==='DIREKTUR'?'Keputusan Direktur diterima':'Arahan Supervisor diterima',by:h.response.respondedBy,note:[h.response.decision,h.response.instruction,h.response.note].filter(Boolean).join(' · ')});events.push({type:'DILANJUTKAN_MADYA',at:h.response.respondedAt,label:'Dilanjutkan Konselor Madya',by:h.operationalHandlerName||cv.claim?.assignedCounselorName||'Konselor Madya'})}}
    if(cv.completedAt)events.push({type:'SELESAI',at:cv.completedAt,label:cv.status==='TIDAK_TERBUKTI'?'Ditutup: tidak terbukti':'Kasus selesai',by:cv.completedByName});
    return events.filter(x=>x.at).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
  }
  function canHigherAuthorityRespond(session,item){
    const c=item?.raw?item:normalizeCase(item,item?.id),role=norm(session?.activeRole),a=session?.activeAssignment||{},h=c.caseV2?.higherEscalation||{};
    if(!['SUPERVISOR','DIREKTUR'].includes(role)||norm(h.targetRole)!==role||h.response?.respondedAt||FINAL_STATES.has(c.status))return false;
    if(role==='SUPERVISOR'){
      if(!Array.isArray(a.supervisedRoles)||!a.supervisedRoles.includes('KONSELOR'))return false;
      const unit=norm(a.unit);if(!['PUTRA','PUTRI','ALL'].includes(unit)||c.unit&&unit!=='ALL'&&c.unit!==unit)return false;
    }
    return role!=='DIREKTUR'||a.unit==='ALL';
  }
  function higherResponsePatch(session,item,values={},identity={},now=new Date().toISOString()){
    if(!canHigherAuthorityRespond(session,item))return null;
    const role=norm(session.activeRole),isDirector=role==='DIREKTUR',decision=String(values.decision||'').trim(),instruction=String(values.instruction||'').trim(),note=String(values.note||'').trim();
    if((isDirector&&!decision)||!instruction)return null;
    const status=isDirector?'KEPUTUSAN_DIREKTUR_DITERIMA':'ARAHAN_SUPERVISOR_DITERIMA';
    return Object.freeze({status,response:Object.freeze({respondedBy:String(identity.name||identity.nama||identity.username||''),respondedById:String(identity.id||identity.uid||identity.username||''),respondedRole:role,respondedAt:now,decision:isDirector?decision:'',instruction,note})});
  }
  function claimPatch(identity={},assignment={},now=new Date().toISOString()){return{assignedCounselorId:String(identity.id||identity.username||''),assignedCounselorName:String(identity.name||identity.nama||identity.username||''),assignedCounselorLevel:counselorLevel(assignment.level),assignedAt:now}}
  function routingPatch(item,nearby,unit,now=new Date().toISOString()){const route=routeCase(item,nearby);return{routeLevel:route.level,routingReason:route.reason,unit:norm(unit),routedAt:now,status:'MENUNGGU_KONSELOR',version:2}}
  return Object.freeze({ROOT,POINT_ROOT,SELF_ROOT,PROGRAM_ATTENDANCE_ROOT,LEARNING_ATTENDANCE_ROOT,LEVELS,UNITS,ROUTING_PRIORITY,POINTS,norm,nameKey,dateOnly,shiftDate,jakartaDate,calendarRange,validRange,counselorLevel,violationCode,severity,isViolation,normalizeCase,normalizeAttendanceStatus,attendanceFinal,attendanceResolved,attendanceCases,excludeRepresented,sameOccurrence,hasThreeConsecutive,routeCase,actionable,pointFor,nfdk,weekKey,timeline,canHigherAuthorityRespond,higherResponsePatch,claimPatch,routingPatch,FINAL_STATES});
});
