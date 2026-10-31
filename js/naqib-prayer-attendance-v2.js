(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaPrayerAttendanceV2=api})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const clean=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  function isCongregationalPrayer(program={}){const value=clean(`${program.id||''} ${program.nama||program.program||''}`);return/(?:shalat|sholat|salat)/.test(value)&&/(?:berjama|jamaah)/.test(value)}
  function stage(record,prayer=true){if(!prayer)return'SINGLE';if(!record)return'AWAL';if(record.statusFinalisasi==='BELUM_FINAL'||record.tahapAbsensi==='AWAL')return'AKHIR';return'FINAL_VIEW'}
  function initialItem(student,status){const value=String(status||student?.status||'H');return{nama:student.nama,namaSantri:student.nama,status:value,statusAwal:value,statusAkhir:value==='T'?'':value,statusFinal:value==='T'?'':value,final:false,keteranganTerlambat:String(student.keteranganTerlambat||'').trim(),usrahAsal:student.usrah}}
  function finalizeItem(item,note=''){const status=String(item.statusAwal||item.status||'H'),text=String(note||item.keteranganTerlambat||'').trim();return{...item,status,statusAwal:status,statusAkhir:status,statusFinal:status,final:true,keteranganTerlambat:status==='T'?text:'',keteranganAbsensiAkhir:status==='T'?text:'',waktuFinalisasi:new Date().toISOString()}}
  function missingLateNotes(items=[]){return items.filter(item=>String(item.statusAwal||item.status)==='T'&&!String(item.keteranganTerlambat||'').trim())}
  return Object.freeze({version:2,isCongregationalPrayer,stage,initialItem,finalizeItem,missingLateNotes});
});
