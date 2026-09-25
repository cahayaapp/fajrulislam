/* Shared schedule-based progress resolver for Supervisor and Manager Pendidikan. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CahayaAcademicInputProgress=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const key=value=>norm(value).replace(/\s+/g,'');
  const values=value=>Array.isArray(value)?value.filter(Boolean):Object.entries(value||{}).map(([id,item])=>item&&typeof item==='object'?{id,...item}:null).filter(Boolean);
  const classesOf=row=>[row?.kelas,...(Array.isArray(row?.classNames)?row.classNames:[])].map(String).map(x=>x.trim()).filter(Boolean);
  const unitOf=row=>{const text=norm([row?.unit,row?.unitPembelajaran,...classesOf(row)].join(' '));return text.includes('putri')?'PUTRI':text.includes('putra')?'PUTRA':''};
  const isPkbm=row=>/(^| )pkbm( |$)/.test(norm([row?.jenis,row?.programDomain,row?.domain,row?.unit,...classesOf(row),row?.sesi,row?.sumberJadwal].join(' ')));
  function activeSchedule(source,{unit='ALL'}={}){
    const active=values(source).filter(row=>row.aktif!==false&&norm(row.jenis)!=='ekskul'&&!isPkbm(row)).filter(row=>unit==='ALL'||!unitOf(row)||unitOf(row)===unit),years=[...new Set(active.map(row=>String(row.tahunAjaran||row.tahun_akademik||row.tahunAkademik||'').trim()).filter(Boolean))].sort((a,b)=>b.localeCompare(a,'id',{numeric:true})),latest=years[0]||'';
    return latest?active.filter(row=>String(row.tahunAjaran||row.tahun_akademik||row.tahunAkademik||'').trim()===latest):active;
  }
  function classNames(schedule){return [...new Set(activeSchedule(schedule).flatMap(classesOf))].sort((a,b)=>a.localeCompare(b,'id',{numeric:true}))}
  const teacherCode=row=>String(row?.guruKode||row?.teacherCode||'').trim().toUpperCase();
  const teacherName=row=>String(row?.guruNama||row?.guru||row?.guruKode||'Guru').trim();
  const subject=row=>String(typeof row==='string'?row:row?.mata_pelajaran||row?.mapel||row?.subject||'Mata Pelajaran').trim();
  const isQuran=value=>/(alquran|quran|tahsin|tahfiz)/.test(key(typeof value==='string'?value:subject(value)));
  const sameSubject=(a,b)=>isQuran(a)&&isQuran(b)||norm(subject(a))===norm(subject(b));
  function typeOf(record){const value=norm(record?.jenis_ujian||record?.jenisUjian||record?.jenis_penilaian||record?.jenisPenilaian||record?.__sourceType);return value.includes('triwulan')?'triwulan':value.includes('semester')?'semester':value.includes('bulan')?'bulanan':''}
  function periodOf(record,type){
    if(type==='bulanan'){
      const explicit=MONTHS.find(month=>norm(month)===norm(record?.bulan));if(explicit)return explicit;
      const match=String(record?.tanggal_ujian||record?.tanggal||'').match(/^\d{4}-(\d{2})-/);return match?MONTHS[Number(match[1])-1]||'':'';
    }
    const text=norm(record?.periode_ujian||record?.periode||record?.semester||'');
    if(type==='triwulan'){const match=text.match(/(?:triwulan|quarter|kuartal|t)\s*([1-4])/);return match?`Triwulan ${match[1]}`:''}
    if(/semester\s*1|ganjil/.test(text))return'Semester 1';if(/semester\s*2|genap/.test(text))return'Semester 2';return'';
  }
  const yearOf=record=>String(record?.tahun_akademik||record?.tahunAkademik||record?.tahunAjaran||'').trim();
  const studentName=record=>String(record?.nama_santri||record?.namaSantri||record?.nama||'').trim();
  const classOf=record=>String(record?.kelas_kelompok||record?.kelas||record?.namaKelas||'').trim();
  const isFinal=record=>norm(record?.status_nilai||record?.statusNilai||record?.status)==='final'&&record?.locked!==false;
  function recordsForPeriod(source,{type='bulanan',year='',period=''}={}){return values(source).filter(row=>typeOf(row)===type&&(!year||norm(yearOf(row))===norm(year))&&(!period||norm(periodOf(row,type))===norm(period)))}
  function masterRoster(master,classList){const source=master?.santriByClass||master||{};return classList.flatMap(className=>values(source[className]||[]).map(item=>({name:typeof item==='string'?item:String(item?.namaSantri||item?.nama||item?.name||''),studentKey:String(item?.studentKey||item?.santriId||item?.id||''),kelas:className}))).filter(x=>x.name)}
  function assignments(schedule,{classFilter=''}={}){
    const map=new Map();
    activeSchedule(schedule).forEach(row=>{const classList=classesOf(row);if(classFilter&&!classList.some(name=>norm(name)===norm(classFilter)))return;const id=[teacherCode(row)||norm(teacherName(row)),norm(subject(row)),...classList.map(norm).sort()].join('|');if(!map.has(id))map.set(id,{id,teacherCode:teacherCode(row),teacher:teacherName(row),subject:subject(row),classes:classList,sourceIds:[]});map.get(id).sourceIds.push(row.id||'')});
    return [...map.values()];
  }
  function teacherMatches(record,assignment){const code=String(record?.guruKode||record?.teacherCode||'').trim().toUpperCase();if(code&&assignment.teacherCode)return code===assignment.teacherCode;const actual=norm(record?.guru_penguji||record?.guru||record?.nama_guru||'');return actual&&[norm(assignment.teacher),norm(assignment.teacherCode)].some(value=>value&&(actual===value||actual.includes(value)||value.includes(actual)))}
  function scoreMatches(record,assignment){return assignment.classes.some(name=>norm(name)===norm(classOf(record)))&&sameSubject(record,assignment)&&teacherMatches(record,assignment)}
  function summarize({schedule=[],scores=[],master={},type='bulanan',year='',period='',unit='ALL',classFilter=''}={}){
    const scoped=activeSchedule(schedule,{unit}),periodScores=recordsForPeriod(scores,{type,year,period}),list=assignments(scoped,{classFilter}).map(assignment=>{
      const roster=masterRoster(master,assignment.classes),expected=roster.length;
      const matched=periodScores.filter(record=>scoreMatches(record,assignment)),latest=new Map();
      matched.forEach((record,index)=>{const id=key(record.studentKey||record.santriId||record.studentId||studentName(record)||index),previous=latest.get(id),stamp=Date.parse(record.updated_at||record.updatedAt||record.final_at||record.finalAt||0)||0,prior=previous?(Date.parse(previous.updated_at||previous.updatedAt||previous.final_at||previous.finalAt||0)||0):-1;if(!previous||stamp>=prior)latest.set(id,record)});
      const records=[...latest.values()],entered=records.length,final=records.filter(isFinal).length,partial=Math.max(0,entered-final),denominator=expected||entered;
      return{...assignment,expected:denominator,entered,final,partial,missing:Math.max(0,denominator-entered),progress:denominator?Math.round(entered/denominator*100):0,finalProgress:denominator?Math.round(final/denominator*100):0,records};
    });
    const teachers=new Map();list.forEach(item=>{const id=item.teacherCode||norm(item.teacher);if(!teachers.has(id))teachers.set(id,{id,teacher:item.teacher,teacherCode:item.teacherCode,assignments:[],expected:0,entered:0,final:0,partial:0});const group=teachers.get(id);group.assignments.push(item);group.expected+=item.expected;group.entered+=item.entered;group.final+=item.final;group.partial+=item.partial});
    return[...teachers.values()].map(group=>({...group,progress:group.expected?Math.round(group.entered/group.expected*100):0,finalProgress:group.expected?Math.round(group.final/group.expected*100):0})).sort((a,b)=>a.teacher.localeCompare(b.teacher,'id'));
  }
  return{MONTHS,norm,key,values,classesOf,unitOf,isPkbm,activeSchedule,classNames,teacherCode,teacherName,subject,isQuran,sameSubject,typeOf,periodOf,yearOf,studentName,classOf,isFinal,recordsForPeriod,masterRoster,assignments,scoreMatches,summarize};
});
