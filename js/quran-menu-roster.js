/* Preserve the Tahsin/Tahfiz menu's class-based roster in both entry points. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./student-program-applicability.js'):root.CahayaStudentProgramApplicability);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CahayaQuranMenuRoster=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(A){
  const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function rows(classes,selectedClasses,program,assignments={}){
    const result=[],seen=new Set();
    for(const kelas of selectedClasses){
      const source=classes?.[kelas]||[];
      for(const nama of Array.isArray(source)?source:Object.values(source)){
        if(typeof nama!=='string'||!nama.trim())continue;
        const context={classes,className:kelas,current:true};
        const studentKey=A.identityKey(nama,kelas),storageKey=A.assignmentKey(nama,assignments,context),record=assignments[storageKey]||{};
        const assigned=A.currentProgram(nama,context)||String(record.programQuran||'').trim();
        if(['Tahsin','Tahfiz'].includes(program)&&assigned&&key(assigned)!==key(program))continue;
        if(seen.has(`${kelas}/${studentKey}`))continue;
        seen.add(`${kelas}/${studentKey}`);
        result.push({nama,kelas,key:studentKey,storageKey,record,assigned:!!assigned});
      }
    }
    return result.sort((a,b)=>a.kelas.localeCompare(b.kelas,'id',{numeric:true})||a.nama.localeCompare(b.nama,'id'));
  }
  return {rows};
});
