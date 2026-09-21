(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CahayaSupervisorV2=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const ROLE_AREA=Object.freeze({GURU_PONDOK:'PENDIDIKAN',GURU_PKBM:'PKBM',NAQIB:'PEMBINAAN_KARAKTER',NAQIBAH:'PEMBINAAN_KARAKTER',MENTOR_USRAH:'PEMBINAAN_KARAKTER',KONSELOR:'PEMBINAAN_KARAKTER',DAPUR:'DAPUR',SARPRAS:'SARPRAS',KESEHATAN:'KESEHATAN',LAYANAN_KEBERSIHAN:'LAYANAN_KEBERSIHAN',MEDIA:'MEDIA'});
  const AREA_LABEL=Object.freeze({PENDIDIKAN:'Pendidikan',PKBM:'PKBM',PEMBINAAN_KARAKTER:'Pembinaan Karakter',DAPUR:'Dapur',SARPRAS:'Sarpras',KESEHATAN:'Kesehatan',LAYANAN_KEBERSIHAN:'Layanan & Kebersihan',MEDIA:'Media'});
  const MANAGED=new Set(['PENDIDIKAN','PEMBINAAN_KARAKTER']);
  const norm=v=>String(v??'').trim().toUpperCase().replace(/[\s/-]+/g,'_');
  function areas(assignment){
    const roles=Array.isArray(assignment?.supervisedRoles)?assignment.supervisedRoles:[];
    const fromRoles=[...new Set(roles.map(role=>ROLE_AREA[role]).filter(Boolean))];
    const rawDivisions=Array.isArray(assignment?.divisionIds)?assignment.divisionIds:[];
    const explicit=rawDivisions.map(norm).filter(a=>AREA_LABEL[a]);
    return rawDivisions.length?fromRoles.filter(a=>explicit.includes(a)):fromRoles;
  }
  function allows(assignment,area,unit){return areas(assignment).includes(norm(area))&&(!unit||assignment?.unit==='ALL'||norm(assignment?.unit)===norm(unit))}
  function unitOf(record){const raw=norm(record?.unit||record?.unitAsrama||record?.caseV2?.unit||'');return raw==='PUTRA'||raw==='PUTRI'?raw:''}
  function inScope(record,assignment,area){const recordUnit=unitOf(record);return allows(assignment,area,recordUnit)&&Boolean(recordUnit||assignment?.unit==='ALL')}
  function status(value){const v=norm(value);return ['SELESAI','TUNTAS','CLOSED'].includes(v)?'SELESAI':['DIESKALASI_KE_SUPERVISOR','DIESKALASI','ESKALASI'].includes(v)?'DIESKALASI_KE_SUPERVISOR':v||'BARU'}
  function dateOf(record){return String(record?.tanggal||record?.date||record?.weekStart||record?.createdAt||record?.timestamp||'').slice(0,10)}
  function dateRange(today,kind){const d=new Date(today+'T12:00:00+07:00');if(kind==='TODAY')return{from:today,to:today};if(kind==='WEEK'){const offset=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-offset);return{from:d.toISOString().slice(0,10),to:today}}return{from:today.slice(0,8)+'01',to:today}}
  return Object.freeze({ROLE_AREA,AREA_LABEL,MANAGED,norm,areas,allows,unitOf,inScope,status,dateOf,dateRange});
});
