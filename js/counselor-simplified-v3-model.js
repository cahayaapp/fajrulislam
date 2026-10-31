(function(root,factory){const api=factory(root.CahayaCounselorCaseV2||(typeof require==='function'?require('./counselor-case-v2.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaCounselorSimplifiedV3=api})(typeof window!=='undefined'?window:globalThis,function(C){
  'use strict';
  const CLOSED=new Set(['TIDAK_TERBUKTI','DIBERSIHKAN','DIHAPUS']);
  const COMPLETE=new Set(['SELESAI','SUDAH_KONSELING','SUDAH_DITINDAK']);
  const dateOnly=C.dateOnly,norm=C.norm;
  function period(mode='WEEK',today=C.jakartaDate()){
    const day=dateOnly(today),d=new Date(day+'T12:00:00Z');
    if(mode==='MONTH')return{mode,start:day.slice(0,8)+'01',end:new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).toISOString().slice(0,10)};
    const offset=(d.getUTCDay()+6)%7,start=C.shiftDate(day,-offset);
    return{mode:'WEEK',start,end:C.shiftDate(start,6)}
  }
  function comparisonPeriods(mode='WEEK',today=C.jakartaDate()){
    const base=period(mode,today),ranges=[];
    for(let offset=3;offset>=0;offset--){
      if(base.mode==='WEEK'){ranges.push(period('WEEK',C.shiftDate(base.start,-offset*7)));continue}
      const month=new Date(base.start+'T12:00:00Z');month.setUTCMonth(month.getUTCMonth()-offset);
      ranges.push(period('MONTH',month.toISOString().slice(0,10)));
    }
    return ranges;
  }
  function cleared(row){const raw=row?.raw||row||{},cv=row?.caseV2||raw.caseV2||{};return Boolean(cv.clearance?.clearedAt||raw.excludedFromViolation||CLOSED.has(norm(cv.status||raw.statusPenanganan||raw.statusKonseling)))}
  function proven(row){const raw=row?.raw||row||{},cv=row?.caseV2||raw.caseV2||{},conclusion=norm(cv.tabayyun?.conclusion||raw.kesimpulanTabayyun||raw.kategoriAkhir),status=norm(cv.status||raw.statusPenanganan||raw.status);if(cleared(row)||conclusion==='TIDAK_TERBUKTI')return false;return conclusion==='TERBUKTI'||Boolean(cv.completedAt&&COMPLETE.has(status))||Boolean(raw.versiPenanganan&&COMPLETE.has(status)&&raw.sumberCaseId)||Boolean(raw.statusPenindakan==='SUDAH DITINDAK'&&raw.sumberCaseId)}
  function occurrenceDate(row){const raw=row?.raw||row||{},explicit=raw.tanggalKejadian||raw.tanggal||raw.date||row?.reportDate||raw.tanggalPenindakan||'';if(/^\d{4}-\d{2}-\d{2}$/.test(String(explicit)))return String(explicit);for(const value of [explicit,raw.waktu,raw.timestamp,raw.createdAt,raw.waktuPenindakan]){if(!value)continue;const parsed=new Date(value);if(!Number.isNaN(parsed.getTime()))return C.jakartaDate(parsed);const fallback=dateOnly(value);if(fallback)return fallback}return''}
  function sourceCases(reportRecords={},programRecords={},learningRecords={},handled=[]){
    const primary=Object.entries(reportRecords||{}).map(([id,raw])=>C.normalizeCase(raw,id)).filter(c=>C.isViolation(c.raw)||cleared(c));
    const attendance=[...C.attendanceCases(programRecords||{},'ABSENSI_PROGRAM',{includeResolved:true}),...C.attendanceCases(learningRecords||{},'ABSENSI_KBM',{includeResolved:true})];
    const representedIds=new Set(),representedPaths=new Set();
    [...primary.map(c=>c.raw),...handled].forEach(x=>{if(x?.sumberCaseId)representedIds.add(String(x.sumberCaseId));if(x?.sumberPath)representedPaths.add(String(x.sumberPath))});
    return [...primary,...attendance.filter(c=>!representedIds.has(c.id)&&!representedPaths.has(c.dbPath))]
  }
  function uniqueCases(rows=[]){const seen=new Set();return rows.filter(row=>{const raw=row?.raw||row||{},key=String(row.dbPath||raw.sumberPath||row.id||raw.sumberCaseId||raw.id||'');if(!key||seen.has(key))return false;seen.add(key);return true})}
  function evaluation(rows=[],selected=period()){
    const cases=uniqueCases(rows).filter(row=>proven(row)&&occurrenceDate(row)>=selected.start&&occurrenceDate(row)<=selected.end);
    const students=new Map(),types=new Map(),days=new Map();
    for(let date=selected.start;date<=selected.end;date=C.shiftDate(date,1))days.set(date,0);
    for(const row of cases){const raw=row.raw||row,student=String(row.student||raw.santri||raw.namaSantri||raw.dilaporkan||'Santri'),studentKey=String(raw.studentKey||raw.uidSantri||row.studentKey||C.nameKey(student)),code=String(row.code||C.violationCode(raw)),date=occurrenceDate(row),info=students.get(studentKey)||{student,studentKey,group:raw.kelas||raw.usrah||row.context?.kelas||row.context?.usrah||'',count:0,kinds:new Set()};info.count++;info.kinds.add(code);students.set(studentKey,info);types.set(code,(types.get(code)||0)+1);days.set(date,(days.get(date)||0)+1)}
    const typeRows=[...types].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
    const studentRows=[...students.values()].map(x=>({...x,kinds:[...x.kinds]})).sort((a,b)=>b.count-a.count||a.student.localeCompare(b.student));
    const trend=selected.mode==='MONTH'?groupWeeks(days,selected.start):[...days].map(([label,count])=>({label,count}));
    return{period:selected,total:cases.length,students:students.size,kinds:types.size,finished:cases.filter(x=>COMPLETE.has(norm(x.status||x.caseV2?.status||x.raw?.statusPenanganan))).length,types:typeRows,studentRows,trend}
  }
  function groupWeeks(days,start){const map=new Map(),first=new Date(start+'T12:00:00Z'),before=(first.getUTCDay()+6)%7;for(const[date,count]of days){const offset=Math.floor((Date.parse(date+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000),week=Math.floor((offset+before)/7)+1,label='Pekan '+week;map.set(label,(map.get(label)||0)+count)}return[...map].map(([label,count])=>({label,count}))}
  function bookCaseLabel(row){
    const raw=row?.raw||row||{},code=String(row?.code||raw.kodePelanggaran||raw.violationCode||'').trim(),shortCode=norm(code);
    if(shortCode!=='ALFA'&&shortCode!=='TERLAMBAT'){
      const specific=raw.jenisPelanggaran||raw.namaPelanggaran||raw.judulPelanggaran||raw.deskripsiPelanggaran||'';
      return String(specific||(row?.raw?code:raw.deskripsiAwal||raw.kategoriAkhir||code)||'Kasus');
    }
    const detail=String(raw.deskripsiAwal||row?.chronology||raw.keterangan||raw.kronologi||'').trim();
    const statedActivity=String(row?.context?.program||row?.context?.mapel||raw.context?.program||raw.context?.mapel||raw.program||raw.namaProgram||raw.kegiatan||raw.mapel||raw.mataPelajaran||'').trim();
    const describedActivity=detail.match(/^(?:alfa|terlambat)\s+pada\s+(.+?)[.!\s]*$/i)?.[1]||'';
    const activity=(statedActivity||describedActivity).replace(/[.!\s]+$/,'').trim();
    if(activity)return(code+' '+activity).toLocaleUpperCase('id-ID');
    if(detail.toLocaleUpperCase('id-ID').startsWith(shortCode+' '))return detail.replace(/[.!\s]+$/,'').toLocaleUpperCase('id-ID');
    return code;
  }
  function bookEntries(cases=[],legacy=[]){
    const entries=new Map(),clearedIds=new Set(cases.filter(cleared).map(x=>String(x.id||x.raw?.sumberCaseId||'')));
    for(const c of cases){if(cleared(c)||norm(c.caseV2?.tabayyun?.conclusion||c.raw?.caseV2?.tabayyun?.conclusion)==='TIDAK_TERBUKTI')continue;const cv=c.caseV2||c.raw?.caseV2||{},student=String(c.student||c.raw?.dilaporkan||''),studentKey=C.nameKey(student);if(!studentKey)continue;for(const[sessionKey,x]of Object.entries(cv.counseling||{})){const group=x.groupSessionId||x.sessionId||'',key=studentKey+'|'+(group||String(c.id)+'|'+sessionKey),previous=entries.get(key);const item=previous||{key,student,studentKey,group:c.raw?.kelas||c.raw?.usrah||c.context?.kelas||c.context?.usrah||'',date:x.savedAt||x.date||cv.completedAt||c.reportDate,counselor:x.counselorName||cv.completedByName||'',caseIds:[],cases:[],tabayyun:cv.tabayyun?.conclusion||'',what:x.what||x.purpose||'',why:x.why||'',how:x.how||x.improvementStep||'',consequence:x.consequence||cv.consequence?.label||'Tidak Ada',points:Number(cv.pointValue)||0};if(!item.caseIds.includes(String(c.id))){item.caseIds.push(String(c.id));item.cases.push(bookCaseLabel(c))}entries.set(key,item)}}
    for(const [legacyKey,x] of Object.entries(legacy||{})){if(!x||CLOSED.has(norm(x.status||x.kategoriAkhir))||clearedIds.has(String(x.sumberCaseId||'')))continue;const student=String(x.santri||x.namaSantri||''),studentKey=C.nameKey(student),sourceId=String(x.sumberCaseId||'');if(!studentKey||[...entries.values()].some(e=>sourceId&&e.studentKey===studentKey&&e.caseIds.includes(sourceId)))continue;const key=studentKey+'|legacy|'+legacyKey;entries.set(key,{key,student,studentKey,group:x.kelas||x.usrah||'',date:x.waktuKonseling||x.waktuPenindakan||x.tanggalPenindakan||'',counselor:x.konselorPenindak||x.penindak||'',caseIds:sourceId?[sourceId]:[],cases:[bookCaseLabel(x)],tabayyun:x.kategoriAkhir||'',what:x.targetPerbaikan||x.what||x.pembinaan||'',why:x.motivasiPerbaikan||x.why||'',how:x.strategiPerbaikan||x.how||x.tindakLanjut||'',consequence:x.konsekuensiEdukatif||x.pembinaan||'Tidak Ada',points:-Math.abs(Number(x.poinDipotong||x.poinDipotongKonselor)||0)})}
    return [...entries.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date)))
  }
  return Object.freeze({period,comparisonPeriods,cleared,proven,occurrenceDate,sourceCases,uniqueCases,evaluation,bookEntries})
});
