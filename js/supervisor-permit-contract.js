(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaSupervisorPermitV2=api})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const norm=v=>String(v||'').trim().toUpperCase().replace(/[\s/-]+/g,'_');
  function unitOf(record){const direct=norm(record?.unit||record?.unitAsrama||record?.jenisKelamin||record?.gender);if(['PUTRA','LAKI_LAKI','LAKI','IKHWAN'].includes(direct))return'PUTRA';if(['PUTRI','PEREMPUAN','AKHWAT'].includes(direct))return'PUTRI';const context=[record?.kelas,record?.usrah,record?.asrama].filter(Boolean).join(' ').toUpperCase();if(/\bPUTRA\b|\bIKHWAN\b/.test(context))return'PUTRA';if(/\bPUTRI\b|\bAKHWAT\b/.test(context))return'PUTRI';return''}
  function status(value){const v=norm(value);if(['MENUNGGU_PIMPINAN','MENUNGGU','DIAJUKAN','PENDING','MENUNGGU_REVIEW'].includes(v))return'MENUNGGU_REVIEW';if(['PERLU_KONFIRMASI','MINTA_KONFIRMASI'].includes(v))return'PERLU_KONFIRMASI';return v}
  function source(record){return norm(record?.sumberPengajuan)==='UKS'?'UKS':norm(record?.sumberPengajuan)==='WALI'?'WALI_SANTRI':''}
  function allowed(assignment,areas,record){const unit=unitOf(record);return Array.isArray(areas)&&areas.includes('LAYANAN_KEBERSIHAN')&&Boolean(unit)&&(assignment?.unit==='ALL'||assignment?.unit===unit)}
  function waliKey(record){return String(record?.namaSantriKey||record?.namaSantri||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
  function dateOf(record){return String(record?.tanggalPengajuan||record?.diajukanPada||record?.createdAt||'').slice(0,10)}
  return Object.freeze({norm,unitOf,status,source,allowed,waliKey,dateOf});
});
