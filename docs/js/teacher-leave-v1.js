(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CahayaTeacherLeaveV1=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const TYPES=Object.freeze(['Sakit','Keperluan keluarga','Keperluan pribadi','Tugas dinas','Lainnya']);
  const STATUSES=Object.freeze(['PENDING_REVIEW','NEEDS_CONFIRMATION','APPROVED','REJECTED','CANCELLED']);
  const STATUS_LABEL=Object.freeze({PENDING_REVIEW:'Menunggu Persetujuan',NEEDS_CONFIRMATION:'Perlu Konfirmasi',APPROVED:'Disetujui',REJECTED:'Ditolak',CANCELLED:'Dibatalkan'});
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const key=v=>norm(v).replace(/ /g,'');
  const records=v=>Array.isArray(v)?v.filter(Boolean):Object.entries(v||{}).map(([id,x])=>x&&typeof x==='object'?({id,...x}):null).filter(Boolean);
  const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
  const time=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''));
  const stamp=(d,t)=>`${d}T${t}:00+07:00`;
  function status(row={}){const value=String(row.review?.status||row.status||'PENDING_REVIEW').toUpperCase();return STATUSES.includes(value)?value:'PENDING_REVIEW'}
  function label(value){return STATUS_LABEL[String(value||'').toUpperCase()]||'Menunggu Persetujuan'}
  function validate(input={}){
    const out={type:String(input.type||'').trim(),startDate:String(input.startDate||''),startTime:String(input.startTime||''),endDate:String(input.endDate||''),endTime:String(input.endTime||''),reason:String(input.reason||'').trim(),contact:String(input.contact||'').trim(),handover:String(input.handover||'').trim()};
    if(!TYPES.includes(out.type))throw Error('Jenis izin belum valid.');
    if(!date(out.startDate)||!date(out.endDate)||!time(out.startTime)||!time(out.endTime))throw Error('Tanggal dan waktu izin wajib diisi lengkap.');
    if(stamp(out.endDate,out.endTime)<stamp(out.startDate,out.startTime))throw Error('Waktu selesai tidak boleh lebih awal dari waktu mulai.');
    if(!out.reason||out.reason.length>2000)throw Error('Alasan izin wajib diisi, maksimal 2.000 karakter.');
    if(!out.contact||out.contact.length>100)throw Error('Kontak yang dapat dihubungi wajib diisi.');
    if(!out.handover||out.handover.length>2000)throw Error('Rencana penanganan kelas wajib diisi.');
    return out;
  }
  function unitOf(row={}){const text=norm([row.unit,row.kelas,row.rombel,row.kelas_kelompok].filter(Boolean).join(' '));return text.includes('putri')?'PUTRI':text.includes('putra')?'PUTRA':''}
  function requestUnits(lessons=[],fallback=''){const values=[...new Set(records(lessons).map(unitOf).filter(Boolean))];const clean=String(fallback||'').toUpperCase();if(!values.length&&['PUTRA','PUTRI'].includes(clean))values.push(clean);return values}
  function scopeAllows(row={},assignment={}){const unit=String(assignment.unit||'').toUpperCase(),units=Array.isArray(row.units)?row.units.map(x=>String(x).toUpperCase()):requestUnits(row.lessons,row.unit);return unit==='ALL'||!unit||units.includes(unit)||String(row.unit||'').toUpperCase()==='ALL'}
  function teacherOwns(row={},identity={}){const uid=String(identity.uid||''),teacherKey=String(identity.teacherKey||''),code=String(identity.teacherCode||'').toUpperCase();if(uid&&String(row.teacherUid||'')===uid)return true;if(teacherKey&&String(row.teacherKey||'')===teacherKey)return true;return Boolean(code&&String(row.teacherCode||'').toUpperCase()===code)}
  function decision(current={},input={},actor={}){
    const next=String(input.status||'').toUpperCase(),note=String(input.note||'').trim();
    if(!['APPROVED','REJECTED','NEEDS_CONFIRMATION'].includes(next))throw Error('Keputusan izin belum valid.');
    if(!note||note.length>1000)throw Error('Catatan keputusan wajib diisi, maksimal 1.000 karakter.');
    if(status(current)==='CANCELLED')throw Error('Pengajuan yang dibatalkan tidak dapat diputuskan.');
    const now=input.now||new Date().toISOString(),previous=current.review||null,history=records(current.reviewHistory);
    if(previous?.status)history.push(previous);
    return{status:next,note,reviewerUid:String(actor.uid||''),reviewerName:String(actor.name||'Supervisor Pendidikan'),reviewedAt:now,reviewVersion:Number(previous?.reviewVersion||0)+1,history};
  }
  function cancel(current={},actor={}){if(!teacherOwns(current,actor))throw Error('Pengajuan ini bukan milik akun Guru aktif.');if(status(current)!=='PENDING_REVIEW'&&status(current)!=='NEEDS_CONFIRMATION')throw Error('Pengajuan yang sudah diputuskan tidak dapat dibatalkan.');return{status:'CANCELLED',cancelledAt:new Date().toISOString(),cancelledByUid:String(actor.uid||'')}}
  function weekday(dateText){return new Date(`${dateText}T12:00:00+07:00`).getDay()}
  function daysBetween(start,end,max=62){const out=[],d=new Date(`${start}T12:00:00+07:00`),last=new Date(`${end}T12:00:00+07:00`);while(d<=last&&out.length<max){out.push(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(d));d.setDate(d.getDate()+1)}return out}
  function affectedLessons(input,schedule=[],identity={},matchesTeacher){
    const value=validate(input),dates=daysBetween(value.startDate,value.endDate),match=typeof matchesTeacher==='function'?matchesTeacher:(row=>{const code=String(row.guruKode||row.guruKodeKalender||row.kodeGuru||'').toUpperCase(),name=key(row.namaGuru||row.guruNama||row.guru||row.teacher);return identity.teacherCode&&code===String(identity.teacherCode).toUpperCase()||identity.nameKey&&name===identity.nameKey});
    const rows=[];records(schedule).filter(r=>r&&r.aktif!==false&&match(r)).forEach((r,index)=>dates.filter(d=>weekday(d)===Number(r.hari)).forEach(d=>{const start=String(r.jamMulai||String(r.waktu||'').split(/[–—-]/)[0]||'00:00').trim(),end=String(r.jamSelesai||String(r.waktu||'').split(/[–—-]/)[1]||'23:59').trim();if(stamp(d,end)<stamp(value.startDate,value.startTime)||stamp(d,start)>stamp(value.endDate,value.endTime))return;rows.push({scheduleId:String(r.id||r.jadwalId||`${r.hari}-${index}`),date:d,startTime:start,endTime:end,subject:String(r.mapel||r.mataPelajaran||r.namaMapel||'Pelajaran'),className:String(r.kelas||r.rombel||r.kelas_kelompok||'Kelas'),unit:unitOf(r)})}));
    return rows.sort((a,b)=>`${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }
  function managerVisible(row={},assignment={}){return ['APPROVED','REJECTED','NEEDS_CONFIRMATION'].includes(status(row))&&scopeAllows(row,assignment)}
  return Object.freeze({TYPES,STATUSES,STATUS_LABEL,norm,key,records,status,label,validate,unitOf,requestUnits,scopeAllows,teacherOwns,decision,cancel,affectedLessons,managerVisible});
});
