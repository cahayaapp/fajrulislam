/* Preserve the Tahsin/Tahfiz menu's class-based roster in both entry points. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./student-program-applicability.js'):root.CahayaStudentProgramApplicability);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CahayaQuranMenuRoster=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(A){
  const key=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const studentName=value=>typeof value==='string'?value:String(value?.namaSantri||value?.nama_santri||value?.nama||value?.name||value?.label||'').trim();
  const studentId=(value,name,className)=>String(value&&typeof value==='object'&&(value.santriId||value.studentId||value.id||value.uid)||'').trim()||A.identityKey(name,className);
  const values=value=>Array.isArray(value)?value:Object.values(value||{});
  function today(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),p=Object.fromEntries(parts.map(item=>[item.type,item.value]));return `${p.year}-${p.month}-${p.day}`;}
  function classNameFor(classes,requested){return Object.keys(classes||{}).find(name=>key(name)===key(requested))||'';}
  function scopedMembers(classes,selectedClasses){
    const result=[];
    for(const selected of selectedClasses||[]){
      const exact=classNameFor(classes,selected);
      const sources=exact?[exact]:Object.keys(classes||{}).filter(name=>{
        const token=key(name),group=key(selected);return token&&group.includes(token);
      });
      for(const academicClass of sources)for(const raw of values(classes?.[academicClass])){
        const name=studentName(raw);if(!name)continue;
        result.push({name,raw,studentId:studentId(raw,name,academicClass),academicClass,className:selected||academicClass});
      }
    }
    return result;
  }
  function placedMembers(classes,selectedClasses,periodDate,assignments){
    return scopedMembers(classes,selectedClasses).map(member=>{
      const context={classes,className:member.academicClass,studentId:member.studentId};
      return {...member,placement:A.getQuranProgramPlacement(member.name,periodDate,assignments,null,context)};
    });
  }
  function programMembers(classes,selectedClasses,program,periodDate,assignments){
    const members=placedMembers(classes,selectedClasses,periodDate,assignments),wanted=key(program);
    return members.filter(member=>wanted==='tahsin'?member.placement.programQuran==='TAHSIN'
      // The caller has already proven Quran schedule/class scope. Tahfiz is the
      // complement of Tahsin there; an unset Tahsin level/program is not exclusion.
      :wanted==='tahfiz'?member.placement.programQuran!=='TAHSIN'
      :true);
  }
  function rows(classes,selectedClasses,program,assignments={}){
    const result=[],seen=new Set();
    const members=['tahsin','tahfiz'].includes(key(program))?programMembers(classes,selectedClasses,program,today(),assignments):scopedMembers(classes,selectedClasses);
    for(const member of members){
      const nama=member.name,kelas=member.academicClass,id=member.studentId,context={classes,className:kelas,current:true,studentId:id};
      const studentKey=A.identityKey(nama,kelas),storageKey=A.assignmentKey(nama,assignments,context),record=assignments[storageKey]||{};
      if(seen.has(id))continue;seen.add(id);
      result.push({nama,kelas,key:studentKey,studentId:id,storageKey,record,assigned:!!member.placement?.programQuran});
    }
    return result.sort((a,b)=>a.kelas.localeCompare(b.kelas,'id',{numeric:true})||a.nama.localeCompare(b.nama,'id'));
  }
  function resolveAssessmentStudents({classes={},selectedClasses=[],assessmentKey='',periodDate='',assignments={}}={}){
    const kind=A.subject(assessmentKey),seen=new Set(),result=[];
    const program=kind==='TAHFIZ'?'Tahfiz':kind.startsWith('TAHSIN_')?'Tahsin':'';
    const members=program?programMembers(classes,selectedClasses,program,periodDate,assignments):scopedMembers(classes,selectedClasses);
    for(const member of members){
      const context={classes,className:member.academicClass,studentId:member.studentId};
      const eligibility=kind==='TAHFIZ'?{applicable:true,level:''}:kind?A.applicable(member.name,assessmentKey,periodDate,assignments,null,context):{applicable:true,level:''};
      if(!eligibility.applicable)continue;
      const unique=member.studentId||A.identityKey(member.name,member.academicClass);
      if(seen.has(unique))continue;seen.add(unique);
      result.push({name:member.name,className:member.className,academicClassName:member.academicClass,studentId:unique,tahsinLevel:eligibility.level||''});
    }
    return result.sort((a,b)=>a.academicClassName.localeCompare(b.academicClassName,'id',{numeric:true})||a.name.localeCompare(b.name,'id'));
  }
  return {rows,resolveAssessmentStudents,scopedMembers,programMembers,studentName};
});
