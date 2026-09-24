(function(root,factory){const api=factory(root?.CahayaRoleSystemV2);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaUserManagementV2=api})(typeof window!=='undefined'?window:globalThis,function(RoleSystem){
  'use strict';
  const ROLE_IDS=Object.freeze([
    'GURU_PONDOK','GURU_PKBM','NAQIB','NAQIBAH','KONSELOR','MENTOR_USRAH','MANAJER','SUPERVISOR','DIREKTUR','KESEHATAN','LAYANAN_KEBERSIHAN','DAPUR','SARPRAS','MEDIA','WALI_SANTRI'
  ]);
  const ROLE_SET=new Set(ROLE_IDS);
  const LABELS=Object.freeze({
    GURU_PONDOK:'Guru Pondok',GURU_PKBM:'Guru PKBM',NAQIB:'Naqib',NAQIBAH:'Naqibah',KONSELOR:'Konselor',MENTOR_USRAH:'Mentor Usrah',MANAJER:'Manajer',SUPERVISOR:'Supervisor',DIREKTUR:'Direktur',KESEHATAN:'Kesehatan',LAYANAN_KEBERSIHAN:'Layanan & Kebersihan',DAPUR:'Dapur',SARPRAS:'Sarpras',MEDIA:'Media',WALI_SANTRI:'Wali Santri'
  });
  const AREA_ROLES=Object.freeze(['GURU_PONDOK','GURU_PKBM','NAQIB','NAQIBAH','MENTOR_USRAH','KONSELOR','KESEHATAN','LAYANAN_KEBERSIHAN','DAPUR','SARPRAS','MEDIA']);
  const ids=value=>[...new Set((Array.isArray(value)?value:[]).map(v=>String(v||'').trim()).filter(Boolean))];
  const exactRoles=value=>ids(value).filter(v=>ROLE_SET.has(v));
  function intrinsic(role){
    if(role==='GURU_PONDOK')return {programDomain:'KEPONDOKAN'};
    if(role==='GURU_PKBM')return {programDomain:'PKBM'};
    if(role==='NAQIB')return {unit:'PUTRA'};
    if(role==='NAQIBAH')return {unit:'PUTRI'};
    if(role==='DIREKTUR')return {unit:'ALL'};
    return {};
  }
  function cleanAssignment(role,input={}){
    const base={...intrinsic(role)},unit=['PUTRA','PUTRI','ALL'].includes(input.unit)?input.unit:'',rawLevel=String(input.level||'').toUpperCase(),level=rawLevel==='MUDA'?'MADYA':['PEMULA','MADYA'].includes(rawLevel)?rawLevel:'';
    if(role==='SUPERVISOR')return {...base,unit,supervisedRoles:exactRoles(input.supervisedRoles).filter(r=>AREA_ROLES.includes(r))};
    if(role==='MANAJER'){
      let managedRoles=exactRoles(input.managedRoles).filter(r=>AREA_ROLES.includes(r));
      const programDomain=['KEPONDOKAN','PKBM'].includes(input.programDomain)?input.programDomain:'';
      const area=String(input.area||'').trim().toUpperCase()||(programDomain==='KEPONDOKAN'&&managedRoles.includes('GURU_PONDOK')?'PENDIDIKAN':'');
      if(area==='PEMBINAAN_KARAKTER'&&['PUTRA','PUTRI'].includes(unit))managedRoles=[unit==='PUTRI'?'NAQIBAH':'NAQIB','MENTOR_USRAH','KONSELOR'];
      return {...base,unit,area,managedRoles,programDomain:area==='PEMBINAAN_KARAKTER'?'':programDomain};
    }
    if(role==='MENTOR_USRAH')return {...base,usrahIds:ids(input.usrahIds)};
    if(role==='KONSELOR')return {...base,unit:['PUTRA','PUTRI'].includes(unit)?unit:'',level};
    if(role==='DAPUR')return {...base,unit:['PUTRA','PUTRI','ALL'].includes(unit)?unit:''};
    return base;
  }
  function existingChild(profile={}){
    const preferred=RoleSystem?.existingWaliChildLink?.(profile)||{};
    if(Object.keys(preferred).length)return preferred;
    return typeof profile.namaAnak==='string'&&profile.namaAnak.trim()?{namaAnak:profile.namaAnak}:{};
  }
  function waliStudents(profile={}){
    const raw=Array.isArray(profile.students)?profile.students:(Array.isArray(profile.studentKeys)?profile.studentKeys:[]);
    return raw.map(item=>typeof item==='string'?{studentKey:item}:{...(item||{})}).map(item=>({studentKey:String(item.studentKey||item.santriId||item.id||'').trim(),namaSantri:String(item.namaSantri||item.namaAnak||item.label||'').trim(),kelas:String(item.kelas||item.kelasSantri||'').trim(),usrah:String(item.usrah||item.namaUsrah||'').trim()})).filter(item=>item.studentKey);
  }
  function waliStudentsText(profile={}){return waliStudents(profile).map(item=>[item.studentKey,item.namaSantri,item.kelas,item.usrah].join(' | ').replace(/(?:\s*\|\s*)+$/,'')).join('\n')}
  function parseWaliStudents(value=''){
    const seen=new Set(),rows=[];
    String(value||'').split(/\r?\n/).forEach(line=>{const [studentKey,namaSantri='',kelas='',usrah='']=line.split('|').map(part=>part.trim());if(!studentKey||seen.has(studentKey))return;seen.add(studentKey);rows.push({studentKey,namaSantri,kelas,usrah})});
    return rows;
  }
  function createDraft(profile={}){
    const canonical=Number(profile.roleSystemVersion)===2;
    const roles=canonical?exactRoles(profile.roles):[];
    const assignments=Object.fromEntries(roles.map(role=>[role,cleanAssignment(role,profile.assignments?.[role]||{})]));
    const defaultRole=roles.includes(profile.defaultRole)?profile.defaultRole:(roles[0]||'');
    return {username:String(profile.username||profile.id||''),label:String(profile.label||profile.nama||profile.username||profile.id||''),roles,defaultRole,assignments,namaAnak:String(existingChild(profile).namaAnak||''),waliStudentsText:waliStudentsText(profile),authUid:String(profile.authUid||profile.uid||''),legacyNotice:!canonical&&Boolean(profile.akses||profile.role||profile.jabatan||profile.workspaceRoles)};
  }
  function normalizeDraft(draft={}){
    const roles=exactRoles(draft.roles),assignments={};
    roles.forEach(role=>assignments[role]=cleanAssignment(role,draft.assignments?.[role]||{}));
    return {...draft,roles,defaultRole:roles.includes(draft.defaultRole)?draft.defaultRole:'',assignments,namaAnak:String(draft.namaAnak||'').trim(),students:parseWaliStudents(draft.waliStudentsText),authUid:String(draft.authUid||'').trim()};
  }
  function validate(draft={}){
    const d=normalizeDraft(draft),errors=[];
    if(!String(d.username||'').trim())errors.push('Username wajib diisi.');
    if(!d.roles.length)errors.push('Pilih minimal satu Role V2.');
    if(!d.defaultRole||!d.roles.includes(d.defaultRole))errors.push('Default Role harus dipilih dari role yang aktif.');
    for(const role of d.roles){const a=d.assignments[role]||{};
      if(role==='SUPERVISOR'&&(!a.unit||!a.supervisedRoles.length))errors.push('Supervisor wajib memiliki Unit dan minimal satu Supervisi Role / Area.');
      if(role==='MANAJER'&&(!a.unit||!a.managedRoles.length))errors.push('Manajer wajib memiliki Unit dan minimal satu Kelola Role.');
      if(role==='MANAJER'&&a.managedRoles.some(r=>['GURU_PONDOK','GURU_PKBM'].includes(r))&&!a.programDomain)errors.push('Program Domain wajib dipilih untuk Manajer pendidikan.');
      if(role==='MENTOR_USRAH'&&!a.usrahIds.length)errors.push('Mentor Usrah wajib memiliki minimal satu Usrah.');
      if(role==='KONSELOR'&&(!['PUTRA','PUTRI'].includes(a.unit)||!['PEMULA','MADYA'].includes(a.level)))errors.push('Konselor wajib memiliki Level dan Unit yang valid.');
      if(role==='DAPUR'&&!['PUTRA','PUTRI','ALL'].includes(a.unit))errors.push('Dapur wajib memiliki Area Putra, Putri, atau Keduanya.');
      if(role==='WALI_SANTRI'&&!d.students.length)errors.push('Minimal satu studentKey wajib dihubungkan ke akun Wali.');
      if(role==='WALI_SANTRI'&&d.students.some(item=>/[.#$\[\]\/]/.test(item.studentKey)))errors.push('studentKey Wali mengandung karakter yang tidak valid untuk Firebase.');
    }
    return {ok:!errors.length,errors,d};
  }
  function buildPatch(draft={},now=new Date().toISOString()){
    const result=validate(draft);if(!result.ok)throw new Error(result.errors.join('\n'));
    const d=result.d,patch={username:String(d.username).trim().toLowerCase(),label:String(d.label||d.username).trim(),roleSystemVersion:2,roles:d.roles,defaultRole:d.defaultRole,assignments:d.assignments,updatedAt:now};
    if(d.roles.includes('WALI_SANTRI')){patch.namaAnak=d.namaAnak||d.students[0]?.namaSantri||'';patch.students=d.students;patch.studentKeys=d.students.map(item=>item.studentKey)}
    if(d.authUid)patch.authUid=d.authUid;
    return patch;
  }
  function assignmentSummary(role,a={}){
    const unit=a.unit?` • ${a.unit==='ALL'?'Semua':a.unit==='PUTRA'?'Putra':'Putri'}`:'';
    if(role==='SUPERVISOR')return `${(a.supervisedRoles||[]).map(r=>LABELS[r]||r).join(', ')||'Belum diatur'}${unit}`;
    if(role==='MANAJER')return `${(a.managedRoles||[]).map(r=>LABELS[r]||r).join(', ')||'Belum diatur'}${unit}${a.programDomain?' • '+a.programDomain:''}`;
    if(role==='KONSELOR')return `${a.level?LABELS[a.level]||a.level.charAt(0)+a.level.slice(1).toLowerCase():'Belum diatur'}${unit}`;
    if(role==='MENTOR_USRAH')return (a.usrahIds||[]).join(', ')||'Belum diatur';
    if(a.programDomain)return a.programDomain;
    if(a.unit)return a.unit==='ALL'?'Semua unit':a.unit==='PUTRA'?'Putra':'Putri';
    return '';
  }
  return Object.freeze({ROLE_IDS,LABELS,AREA_ROLES,intrinsic,cleanAssignment,waliStudents,parseWaliStudents,createDraft,normalizeDraft,validate,buildPatch,assignmentSummary});
});
