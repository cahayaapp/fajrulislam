/* Read-only projection of the authoritative Mentor record for a linked child. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaWaliMentoring=api})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const name=value=>String(value||'').trim().replace(/\s+/g,' ').toUpperCase();
  function date(value){
    if(value==null||value==='')return '';
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);
    const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;
  }
  function normalize(record,key,child){
    if(!record||typeof record!=='object'||!name(child))return null;
    const student=record.namaSantri||record.santri||record.studentName;
    if(name(student)!==name(child))return null;
    const result=record.hasilTarget;
    // Explicit projection: private Mentor notes, identifiers and unrelated fields
    // are never passed to the Wali renderer.
    return {id:key,date:date(record.tanggal||record.mentoringDate||record.timestamp||record.createdAt),
      student,usrah:record.usrah||record.namaUsrah||'',mentor:record.mentor||record.pelaksana||'',
      gratitude:record.syukurPekan||record.gratitude||'',focusType:record.fokusTipe||record.focusType||'',
      target:record.targetBaru||record.target||record.targetPertumbuhan||'',why:record.strongWhy||record.whySantri||'',
      strategy:record.strategi||record.strategy||'',clarified:record.cahayaKlarifikasi||null,legacyCahaya:record.checkinCahaya||null,
      result:result?{status:result.status,description:result.keterangan||'',date:date(result.dinilaiAt)}:null};
  }
  function select(records,child,start,end){return Object.entries(records||{}).map(([key,v])=>normalize(v,key,child)).filter(v=>v&&v.date&&v.date>=start&&v.date<=end).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));}
  return Object.freeze({name,date,normalize,select});
});
