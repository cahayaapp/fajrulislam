(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaNaqibProgramToday=api})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DAY_KEYS=['ahad','senin','selasa','rabu','kamis','jumat','sabtu'];
  const DEFAULT_BLOCKS=Object.freeze({blok1:{mulai:'03:30',selesai:'11:20'},blok2:{mulai:'11:20',selesai:'17:50'},blok3:{mulai:'17:50',selesai:'03:30'}});
  const PIC_ALIASES=Object.freeze({dandy:Object.freeze(['dandy','dandi'])});
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function timeMinutes(value){const m=String(value||'').match(/(\d{1,2})[.:](\d{2})/);return m?Number(m[1])*60+Number(m[2]):null}
  function timeRange(value,startValue,endValue){const raw=String(value||''),parts=raw.split(/[–—-]/),start=timeMinutes(startValue)||timeMinutes(parts[0]),end=timeMinutes(endValue)||timeMinutes(parts[1]);return {start,end,allDay:/seharian/i.test(raw)}}
  function jakartaParts(date=new Date()){
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
    const dayMap={Sun:'ahad',Mon:'senin',Tue:'selasa',Wed:'rabu',Thu:'kamis',Fri:'jumat',Sat:'sabtu'};
    return {date:`${p.year}-${p.month}-${p.day}`,day:dayMap[p.weekday],minutes:Number(p.hour)*60+Number(p.minute)};
  }
  function basePrograms(daily=[],weekly=[],date=new Date()){
    const day=jakartaParts(date).day,rows=[];
    daily.forEach((p,i)=>rows.push({id:String(p.id||`daily-${i}`),name:String(p.program||p.nama||'').trim(),time:String(p.waktu||''),start:p.mulai,end:p.selesai,category:p.kategori||'Program Harian',location:p.lokasi||'',group:p.kelompok||p.usrah||'',pic:p.pengawas||'',order:Number(p.no||p.urutan||i+1),source:'LOCAL_DAILY'}));
    weekly.filter(p=>!Array.isArray(p.hariAktif)||p.hariAktif.includes(day)).forEach((p,i)=>rows.push({id:String(p.id||`weekly-${i}`),name:String(p.program||p.nama||'').trim(),time:String(p.waktu||''),start:p.mulai,end:p.selesai,category:p.kategori||p.frekuensi||'Program Pekanan',location:p.lokasi||'',group:p.kelompok||p.usrah||'',pic:p.pengawas||'',order:Number(p.no||p.urutan||100+i),source:'LOCAL_WEEKLY'}));
    return rows.filter(p=>p.name).sort((a,b)=>{const at=timeRange(a.time,a.start,a.end),bt=timeRange(b.time,b.start,b.end);return (at.allDay?-1:(at.start??9999))-(bt.allDay?-1:(bt.start??9999))||a.order-b.order});
  }
  function picKey(value){const flat=norm(String(value||'').replace(/\b(?:abi|ustadz|ustaz|ust|ummi|naqib|naqibah)\b/gi,' '));for(const [key,aliases] of Object.entries(PIC_ALIASES))if(aliases.some(alias=>flat.includes(alias)))return key;return flat}
  function samePerson(a,b){if(Array.isArray(a))return a.some(value=>samePerson(value,b));if(Array.isArray(b))return b.some(value=>samePerson(a,value));const x=picKey(a),y=picKey(b);return Boolean(x&&y&&(x===y||x.includes(y)||y.includes(x)))}
  function previousDay(day){const i=DAY_KEYS.indexOf(day);return DAY_KEYS[(i+6)%7]}
  function inBlock(start,from,to){if(start==null||from==null||to==null)return false;return to>from?start>=from&&start<to:start>=from||start<to}
  function normalizeDutySchedule(raw={}){const source=raw?.blok&&raw?.jadwal?raw:raw?.putra?.blok&&raw?.putra?.jadwal?raw.putra:{};return {blok:{...DEFAULT_BLOCKS,...(source.blok||{})},jadwal:source.jadwal||{},versi:source.versi||raw.versi||'',zonaWaktu:source.zonaWaktu||raw.zonaWaktu||'Asia/Jakarta'}}
  function currentDuty(raw,clock=jakartaParts()){
    const schedule=normalizeDutySchedule(raw),minutes=Number(clock.minutes),afterMidnight=minutes<210,blockId=afterMidnight?'blok3':minutes<680?'blok1':minutes<1070?'blok2':'blok3',scheduleDay=afterMidnight?previousDay(clock.day):clock.day,block=schedule.blok[blockId]||DEFAULT_BLOCKS[blockId];
    return {blockId,scheduleDay,petugas:String(schedule.jadwal?.[scheduleDay]?.[blockId]||'').trim(),mulai:block.mulai,selesai:block.selesai,timezone:'Asia/Jakarta'};
  }
  function blockForProgram(program,raw,day){
    const schedule=normalizeDutySchedule(raw),range=timeRange(program.time,program.start,program.end),start=range.allDay?0:range.start;
    if(start==null)return null;
    for(const [blockId,block] of Object.entries(schedule.blok)){const from=timeMinutes(block.mulai),to=timeMinutes(block.selesai);if(!inBlock(start,from,to))continue;const scheduleDay=to!=null&&from!=null&&to<from&&start<to?previousDay(day):day;return {blockId,block:`Blok ${String(blockId).replace(/\D/g,'')}`,scheduleDay,assignedNaqib:String(schedule.jadwal?.[scheduleDay]?.[blockId]||'').trim()}}
    return null;
  }
  function dutyScope(programs,raw,userName,day,minutes){
    const schedule=normalizeDutySchedule(raw),blocks=schedule.blok,week=schedule.jadwal;
    if(!Object.keys(week).length)return {programs,configured:false,matched:true,message:'Penugasan PIC belum tersedia; menampilkan program unit.'};
    const configured=Object.values(week).some(v=>v&&Object.values(v).some(Boolean));
    if(!configured)return {programs,configured:false,matched:true,message:'Penugasan PIC belum tersedia; menampilkan program unit.'};
    const selected=programs.map(program=>{const assignment=blockForProgram(program,schedule,day);return assignment&&samePerson(assignment.assignedNaqib,userName)?{...program,...assignment}:null}).filter(Boolean);
    const duty=currentDuty(schedule,{day,minutes}),onDuty=samePerson(duty.petugas,userName),message=onDuty?`Sedang bertugas • ${duty.blockId.replace('blok','Blok ')} • ${duty.petugas}`:selected.length?'Program disaring sesuai jadwal piket Anda.':`Petugas ${duty.blockId.replace('blok','Blok ')} saat ini: ${duty.petugas||'belum diatur'}.`;
    return {programs:selected,configured:true,matched:selected.length>0,onDuty,currentDuty:duty,message};
  }
  function applyAssignment(programs,schedule,{userName,day,minutes}){return dutyScope(programs,schedule,userName,day,minutes)}
  function stateFor(program,index,programs,nowMinutes){const range=timeRange(program.time,program.start,program.end);if(range.allDay)return {id:'all-day',label:'Sepanjang Hari'};if(range.start==null)return {id:'unknown',label:'Waktu Belum Diatur'};let end=range.end;const next=programs.slice(index+1).map(p=>timeRange(p.time,p.start,p.end).start).find(Number.isFinite);if(end==null)end=Number.isFinite(next)?next:range.start+30;if(end<=range.start){if(nowMinutes>=range.start||nowMinutes<end)return {id:'current',label:'Sedang Berjalan'};return nowMinutes<range.start&&nowMinutes>=end?{id:'upcoming',label:'Akan Datang'}:{id:'past',label:'Telah Lewat'}}if(nowMinutes>=range.start&&nowMinutes<end)return {id:'current',label:'Sedang Berjalan'};return nowMinutes<range.start?{id:'upcoming',label:'Akan Datang'}:{id:'past',label:'Telah Lewat'}}
  function unitOf(row){const value=norm(row?.unit||row?.unitPengawasan||row?.unitAsrama||row?.labelUsrah||row?.usrah||'');if(value.includes('putri')||/usrah(?:7|8)/.test(value))return'PUTRI';if(value.includes('putra')||/usrah(?:[1-6])/.test(value))return'PUTRA';return''}
  function recordMatchesProgram(row,program){const pid=norm(row?.programId),pname=norm(row?.programName||row?.program||row?.namaProgram),id=norm(program.id),name=norm(program.name);return Boolean((pid&&(pid===id||pid===name))||(pname&&(pname===name||pname===id)))}
  function attendanceDone(rows,program,unit){return (rows||[]).some(row=>unitOf(row)===unit&&recordMatchesProgram(row,program))}
  function reportDone(rows,program,unit,userName){return (rows||[]).some(row=>row?.tipeLaporan==='PROGRAM'&&row?.versiLaporan==='V2'&&unitOf(row)===unit&&(!userName||samePerson(row.naqib||row.petugasTerjadwal,userName))&&(!program.block||!row.blokPiket||norm(row.blokPiket)===norm(program.block))&&recordMatchesProgram(row,program))}
  function context(program,{date,unit,role}){return {programId:program.id,programName:program.name,tanggal:date,unit,activeRole:role,block:program.block||'',blockId:program.blockId||'',scheduleDay:program.scheduleDay||'',assignedNaqib:program.assignedNaqib||'',time:program.time||'',group:program.group||'',location:program.location||''}}
  return Object.freeze({DAY_KEYS,DEFAULT_BLOCKS,PIC_ALIASES,norm,esc,timeMinutes,timeRange,jakartaParts,basePrograms,picKey,samePerson,normalizeDutySchedule,currentDuty,blockForProgram,applyAssignment,stateFor,unitOf,recordMatchesProgram,attendanceDone,reportDone,context});
});
